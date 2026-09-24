import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { initializeDefaultData } from '@/lib/localStore';
import PageNotFound from './lib/PageNotFound';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TodayPlan from './pages/TodayPlan';
import CFAProgress from './pages/CFAProgress';
import CATProgress from './pages/CATProgress';
import MockTests from './pages/MockTests';
import Lab from './pages/Lab';
import Targets from './pages/Targets';
import MasterPlan from './pages/MasterPlan';
import ActionPlan from './pages/ActionPlan';
import Drill from './pages/Drill';
import Settings from './pages/Settings';

function App() {
  useEffect(() => {
    initializeDefaultData();
  }, []);

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/today" element={<TodayPlan />} />
            <Route path="/cfa" element={<CFAProgress />} />
            <Route path="/cat" element={<CATProgress />} />
            <Route path="/mocks" element={<MockTests />} />
            <Route path="/lab" element={<Lab />} />
            {/* The three labs were separate pages before they became tabs. */}
            <Route path="/dilr" element={<Navigate to="/lab?tab=dilr" replace />} />
            <Route path="/qa" element={<Navigate to="/lab?tab=qa" replace />} />
            <Route path="/varc" element={<Navigate to="/lab?tab=varc" replace />} />
            <Route path="/drill" element={<Drill />} />
            <Route path="/targets" element={<Targets />} />
            <Route path="/plan" element={<MasterPlan />} />
            <Route path="/action" element={<ActionPlan />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
