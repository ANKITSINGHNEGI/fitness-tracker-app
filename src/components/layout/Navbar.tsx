import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Dumbbell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Workouts", path: "/workouts" },
  { name: "Nutrition", path: "/nutrition" },
  { name: "Progress", path: "/progress" },
  { name: "Goals", path: "/goals" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isLanding ? "bg-transparent" : "bg-background/80 backdrop-blur-xl border-b border-border"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
                <Dumbbell className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <span className={cn(
              "font-display font-bold text-xl",
              isLanding ? "text-primary-foreground" : "text-foreground"
            )}>
              FitTrack
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "nav-link font-medium",
                  location.pathname === link.path && "active text-primary",
                  isLanding && "text-primary-foreground/80 hover:text-primary-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Button variant={isLanding ? "hero-outline" : "ghost"} size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button variant={isLanding ? "hero" : "gradient"} size="sm" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "lg:hidden p-2 rounded-lg transition-colors",
              isLanding ? "text-primary-foreground hover:bg-primary-foreground/10" : "hover:bg-muted"
            )}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        "lg:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border transition-all duration-300 overflow-hidden",
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="container mx-auto px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "block py-3 px-4 rounded-lg font-medium transition-colors",
                location.pathname === link.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {link.name}
            </Link>
          ))}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/login" onClick={() => setIsOpen(false)}>Login</Link>
            </Button>
            <Button variant="gradient" className="flex-1" asChild>
              <Link to="/signup" onClick={() => setIsOpen(false)}>Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
