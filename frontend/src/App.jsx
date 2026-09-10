import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import FraudPage from "./pages/FraudPage";
import ReturnsPage from "./pages/ReturnsPage";
import ChargebacksPage from "./pages/ChargebacksPage";
import ReportsPage from "./pages/ReportsPage";

export default function App() {
  return (
    <div className="flex min-h-screen bg-[#090807] light:bg-[#f7f4ef] text-[#f5efe6] light:text-[#181614] transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen overflow-auto bg-[#090807] light:bg-[#f7f4ef] text-[#f5efe6] light:text-[#181614]">
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
