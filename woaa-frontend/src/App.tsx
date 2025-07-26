import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import AlpacaTest from "./pages/AlpacaTest";
import TestRealTimePage from "./pages/TestRealTimePage";
import TestHistoricalWS from "./pages/TestHistoricalWS";

function App() {
  return (
    // <div>
    //   <AlpacaTest />
    // </div>
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/test-data" element={<AlpacaTest />} />
        <Route path="/test-real-ws" element={<TestRealTimePage />} />
        <Route path="/test-hist-ws" element={<TestHistoricalWS />} />
      </Routes>
    </Router>
  );
}

export default App;
