import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Tracking } from './components/Tracking';
import { QuoteRequest } from './components/QuoteRequest';
import { AIAssistant } from './components/AIAssistant';
import { ShipmentProvider } from './contexts/ShipmentContext';
import { NavigationItem } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<NavigationItem>('dashboard');

  return (
    <Router>
      <ShipmentProvider>
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <div className="flex-1 ml-64 flex flex-col min-w-0 transition-all duration-300">
            <Header />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
               <Routes>
                 <Route path="/" element={<Navigate to="/dashboard" replace />} />
                 <Route path="/dashboard" element={<Dashboard />} />
                 <Route path="/tracking" element={<Tracking />} />
                 <Route path="/quote" element={<QuoteRequest />} />
                 <Route path="/insights" element={<AIAssistant />} />
               </Routes>
            </main>
          </div>
        </div>
      </ShipmentProvider>
    </Router>
  );
}

export default App;
