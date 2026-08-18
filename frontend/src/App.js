import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { SessionProvider } from "@/context/SessionContext";
import LandingPage from "@/pages/LandingPage";
import AppLayout from "@/layouts/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import OpportunityInboxPage from "@/pages/OpportunityInboxPage";
import CustomerProfilePage from "@/pages/CustomerProfilePage";
import ApprovalCenterPage from "@/pages/ApprovalCenterPage";
import WorkflowBuilderPage from "@/pages/WorkflowBuilderPage";
import ImpactReportPage from "@/pages/ImpactReportPage";
import SettingsPage from "@/pages/SettingsPage";
import OpportunityDetailPage from "@/pages/OpportunityDetailPage";

function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="inbox" element={<OpportunityInboxPage />} />
            <Route path="opportunities/:id" element={<OpportunityDetailPage />} />
            <Route path="customers/:id" element={<CustomerProfilePage />} />
            <Route path="approvals" element={<ApprovalCenterPage />} />
            <Route path="workflows" element={<WorkflowBuilderPage />} />
            <Route path="impact" element={<ImpactReportPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
        <Toaster theme="dark" position="top-right" richColors />
      </BrowserRouter>
    </SessionProvider>
  );
}

export default App;
