import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, Store, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { getTotalItems } = useCart();
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalItems = getTotalItems();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full glass shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">iS</span>
            </div>
            <span className="text-xl font-bold text-gradient hidden sm:block">iSupplya</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Marketplace
            </Link>
            {userRole === 'business' && (
              <>
                <Link to="/menu" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  My Menu
                </Link>
                <Link to="/account" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </>
            )}
            {userRole === 'customer' && (
              <Link to="/account" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                My Orders
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs gradient-primary border-0">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/account')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {userRole === 'business' ? 'Dashboard' : 'My Orders'}
                  </DropdownMenuItem>
                  {userRole === 'business' && (
                    <DropdownMenuItem onClick={() => navigate('/menu')}>
                      <Store className="mr-2 h-4 w-4" />
                      My Menu
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/auth">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button size="sm" className="gradient-primary border-0 text-primary-foreground">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-2">
              <Link
                to="/"
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Marketplace
              </Link>
              {userRole === 'business' && (
                <>
                  <Link
                    to="/menu"
                    className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Menu
                  </Link>
                  <Link
                    to="/account"
                    className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </>
              )}
              {userRole === 'customer' && (
                <Link
                  to="/account"
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Orders
                </Link>
              )}
              {!user && (
                <div className="flex gap-2 px-4 pt-2">
                  <Link to="/auth" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/auth?mode=signup" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full gradient-primary border-0">Get Started</Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
