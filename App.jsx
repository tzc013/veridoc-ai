import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import LandingPage from './pages/LandingPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DocumentsPage from './pages/DocumentsPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import BenchmarkPage from './pages/BenchmarkPage.jsx';

function AppLayout() {
  const [stats, setStats] = useState(null);
  const location = useLocation();

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [location.pathname]);

  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#14B8A6]/20 selection:text-[#2DD4BF] flex flex-col font-sans">
      {!isLanding && <Navbar stats={stats} onSeedRefresh={fetchStats} />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/benchmark" element={<BenchmarkPage />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
