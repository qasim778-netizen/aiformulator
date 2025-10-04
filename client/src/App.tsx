import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatWidget } from "@/components/chat-widget";
import ActivityNotification from "@/components/ActivityNotification";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Browse from "@/pages/browse";
import Category from "@/pages/category";
import Formulation from "@/pages/formulation";
import Admin from "@/pages/admin";
import MyAccountPage from "@/pages/my-account";
import About from "@/pages/about";
import FAQ from "@/pages/faq";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import Disclaimer from "@/pages/disclaimer";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import Demo from "@/pages/demo";
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
      <Route path="/my-account" component={MyAccountPage} />
      <Route path="/about" component={About} />
      <Route path="/faq" component={FAQ} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/demo" component={Demo} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/disclaimer" component={Disclaimer} />
      <Route>
        <Home />
      </Route>
    </Switch>
  );
}

function AppContent() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <Router />
      </main>
      <Footer />
      
      <ChatWidget 
        isOpen={isChatOpen} 
        onToggle={() => setIsChatOpen(!isChatOpen)} 
      />
      
      <ActivityNotification />
      <Toaster />
    </div>
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
