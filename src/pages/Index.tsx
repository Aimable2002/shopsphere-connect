import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductFilters } from '@/components/products/ProductFilters';
import { BusinessCard } from '@/components/business/BusinessCard';
import { TestimonialCard } from '@/components/testimonials/TestimonialCard';
import { TestimonialForm } from '@/components/testimonials/TestimonialForm';
import { useProducts } from '@/hooks/useProducts';
import { useBusinesses } from '@/hooks/useBusinesses';
import { useTestimonials } from '@/hooks/useTestimonials';
import { ProductCategory } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { UtensilsCrossed, Bed, Building2, Store, Sparkles } from 'lucide-react';

export default function Index() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  const { data: products, isLoading: productsLoading } = useProducts({
    search,
    category,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
  });

  const { data: businesses, isLoading: businessesLoading } = useBusinesses({ search });
  const { data: testimonials } = useTestimonials();

  const maxPrice = useMemo(() => {
    if (!products?.length) return 1000;
    return Math.max(...products.map(p => Number(p.price)), 1000);
  }, [products]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="gradient-hero py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Accommodation Services Marketplace</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Find Your Perfect <span className="text-gradient">Stay</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Discover amazing dinners, comfortable rooms, and convenient reservations from local businesses.
            </p>
            
            {/* Category Quick Links */}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setCategory('dinners')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all"
              >
                <UtensilsCrossed className="h-5 w-5 text-orange-500" />
                <span className="font-medium">Dinners</span>
              </button>
              <button
                onClick={() => setCategory('rooms')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all"
              >
                <Bed className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Rooms</span>
              </button>
              <button
                onClick={() => setCategory('apartments')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all"
              >
                <Building2 className="h-5 w-5 text-emerald-500" />
                <span className="font-medium">Apartments</span>
              </button>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container mx-auto px-4 py-8">
          <Tabs defaultValue="products" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="products" className="gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="businesses" className="gap-2">
                <Store className="h-4 w-4" />
                Businesses
              </TabsTrigger>
            </TabsList>

            <ProductFilters
              search={search}
              onSearchChange={setSearch}
              category={category}
              onCategoryChange={setCategory}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              maxPrice={maxPrice}
            />

            <TabsContent value="products" className="space-y-6">
              {productsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-80 rounded-xl" />
                  ))}
                </div>
              ) : products?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">No products found. Try adjusting your filters.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="businesses" className="space-y-6">
              {businessesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-xl" />
                  ))}
                </div>
              ) : businesses?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {businesses.map(business => (
                    <BusinessCard key={business.id} business={business} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">No businesses found.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* Testimonials */}
        <section className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">What Our Users Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {testimonials?.slice(0, 3).map(t => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </div>
            <div className="max-w-lg mx-auto">
              <h3 className="text-xl font-semibold text-center mb-4">Share Your Experience</h3>
              <TestimonialForm />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
