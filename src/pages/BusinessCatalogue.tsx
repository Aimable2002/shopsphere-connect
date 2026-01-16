import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { useBusiness } from '@/hooks/useBusinesses';
import { useProducts } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Phone, Mail, Store } from 'lucide-react';

export default function BusinessCatalogue() {
  const { id } = useParams<{ id: string }>();
  const { data: business, isLoading: businessLoading } = useBusiness(id!);
  const { data: products, isLoading: productsLoading } = useProducts({ businessId: id });

  if (businessLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-48 w-full rounded-xl mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Business not found</h1>
          <Link to="/" className="text-primary hover:underline">Go back to marketplace</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Business Header */}
        <section className="bg-muted/50 py-8">
          <div className="container mx-auto px-4">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Link>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="h-32 w-32 rounded-xl bg-card border border-border overflow-hidden flex-shrink-0">
                {business.logo_url ? (
                  <img src={business.logo_url} alt={business.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center gradient-primary">
                    <Store className="h-12 w-12 text-primary-foreground/50" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{business.name}</h1>
                {business.description && (
                  <p className="text-muted-foreground mb-4">{business.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {business.address && (
                    <Badge variant="secondary" className="font-normal">
                      <MapPin className="h-3 w-3 mr-1" />
                      {business.address}
                    </Badge>
                  )}
                  {business.phone && (
                    <Badge variant="secondary" className="font-normal">
                      <Phone className="h-3 w-3 mr-1" />
                      {business.phone}
                    </Badge>
                  )}
                  {business.email && (
                    <Badge variant="secondary" className="font-normal">
                      <Mail className="h-3 w-3 mr-1" />
                      {business.email}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">Products ({products?.length || 0})</h2>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : products?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} showBusiness={false} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">This business hasn't added any products yet.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
