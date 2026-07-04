import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/Protectedroute";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/login";
import About from "./pages/About";
import Pricing from "./pages/Pricing";

// Protected pages
import Dashboard from "./pages/dashboard/Dashboard";
import BuilderLayout from "./pages/builder/BuilderLayout";
import Marketplace from "./pages/marketplace/Marketplace";
import Settings from "./pages/settings/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />

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
