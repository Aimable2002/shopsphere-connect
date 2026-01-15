import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useProducts } from '@/hooks/useProducts';
import { useBusinesses } from '@/hooks/useBusinesses';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Phone, Store } from 'lucide-react';

const BusinessCatalogue = () => {
  const { businessId } = useParams<{ businessId: string }>();
  
  const { data: products = [], isLoading: productsLoading } = useProducts({
    businessId: businessId,
  });

  const { data: businesses = [] } = useBusinesses({});
  const business = businesses.find(b => b.id === businessId);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Link to="/">
          <Button variant="ghost" className="mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
        </Link>

        {/* Business Header */}
        {business ? (
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Business Logo */}
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-card overflow-hidden flex-shrink-0 shadow-lg">
                {business.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={business.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                    <Store className="w-12 h-12 text-primary/50" />
                  </div>
                )}
              </div>

              {/* Business Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{business.name}</h1>
                  <Badge className="bg-primary text-primary-foreground">
                    {business.category}
                  </Badge>
                </div>
                
                {business.description && (
                  <p className="text-muted-foreground mb-4">{business.description}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {business.address && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{business.address}</span>
                    </div>
                  )}
                  {business.phone_number && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{business.phone_number}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-muted rounded-xl p-6 mb-8 animate-pulse">
            <div className="flex gap-6">
              <div className="w-24 h-24 bg-muted-foreground/20 rounded-xl" />
              <div className="flex-1 space-y-4">
                <div className="h-8 w-48 bg-muted-foreground/20 rounded" />
                <div className="h-4 w-full max-w-md bg-muted-foreground/20 rounded" />
              </div>
            </div>
          </div>
        )}

        {/* Products Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Products from {business?.name || 'this business'}
            {products.length > 0 && (
              <span className="text-muted-foreground font-normal ml-2">
                ({products.length} {products.length === 1 ? 'item' : 'items'})
              </span>
            )}
          </h2>
          <ProductGrid products={products} loading={productsLoading} />
        </div>
      </div>
    </Layout>
  );
};

export default BusinessCatalogue;
