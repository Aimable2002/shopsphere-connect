import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ProductCategory } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: ProductCategory | 'all';
  onCategoryChange: (value: ProductCategory | 'all') => void;
  priceRange: [number, number | null];
  onPriceRangeChange: (value: [number, number | null]) => void;
}

export function ProductFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = category !== 'all' || priceRange[0] > 0;

  const clearFilters = () => {
    onCategoryChange('all');
    onPriceRangeChange([0, null]);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={category} onValueChange={(v) => onCategoryChange(v as ProductCategory | 'all')}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="dinners">🍽️ Dinners</SelectItem>
            <SelectItem value="rooms">🛏️ Rooms</SelectItem>
            <SelectItem value="apartments">🏢 Apartments</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Min Price Filter Only */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Minimum Price</Label>
          <span className="text-sm text-muted-foreground">
            ${priceRange[0]}+
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={priceRange[0]}
            onChange={(e) => onPriceRangeChange([Number(e.target.value), null])}
            className="w-full"
            min={0}
            placeholder="Min price"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products or businesses..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Mobile Filter Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden relative">
              <SlidersHorizontal className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filters */}
      <div className="hidden md:flex items-end gap-4 p-4 bg-card rounded-xl border border-border">
        <div className="flex-1 max-w-xs">
          <Label className="mb-2 block">Category</Label>
          <Select value={category} onValueChange={(v) => onCategoryChange(v as ProductCategory | 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="dinners">🍽️ Dinners</SelectItem>
              <SelectItem value="rooms">🛏️ Rooms</SelectItem>
              <SelectItem value="apartments">🏢 Apartments</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 max-w-xs space-y-2">
          <Label>Min Price</Label>
          <Input
            type="number"
            value={priceRange[0]}
            onChange={(e) => onPriceRangeChange([Number(e.target.value), null])}
            min={0}
            placeholder="0"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
