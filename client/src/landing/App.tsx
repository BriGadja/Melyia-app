import { Switch, Route } from "wouter";
import { queryClient } from "../shared/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "../shared/components/ui/toaster";
import { TooltipProvider } from "../shared/components/ui/tooltip";
import Home from "./pages/home";
import NotFound from "../shared/components/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
