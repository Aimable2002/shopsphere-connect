import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">iS</span>
              </div>
              <span className="text-xl font-bold text-gradient">iSupplya</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your go-to platform for discovering and booking the best accommodation services - dinners, rooms, and reservations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Marketplace
              </Link>
              <Link to="/auth?mode=signup&role=business" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Register Business
              </Link>
              <Link to="/cart" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cart
              </Link>
            </nav>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/?category=dinners" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Dinners
              </Link>
              <Link to="/?category=rooms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Rooms
              </Link>
              <Link to="/?category=apartments" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Apartments
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} iSupplya. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Made with <Heart className="h-4 w-4 text-primary fill-primary" /> for hospitality
          </p>
        </div>
      </div>
    </footer>
  );
}
