import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Portfolio from "@/pages/Portfolio";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import Vault from "@/pages/Vault";
import BondingCurvePage from "@/pages/BondingCurve";
import Providers from "@/providers";

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
    path: "/signalStatistics",
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
  {
    path: "/bonding-curve",
    element: <BondingCurvePage />,
  },
];

const App = () => (
  <Providers>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        {layoutedRoutesList.map(({ path, element }, idx) => (
          <Route key={idx} path={path} element={<Layout>{element}</Layout>} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </Providers>
);

export default App;
