import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Store, User, Menu, X, Package } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, business } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">iSupplya</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                isActive('/') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Store className="w-4 h-4" />
              Marketplace
            </Link>
            <Link
              to="/cart"
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                isActive('/cart') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-accent text-accent-foreground">
                    {totalItems}
                  </Badge>
                )}
              </div>
              Cart
            </Link>
            {user ? (
              <Link
                to="/account"
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/account') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <User className="w-4 h-4" />
                {business?.name || 'Account'}
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="sm" variant="default">
                  Business Login
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 md:hidden">
            <Link to="/cart" className="relative">
              <ShoppingCart className="w-6 h-6 text-foreground" />
              {totalItems > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-accent text-accent-foreground">
                  {totalItems}
                </Badge>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t animate-fade-in">
            <nav className="flex flex-col gap-4">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <Store className="w-5 h-5" />
                Marketplace
              </Link>
              <Link
                to="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                Cart {totalItems > 0 && `(${totalItems})`}
              </Link>
              {user ? (
                <Link
                  to="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <User className="w-5 h-5" />
                  {business?.name || 'Account'}
                </Link>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <User className="w-5 h-5" />
                  Business Login
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
