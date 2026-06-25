import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { JobDetailsPage } from "./pages/JobDetailsPage";
import DashboardPage from "./pages/DashboardPage";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import CampusDashboard from "./pages/CampusDashboard";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
        <Route path="/campus/dashboard" element={<CampusDashboard />} />
        <Route path="/jobs/:id" element={<JobDetailsPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

