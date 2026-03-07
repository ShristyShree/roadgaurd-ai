/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { RoadReport, DashboardStats, Severity, HAZARD_TYPES } from './types';
import { Dashboard } from './components/Dashboard';
import { RoadMap } from './components/RoadMap';
import { ReportForm } from './components/ReportForm';
import { HazardFeed } from './components/HazardFeed';
import { generateRoadSummary } from './services/gemini';
import { Shield, Filter, Search, Info, Bell, Menu, X, Sparkles, Loader2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, increment } from 'firebase/firestore';

export default function App() {
  const [reports, setReports] = useState<RoadReport[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ total: 0, highSeverity: 0, mostCommon: 'None' });
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [showNearbyAlert, setShowNearbyAlert] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const fetchData = () => {
    const q = query(collection(db, "hazards"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as RoadReport[];
      
      setReports(reportsData);

      // Calculate stats
      const highSeverity = reportsData.filter(r => r.severity === 'high').length;
      const typeCounts: Record<string, number> = {};
      reportsData.forEach(r => {
        typeCounts[r.hazard_type] = (typeCounts[r.hazard_type] || 0) + 1;
      });
      const mostCommon = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

      setStats({
        total: reportsData.length,
        highSeverity,
        mostCommon
      });

      // Check for nearby high severity hazards
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude } = pos.coords;
          const nearbyHigh = reportsData.find((r: RoadReport) => {
            if (r.severity !== 'high') return false;
            const dist = Math.sqrt(Math.pow(r.latitude - latitude, 2) + Math.pow(r.longitude - longitude, 2));
            return dist < 0.01; // Roughly 1km
          });
          if (nearbyHigh) setShowNearbyAlert(true);
        });
      }
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = fetchData();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updateSummary = async () => {
      if (reports.length > 0) {
        setIsGeneratingSummary(true);
        try {
          const summary = await generateRoadSummary(reports);
          setAiSummary(summary);
        } catch (error) {
          console.error("Failed to generate summary", error);
        } finally {
          setIsGeneratingSummary(false);
        }
      } else {
        setAiSummary("No reports available to analyze yet. Start by reporting a hazard!");
      }
    };

    updateSummary();
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const typeMatch = filterType === 'all' || r.hazard_type === filterType;
      const severityMatch = filterSeverity === 'all' || r.severity === filterSeverity;
      return typeMatch && severityMatch;
    });
  }, [reports, filterType, filterSeverity]);

  const handleReportSuccess = (newReport: RoadReport) => {
    setReports(prev => [newReport, ...prev]);
    setMapCenter([newReport.latitude, newReport.longitude]);
    fetchData(); // Refresh stats
  };

  const handleUpvote = async (id: string) => {
    try {
      const reportRef = doc(db, "hazards", id);
      await updateDoc(reportRef, {
        upvotes: increment(1)
      });
    } catch (error) {
      console.error("Failed to upvote", error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 p-2 rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">RoadGuard AI</h1>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Intelligent Infrastructure</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 bg-zinc-100 px-3 py-1.5 rounded-full border border-zinc-200">
              <Search className="w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search location..." 
                className="bg-transparent border-none text-sm outline-none w-48"
              />
            </div>
            <button className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all">
              Connect Wallet
            </button>
          </div>

          <button 
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Nearby Alert */}
        <AnimatePresence>
          {showNearbyAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-600 text-white rounded-2xl shadow-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold">Nearby Hazard Alert!</p>
                  <p className="text-sm text-red-100">A high-severity hazard has been reported within 1km of your location.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNearbyAlert(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <Dashboard stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Map & Filters */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm font-semibold text-zinc-500">Filters:</span>
                </div>
                
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                >
                  <option value="all">All Types</option>
                  {HAZARD_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>

                <select 
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                >
                  <option value="all">All Severities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100">
                <Info className="w-3.5 h-3.5" />
                <span>Showing {filteredReports.length} reports</span>
              </div>
            </div>

            <RoadMap reports={filteredReports} center={mapCenter} zoom={13} />
            
            <div className="bg-zinc-900 text-white p-8 rounded-3xl relative overflow-hidden">
              <div className="relative z-10 max-w-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-3xl font-bold">Smart AI Summary</h2>
                </div>
                
                {isGeneratingSummary ? (
                  <div className="flex items-center gap-3 text-zinc-400 mb-6">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Gemini is analyzing road conditions...</span>
                  </div>
                ) : (
                  <p className="text-zinc-400 mb-6 leading-relaxed">
                    {aiSummary}
                  </p>
                )}
                
                <button 
                  onClick={() => fetchData()}
                  className="bg-white text-zinc-900 px-6 py-3 rounded-xl font-bold hover:bg-zinc-100 transition-all flex items-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  Refresh Analysis
                </button>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full -ml-24 -mb-24" />
            </div>
          </div>

          {/* Right Column: Report & Feed */}
          <div className="lg:col-span-4 space-y-8">
            <ReportForm onReportSuccess={handleReportSuccess} />
            <HazardFeed reports={filteredReports} onUpvote={handleUpvote} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
            <Shield className="w-5 h-5" />
            <span className="font-bold tracking-tight">RoadGuard AI</span>
          </div>
          <p className="text-zinc-400 text-sm">© 2024 RoadGuard AI. Powered by Gemini Vision & Community Insights.</p>
        </div>
      </footer>
    </div>
  );
}
