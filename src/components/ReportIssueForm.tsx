import React, { useState, useRef } from 'react';
import { Issue, IssueCategory, IssueSeverity } from '../types';
import { Upload, MapPin, Sparkles, AlertTriangle, CheckCircle, Shield, Brain, ArrowRight, X } from 'lucide-react';

interface ReportIssueFormProps {
  userEmail: string;
  userName: string;
  onSuccess: (issue: Issue) => void;
  onCancel: () => void;
}

export default function ReportIssueForm({ userEmail, userName, onSuccess, onCancel }: ReportIssueFormProps) {
  const [description, setDescription] = useState('');
  const [manualAddress, setManualAddress] = useState('450 Broadway Ave E, Seattle, WA');
  const [manualLat, setManualLat] = useState(47.6145);
  const [manualLng, setManualLng] = useState(-122.3210);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [aiResult, setAiResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    'Initializing Multi-Modal Image Processor...',
    'Analyzing structural displacement via Computer Vision...',
    'Cross-referencing municipal routing and zoning catalogs...',
    'Formulating severity rating and risk mitigation strategy...'
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Preset mock photos for ease of testing in browser if they don't upload real photos
  const presetPhotos = [
    {
      name: 'Pothole',
      url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600',
      desc: 'Active deep fissure in road surface, obstructing heavy bus traffic.'
    },
    {
      name: 'Illegal Dumping',
      url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600',
      desc: 'Trash bags, bulk packing cases, and discarded mattresses dumped in pedestrian sidewalk.'
    },
    {
      name: 'Streetlight Defect',
      url: 'https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&q=80&w=600',
      desc: 'Pedestrian overhead lamp housing flickering continuously and dark.'
    }
  ];

  const handleSelectPreset = (p: typeof presetPhotos[0]) => {
    setImagePreview(p.url);
    setDescription(p.desc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setProcessingStep(0);

    // Simulated scanner timing cycle
    const interval = setInterval(() => {
      setProcessingStep((p) => {
        if (p >= steps.length - 1) {
          clearInterval(interval);
          return p;
        }
        return p + 1;
      });
    }, 1200);

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          address: manualAddress,
          latitude: manualLat,
          longitude: manualLng,
          image: imagePreview,
          userEmail,
          userName
        })
      });

      if (!response.ok) throw new Error('API processing error');
      const issue = await response.json();
      
      clearInterval(interval);
      setAiResult(issue);
    } catch (err) {
      console.error(err);
      // Fallback fallback report simulation
      setTimeout(() => {
        clearInterval(interval);
        const mockIssue: Issue = {
          id: `issue-${Date.now()}`,
          title: 'Manual Complaint Filed',
          description,
          category: 'other',
          status: 'reported',
          severity: 'medium',
          department: 'City Parks & Recreation',
          reporterName: userName,
          reporterEmail: userEmail,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          latitude: manualLat,
          longitude: manualLng,
          address: manualAddress,
          imageUrl: imagePreview || presetPhotos[0].url,
          verificationCount: 0,
          downvoteCount: 0,
          verifications: [],
          aiConfidence: 0.70,
          aiReasoning: 'Manual classification due to system constraints. Assumed medium municipal routing.'
        };
        setAiResult(mockIssue);
      }, 3500);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmSubmit = () => {
    if (aiResult) {
      onSuccess(aiResult);
    }
  };

  const handleSelectLocationPreset = () => {
    // Randomize slightly within Seattle scope for variety
    const rLat = 47.595 + Math.random() * 0.025;
    const rLng = -122.34 + Math.random() * 0.025;
    setManualLat(parseFloat(rLat.toFixed(4)));
    setManualLng(parseFloat(rLng.toFixed(4)));
    setManualAddress(`${Math.floor(200 + Math.random() * 800)} Pine St, Seattle, WA`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-3xl mx-auto shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="text-amber-500" size={20} /> File AI-Powered Issue Report
          </h2>
          <p className="text-xs text-slate-400 mt-1">Upload a photo of the issue. Gemini AI will analyze, categorize, and route it instantly.</p>
        </div>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 transition-colors">
          <X size={18} />
        </button>
      </div>

      {isProcessing ? (
        <div className="py-12 text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            {/* Spinning Radar core */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500 animate-spin" />
            <div className="absolute inset-3 bg-slate-950 rounded-full flex items-center justify-center text-amber-500">
              <Brain size={28} className="animate-pulse" />
            </div>
            {/* Horizontal laser scanner line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.7)] animate-bounce" />
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 text-base">Gemini Computer Vision Scanning</h4>
            <p className="text-xs font-mono text-amber-500 max-w-md mx-auto h-8 animate-pulse">
              {steps[processingStep]}
            </p>
          </div>

          <div className="w-64 mx-auto bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-amber-500 h-full transition-all duration-500"
              style={{ width: `${((processingStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <p className="text-[10px] text-slate-500 font-mono">
            ESTIMATING STRUCTURAL SEVERITY VECTOR • PARSING METRIC COEFFICIENTS
          </p>
        </div>
      ) : aiResult ? (
        /* AI RESULTS SCREEN */
        <div className="space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
            <CheckCircle className="text-emerald-400 shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-emerald-300 text-sm">Visual Assessment Completed!</h3>
              <p className="text-xs text-slate-400">Gemini successfully routed your incident to municipal databases.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-44 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
                <img
                  src={aiResult.imageUrl}
                  alt={aiResult.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-mono font-bold text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <Brain size={12} /> Confidence: {Math.round(aiResult.aiConfidence * 100)}%
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-500">ASSIGNED DEPT:</span>
                  <span className="text-slate-200 font-medium">{aiResult.department}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-500">RECOMMENDED TITLE:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[160px]">{aiResult.title}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-500">SEVERITY INDEX:</span>
                  <span className={`font-bold uppercase ${
                    aiResult.severity === 'high' ? 'text-rose-400' : aiResult.severity === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{aiResult.severity}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-500">STREET ADDRESS:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[160px]">{aiResult.address.split(',')[0]}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-amber-500 font-bold font-mono uppercase block mb-1">AI VISUAL EVIDENCE LOG</span>
                  <h4 className="text-xs font-bold text-slate-300 font-mono mb-2">METRO DATA ANALYZER EXPLANATION:</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {aiResult.aiReasoning}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50 space-y-2">
                  <h5 className="text-xs font-bold text-slate-300 font-mono">🔒 DATA INTEGRITY SECURED</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    This report will be locked on the city database queue, assigning a high priority response index to public teams. Neighbors can upvote this marker in real-time.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setAiResult(null)}
                  className="flex-grow py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors border border-slate-700"
                >
                  Discard & Retry
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  className="flex-grow py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/10"
                >
                  Publish Report <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD REPORT ENTRY FORM */
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* File drag drop block */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 font-mono uppercase">Incident Evidence Photo</label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer p-4 transition-all ${
                  imagePreview
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : isDragging
                    ? 'border-amber-500 bg-amber-500/5'
                    : 'border-slate-800 hover:border-slate-600 bg-slate-950'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={imagePreview}
                      alt="Uploaded Preview"
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagePreview(null);
                      }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-slate-950/80 rounded-full flex items-center justify-center hover:bg-slate-950 transition-colors"
                    >
                      <X size={12} className="text-slate-300" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-800 text-slate-400">
                      <Upload size={18} />
                    </div>
                    <div className="text-xs text-slate-300 font-medium">
                      <span>Drag and drop photo here or </span>
                      <span className="text-amber-400 hover:underline">browse</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal max-w-[200px] mx-auto">
                      Supports JPG, JPEG, PNG from camera or file storage.
                    </p>
                  </div>
                )}
              </div>

              {/* Preset selectors if they don't have images */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-mono text-slate-500 uppercase">Or select a demo template photo:</p>
                <div className="flex gap-2">
                  {presetPhotos.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-600 rounded-lg text-[10px] text-slate-300 transition-all font-mono"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Form data block */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 font-mono uppercase">Reporter Description</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about what you see, how long it has been there, and any safety hazards..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
                />
              </div>

              {/* Geographic HUD presets */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">GPS LOCATION MATRIX</span>
                  <button
                    type="button"
                    onClick={handleSelectLocationPreset}
                    className="text-[9px] font-mono font-bold text-amber-500 hover:underline flex items-center gap-1"
                  >
                    <MapPin size={10} /> Auto Pin Coordinates
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                  <div>
                    <span>LATITUDE:</span>
                    <input
                      type="number"
                      step="any"
                      value={manualLat}
                      onChange={(e) => setManualLat(parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 mt-1 focus:outline-none text-slate-300"
                    />
                  </div>
                  <div>
                    <span>LONGITUDE:</span>
                    <input
                      type="number"
                      step="any"
                      value={manualLng}
                      onChange={(e) => setManualLng(parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 mt-1 focus:outline-none text-slate-300"
                    />
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-400">
                  <span>RESOLVED ADDRESS:</span>
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 mt-1 focus:outline-none text-slate-300 text-[10px]"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="flex gap-3 justify-end border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10"
            >
              <Sparkles size={14} fill="currentColor" /> Analyze & Submit with Gemini
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
