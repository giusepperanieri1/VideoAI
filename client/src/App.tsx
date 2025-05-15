import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Editor from "@/pages/editor";
// import Projects from "@/pages/projects";
import Projects from "@/pages/projects-simple";
import Create from "@/pages/create";
import SocialAccounts from "@/pages/social-accounts";
import VideoProgress from "@/pages/video-progress";
import Settings from "@/pages/settings";
import Templates from "@/pages/templates";
import AppLayout from "@/components/AppLayout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/editor" component={Editor} />
      <Route path="/editor/:id" component={Editor} />
      <Route path="/projects" component={Projects} />
      <Route path="/create" component={Create} />
      <Route path="/templates" component={Templates} />
      <Route path="/social-accounts" component={SocialAccounts} />
      <Route path="/activity" component={VideoProgress} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppLayout>
          <Router />
        </AppLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
