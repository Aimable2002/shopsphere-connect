import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { BusinessGrid } from '@/components/business/BusinessGrid';
import { FilterBar } from '@/components/filters/FilterBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProducts, useProductCategories, useProductTypes } from '@/hooks/useProducts';
import { useBusinesses } from '@/hooks/useBusinesses';
import { Package, Store } from 'lucide-react';

const Index = () => {
  const [searchParams] = useSearchParams();
  const businessIdFilter = searchParams.get('business') || '';
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [activeTab, setActiveTab] = useState('products');

  const { data: products = [], isLoading: productsLoading } = useProducts({
    search,
    category: category !== 'all' ? category : undefined,
    type: type !== 'all' ? type : undefined,
    businessId: businessIdFilter || undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
  });

  const { data: businesses = [], isLoading: businessesLoading } = useBusinesses({ search });
  const { data: categories = [] } = useProductCategories();
  const { data: types = [] } = useProductTypes();

  const hasActiveFilters = search !== '' || category !== 'all' || type !== 'all' || priceRange[0] > 0 || priceRange[1] < 1000;

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setType('all');
    setPriceRange([0, 1000]);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Welcome to iSupplya</h1>
          <p className="text-muted-foreground">Discover products from local businesses</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="businesses" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Businesses
            </TabsTrigger>
          </TabsList>

          {activeTab === 'products' && (
            <FilterBar
              search={search}
              onSearchChange={setSearch}
              category={category}
              onCategoryChange={setCategory}
              type={type}
              onTypeChange={setType}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              categories={categories}
              types={types}
              maxPrice={1000}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          )}

          <TabsContent value="products" className="mt-6">
            <ProductGrid products={products} loading={productsLoading} />
          </TabsContent>

          <TabsContent value="businesses" className="mt-6">
            <BusinessGrid businesses={businesses} loading={businessesLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;
