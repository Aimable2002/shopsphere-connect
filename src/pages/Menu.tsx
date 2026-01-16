import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessProducts } from '@/hooks/useProducts';
import { useImageUpload } from '@/hooks/useImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Pencil, Trash2, ImageIcon, Upload, Link as LinkIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ProductCategory } from '@/types';

export default function Menu() {
  const navigate = useNavigate();
  const { user, business, userRole, loading } = useAuth();
  const { data: products, isLoading, refetch } = useBusinessProducts(business?.id || '');
  const { uploadImage, uploading } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'dinners' as ProductCategory,
    image_url: '',
    price_unit: 'fixed' as 'fixed' | 'per_hour' | 'per_day' | 'per_night',
    is_reservable: false,
  });

  useEffect(() => {
    if (!loading && (!user || userRole !== 'business')) {
      navigate('/auth?mode=signup&role=business');
    }
  }, [user, userRole, loading, navigate]);

  const resetForm = () => {
    setForm({ 
      name: '', 
      description: '', 
      price: '', 
      category: 'dinners', 
      image_url: '',
      price_unit: 'fixed',
      is_reservable: false,
    });
    setEditingProduct(null);
    setPreviewUrl('');
    setImageMode('upload');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    const url = await uploadImage(file);
    if (url) {
      setForm(p => ({ ...p, image_url: url }));
      toast.success('Image uploaded!');
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price) {
      toast.error('Please fill in name and price');
      return;
    }

    if (!business) {
      toast.error('Please set up your business first in Account settings');
      return;
    }

    const productData = {
      business_id: business.id,
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      category: form.category,
      image_url: form.image_url || null,
      price_unit: form.price_unit,
      is_reservable: form.is_reservable || form.category === 'apartments' || form.category === 'rooms',
    };

    if (editingProduct) {
      const { error } = await supabase.from('products').update(productData).eq('id', editingProduct);
      if (error) {
        toast.error('Failed to update product');
      } else {
        toast.success('Product updated!');
        refetch();
      }
    } else {
      const { error } = await supabase.from('products').insert(productData);
      if (error) {
        toast.error('Failed to add product');
      } else {
        toast.success('Product added!');
        refetch();
      }
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (product: any) => {
    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      category: product.category,
      image_url: product.image_url || '',
      price_unit: product.price_unit || 'fixed',
      is_reservable: product.is_reservable || false,
    });
    setPreviewUrl(product.image_url || '');
    setImageMode(product.image_url ? 'url' : 'upload');
    setEditingProduct(product.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete product');
    } else {
      toast.success('Product deleted');
      refetch();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Catalogue</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your products and reservable services</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] p-0">
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[calc(90vh-100px)] px-6 pb-6">
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={form.category} onValueChange={(v) => setForm(p => ({ ...p, category: v as ProductCategory }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dinners">Dinners</SelectItem>
                          <SelectItem value="rooms">Rooms</SelectItem>
                          <SelectItem value="apartments">Apartments</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Pricing Options for Reservable Products */}
                  {(form.category === 'rooms' || form.category === 'apartments') && (
                    <div className="space-y-3 p-3 rounded-lg bg-muted/50">
                      <Label className="text-sm font-medium">Reservation Settings</Label>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Pricing Type</Label>
                        <Select value={form.price_unit} onValueChange={(v) => setForm(p => ({ ...p, price_unit: v as any }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed Price</SelectItem>
                            <SelectItem value="per_hour">Per Hour</SelectItem>
                            <SelectItem value="per_day">Per Day</SelectItem>
                            <SelectItem value="per_night">Per Night</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Enable Booking</Label>
                        <Switch
                          checked={form.is_reservable}
                          onCheckedChange={(v) => setForm(p => ({ ...p, is_reservable: v }))}
                        />
                      </div>
                    </div>
                  )}

                  {/* Image Upload Section */}
                  <div className="space-y-3">
                    <Label>Product Image</Label>
                    <Tabs value={imageMode} onValueChange={(v) => setImageMode(v as 'upload' | 'url')}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload" className="gap-2">
                          <Upload className="h-4 w-4" />
                          Upload
                        </TabsTrigger>
                        <TabsTrigger value="url" className="gap-2">
                          <LinkIcon className="h-4 w-4" />
                          URL
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="mt-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              <p className="text-sm text-muted-foreground">Uploading...</p>
                            </div>
                          ) : previewUrl ? (
                            <div className="space-y-2">
                              <img src={previewUrl} alt="Preview" className="h-24 w-24 object-cover rounded-lg mx-auto" />
                              <p className="text-sm text-muted-foreground">Click to change image</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Click to upload an image</p>
                              <p className="text-xs text-muted-foreground">Max 5MB, JPG/PNG</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="url" className="mt-3">
                        <Input
                          value={form.image_url}
                          onChange={(e) => {
                            setForm(p => ({ ...p, image_url: e.target.value }));
                            setPreviewUrl(e.target.value);
                          }}
                          placeholder="https://example.com/image.jpg"
                        />
                        {form.image_url && imageMode === 'url' && (
                          <div className="mt-3">
                            <img
                              src={form.image_url}
                              alt="Preview"
                              className="h-24 w-24 object-cover rounded-lg mx-auto"
                              onError={() => setPreviewUrl('')}
                            />
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>

                  <Button onClick={handleSubmit} className="w-full gradient-primary border-0" disabled={uploading}>
                    {uploading ? 'Uploading...' : editingProduct ? 'Update Product' : 'Add Product'}
                  </Button>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        {!business && (
          <Card className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <p className="text-amber-700 dark:text-amber-400">
                Please set up your business profile first in <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/account')}>Account Settings</Button>
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : products?.length ? (
          <div className="space-y-6">
            {/* Reservable Services Section */}
            {products.filter(p => p.is_reservable || p.category === 'rooms' || p.category === 'apartments').length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                  </span>
                  Reservable Services
                </h2>
                <p className="text-xs text-muted-foreground mb-4">Rooms, apartments, and other bookable services with check-in/out times</p>
                <div className="grid gap-3 sm:gap-4">
                  {products.filter(p => p.is_reservable || p.category === 'rooms' || p.category === 'apartments').map(product => (
                    <Card key={product.id} className="border-blue-500/20">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base">{product.name}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="font-bold text-primary text-sm sm:text-base">
                                ${Number(product.price).toFixed(2)}
                                <span className="text-xs font-normal text-muted-foreground">
                                  {product.price_unit === 'per_hour' && '/hour'}
                                  {product.price_unit === 'per_day' && '/day'}
                                  {product.price_unit === 'per_night' && '/night'}
                                </span>
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{product.category}</span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Products Section */}
            {products.filter(p => !p.is_reservable && p.category !== 'rooms' && p.category !== 'apartments').length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-orange-500" />
                  </span>
                  Products
                </h2>
                <p className="text-xs text-muted-foreground mb-4">Regular items for sale with fixed pricing</p>
                <div className="grid gap-3 sm:gap-4">
                  {products.filter(p => !p.is_reservable && p.category !== 'rooms' && p.category !== 'apartments').map(product => (
                    <Card key={product.id} className="border-border/50">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base">{product.name}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-bold text-primary text-sm sm:text-base">${Number(product.price).toFixed(2)}</span>
                              <span className="text-xs px-2 py-0.5 rounded bg-muted">{product.category}</span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="py-16 text-center">
              <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No products yet. Add your first product!</p>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
