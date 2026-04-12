import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLogoutUser } from "@workspace/api-client-react";
import logoNamePath from "@assets/logo_name2.jpg";
import { LogOut, Menu, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, role, isLoading } = useAuth();
  const logoutUser = useLogoutUser();

  const pathname = location?.split("?")[0] ?? "/";
  // Use actual user role if available, otherwise guess from URL
  const interfaceType: "public" | "student" | "owner" | "admin" = 
    role === "admin" ? "admin" :
    role === "owner" ? "owner" :
    role === "student" ? "student" :
    pathname.startsWith("/admin") ? "admin" :
    pathname.startsWith("/owner") ? "owner" :
    pathname.startsWith("/dashboard") ? "student" :
    "public";

  const handleLogout = () => {
    logoutUser.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("dormkada_token");
        window.location.href = "/";
      }
    });
  };

  const getInterfaceDashboardLink = () => {
    switch (interfaceType) {
      case "admin":
        return "/admin";
      case "owner":
        return "/owner";
      case "student":
        return "/dashboard";
      default:
        return "/dashboard";
    }
  };

  const getInterfaceDashboardLabel = () => {
    switch (interfaceType) {
      case "admin":
        return "Admin Dashboard";
      case "owner":
        return "Owner Dashboard";
      case "student":
        return "Student Dashboard";
      default:
        return "Dashboard";
    }
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
      {interfaceType !== "public" && (
        <Link
          href={getInterfaceDashboardLink()}
          className="text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
        >
          {getInterfaceDashboardLabel()}
        </Link>
      )}
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
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
          {interfaceType === "public" ? (
            <div className="hidden md:flex items-center gap-4">
              <Button asChild variant="ghost">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated && (
                <>
                  <Button asChild variant="ghost" className="gap-2">
                    <Link href={getInterfaceDashboardLink()}>
                      <User className="h-4 w-4" />
                      {getInterfaceDashboardLabel()}
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={handleLogout} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              )}
              {!isAuthenticated && !isLoading && (
                <Button asChild variant="ghost">
                  <Link href="/login">Log in</Link>
                </Button>
              )}
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
                {interfaceType === "public" ? (
                  <div className="flex flex-col gap-4">
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/login">Log in</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/register">Sign up</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    {isAuthenticated && (
                      <>
                        <Link
                          href={getInterfaceDashboardLink()}
                          className="text-sm font-medium text-foreground"
                        >
                          {getInterfaceDashboardLabel()}
                        </Link>
                        <Button
                          variant="outline"
                          onClick={handleLogout}
                          className="justify-start"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </>
                    )}
                    {!isAuthenticated && !isLoading && (
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/login">Log in</Link>
                      </Button>
                    )}
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
