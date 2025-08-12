import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { HashConnectProvider } from "@/contexts/HashConnectContext";
import Layout from "@/components/Layout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Portfolio from "@/pages/Portfolio";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import Vault from "@/pages/Vault";

const queryClient = new QueryClient();

type layoutedRoutesListType = {
  path: string;
  element: JSX.Element;
};

const layoutedRoutesList: layoutedRoutesListType[] = [
  {
    path: "/",
    element: <Dashboard />,
  },
  {
    path: "/SignalStatistics",
    element: <Dashboard />,
  },
  {
    path: "/portfolio",
    element: <Portfolio />,
  },
  {
    path: "/history",
    element: <History />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
  {
    path: "/vault",
    element: <Vault />,
  },
];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HashConnectProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              {layoutedRoutesList.map(({ path, element }) => (
                <Route path={path} element={<Layout>{element}</Layout>} />
              ))}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HashConnectProvider>
  </QueryClientProvider>
);

export default App;
