import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';

const Menu = () => {
  const { business, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useBusinessProducts(business?.id || '');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: 'General', type: 'Product', image_url: '' });

  if (!loading && !business) { navigate('/account'); return null; }

  const resetForm = () => { setForm({ name: '', description: '', price: '', category: 'General', type: 'Product', image_url: '' }); setEditing(null); };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error('Name and price required'); return; }
    const data = { ...form, price: parseFloat(form.price), business_id: business!.id };
    try {
      if (editing) {
        await supabase.from('products').update(data).eq('id', editing);
      } else {
        await supabase.from('products').insert(data);
      }
      queryClient.invalidateQueries({ queryKey: ['business-products'] });
      toast.success(editing ? 'Product updated!' : 'Product added!');
      setDialogOpen(false);
      resetForm();
    } catch { toast.error('Failed to save'); }
  };

  const handleEdit = (p: any) => { setForm({ name: p.name, description: p.description || '', price: String(p.price), category: p.category, type: p.type, image_url: p.image_url || '' }); setEditing(p.id); setDialogOpen(true); };

  const handleDelete = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['business-products'] });
    toast.success('Product deleted');
  };

  const handleToggle = async (id: string, available: boolean) => {
    await supabase.from('products').update({ is_available: available }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['business-products'] });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/account')}><ArrowLeft className="w-5 h-5" /></Button>
            <h1 className="text-2xl font-bold">Menu Management</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Product</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Price *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                <div><Label>Type</Label><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>
                <div><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
                <Button onClick={handleSave} className="w-full">{editing ? 'Update' : 'Add'} Product</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? <p>Loading...</p> : products.length === 0 ? (
          <div className="text-center py-12"><p className="text-muted-foreground">No products yet. Add your first product!</p></div>
        ) : (
          <div className="grid gap-4">
            {products.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">📦</div>}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-primary font-bold">${p.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={p.is_available} onCheckedChange={(v) => handleToggle(p.id, v)} />
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(p)}><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Menu;
