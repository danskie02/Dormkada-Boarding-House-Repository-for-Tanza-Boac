import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Listings from "@/pages/listings";
import ListingDetail from "@/pages/listing-detail";
import Dashboard from "@/pages/dashboard";
import OwnerDashboard from "@/pages/owner-dashboard";
import AddListing from "@/pages/add-listing";
import RoomManagement from "@/pages/room-management";
import AdminDashboard from "@/pages/admin-dashboard";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import About from "@/pages/about";

setAuthTokenGetter(() => localStorage.getItem("dormkada_token"));

// Only configure explicit API URL for production
// In local dev, Vite proxy handles /api requests automatically
if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

const queryClient = new QueryClient();

function Router() {
  const baseFromEnv = import.meta.env.BASE_URL;
  // Wouter's `base` should be omitted for local "/" deployments.
  const wouterBase = baseFromEnv && baseFromEnv !== "/" ? baseFromEnv : undefined;

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Navbar />
      <main className="flex-1 mt-16">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/listings" component={Listings} />
          <Route path="/listings/:id" component={ListingDetail} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/owner" component={OwnerDashboard} />
          <Route path="/owner/add-listing" component={AddListing} />
          <Route path="/owner/rooms/:boardingHouseId" component={RoomManagement} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/about" component={About} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const baseFromEnv = import.meta.env.BASE_URL;
  // Wouter's `base` should be omitted for local "/" deployments.
  const wouterBase = baseFromEnv && baseFromEnv !== "/" ? baseFromEnv : undefined;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={wouterBase}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
