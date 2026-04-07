import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLogoutUser } from "@workspace/api-client-react";
import logoNamePath from "@assets/logo_name_1775521822255.jpg";
import { LogOut, Menu, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, role } = useAuth();
  const logoutUser = useLogoutUser();

  const handleLogout = () => {
    logoutUser.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("dormkada_token");
        window.location.href = "/";
      }
    });
  };

  const getDashboardLink = () => {
    if (role === "admin") return "/admin";
    if (role === "owner") return "/owner";
    return "/dashboard";
  };

  const NavLinks = () => (
    <>
      <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
        Home
      </Link>
      <Link href="/listings" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
        Listings
      </Link>
      <Link href="/about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
        About
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <img src={logoNamePath} alt="DormKada" className="h-8 w-auto object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-4">
              <Link href={getDashboardLink()}>
                <Button variant="ghost" className="gap-2">
                  <User className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/register">
                <Button>Sign up</Button>
              </Link>
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-6 mt-8">
                <NavLinks />
                <div className="h-px bg-border w-full" />
                {isAuthenticated ? (
                  <>
                    <Link href={getDashboardLink()} className="text-sm font-medium text-foreground">
                      Dashboard
                    </Link>
                    <Button variant="outline" onClick={handleLogout} className="justify-start">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-4">
                    <Link href="/login">
                      <Button variant="outline" className="w-full">Log in</Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full">Sign up</Button>
                    </Link>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
