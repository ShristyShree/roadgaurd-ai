import React from 'react';
import { RoadReport } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, MapPin, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface HazardFeedProps {
  reports: RoadReport[];
  onUpvote: (id: any) => void;
}

export const HazardFeed: React.FC<HazardFeedProps> = ({ reports, onUpvote }) => {
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 text-red-700 border-red-100';
      case 'medium': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'low': return 'bg-green-50 text-green-700 border-green-100';
      default: return 'bg-zinc-50 text-zinc-700 border-zinc-100';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-zinc-600" />
          Community Reports
        </h2>
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
          {reports.length} Reports
        </span>
      </div>

      <div className="max-h-[800px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {reports.length === 0 ? (
          <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-zinc-400">No reports found in this area.</p>
          </div>
        ) : (
          reports.map((report, idx) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm hover:border-zinc-300 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getSeverityStyles(report.severity)}`}>
                    {report.severity}
                  </span>
                  <span className="text-xs font-medium text-zinc-400">
                    {formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <button 
                  onClick={() => report.id && onUpvote(report.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-100"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {report.upvotes}
                </button>
              </div>

              <h3 className="font-bold text-zinc-900 mb-1 capitalize flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                {report.hazard_type}
              </h3>
              
              <p className="text-sm text-zinc-600 mb-4 line-clamp-2">
                {report.description || "No description provided."}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-50">
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                  <MapPin className="w-3 h-3" />
                  <span>{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span>
                </div>
                <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                  Conf: {report.confidence}%
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
