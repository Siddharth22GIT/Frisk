import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import FraudPage from "./pages/FraudPage";
import ReturnsPage from "./pages/ReturnsPage";
import ChargebacksPage from "./pages/ChargebacksPage";
import ReportsPage from "./pages/ReportsPage";

export default function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen overflow-auto">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/fraud" element={<FraudPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/chargebacks" element={<ChargebacksPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
