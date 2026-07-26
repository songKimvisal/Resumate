import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/Protectedroute";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgot-password";
import ResetPassword from "./pages/reset-password";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Refund from "./pages/Refund";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ScrollToTop from "./components/ScrollToTop";
// Protected pages
import DashboardShell from "./components/layout/DashboardShell";
import Dashboard from "./pages/dashboard/Dashboard";
import MyResumes from "./pages/dashboard/MyResumes";
import InterviewPrep from "./pages/interviewPrep/InterviewPrep";
import Billing from "./pages/billing/Billing";
import BillingHistory from "./pages/billing/BillingHistory";
import Payment from "./pages/billing/Payment";
import AiUsage from "./pages/aiUsage/AiUsage";
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
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/dev-preview-marketplace" element={<Marketplace />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-resumes" element={<MyResumes />} />
            <Route path="/interview-prep" element={<InterviewPrep />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/billing/history" element={<BillingHistory />} />
            <Route path="/ai-usage" element={<AiUsage />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="/builder" element={<BuilderLayout />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/billing/payment" element={<Payment />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
