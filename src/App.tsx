import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/Protectedroute";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/login";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Refund from "./pages/Refund";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ScrollToTop from "./components/ScrollToTop";
// Protected pages
import Dashboard from "./pages/dashboard/Dashboard";
import BuilderLayout from "./pages/builder/BuilderLayout";
import Marketplace from "./pages/marketplace/Marketplace";
import Settings from "./pages/settings/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/builder" element={<BuilderLayout />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
