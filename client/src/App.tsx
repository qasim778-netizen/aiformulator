import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TooltipGuidance, GuidanceProvider } from "@/components/ui/tooltip-guidance";
import { useGuidance } from "@/hooks/use-guidance";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Browse from "@/pages/browse";
import Category from "@/pages/category";
import Formulation from "@/pages/formulation";
import Admin from "@/pages/admin";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import FAQ from "@/pages/faq";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/browse" component={Browse} />
      <Route path="/category/:id" component={Category} />
      <Route path="/formulation/:id" component={Formulation} />
      <Route path="/admin" component={Admin} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/faq" component={FAQ} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { activeFlow, completeGuidance, skipGuidance, getSteps } = useGuidance();

  return (
    <GuidanceProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1">
          <Router />
        </main>
        <Footer />
      </div>
      
      {activeFlow && (
        <TooltipGuidance
          steps={getSteps(activeFlow)}
          onComplete={() => completeGuidance(activeFlow)}
          onSkip={skipGuidance}
          isActive={true}
        />
      )}
      
      <Toaster />
    </GuidanceProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
