import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { analyzeRoadImage } from '../services/gemini';
import { RoadReport, Severity } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ReportFormProps {
  onReportSuccess: (report: RoadReport) => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({ onReportSuccess }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        getLocation();
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          setError("Location access denied. Using default coordinates.");
          setLocation({ lat: 20.5937, lng: 78.9629 });
        }
      );
    }
  };

  const handleSubmit = async () => {
    if (!image || !location) return;

    setAnalyzing(true);
    setError(null);

    try {
      const aiResult = await analyzeRoadImage(image);
      
      const reportData = {
        hazard_type: aiResult.hazard_type,
        severity: aiResult.severity as Severity,
        confidence: aiResult.confidence,
        description: description,
        ai_analysis: aiResult.explanation,
        latitude: location.lat,
        longitude: location.lng,
        upvotes: 0,
        timestamp: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "hazards"), reportData);

      onReportSuccess({ 
        ...reportData, 
        id: docRef.id as any, 
        timestamp: new Date().toISOString() 
      } as RoadReport);
      
      // Reset form
      setImage(null);
      setDescription('');
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5 text-zinc-600" />
        Report New Hazard
      </h2>

      <div className="space-y-4">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all
            ${image ? 'border-zinc-300' : 'border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50'}
          `}
        >
          {image ? (
            <img src={image} alt="Preview" className="h-full w-full object-cover rounded-lg" referrerPolicy="no-referrer" />
          ) : (
            <div className="text-center p-6">
              <Upload className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm text-zinc-500 font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-zinc-400 mt-1">PNG, JPG up to 10MB</p>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
            accept="image/*" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details about the hazard..."
            className="w-full p-3 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-500 focus:border-transparent outline-none transition-all h-24 resize-none"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!image || analyzing}
          className={`
            w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
            ${!image || analyzing 
              ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' 
              : 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]'}
          `}
        >
          {analyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing with Gemini AI...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Submit Report
            </>
          )}
        </button>
      </div>
    </div>
  );
};
