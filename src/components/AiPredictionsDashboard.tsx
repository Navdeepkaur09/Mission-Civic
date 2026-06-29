import React, { useState, useMemo } from 'react';
import { Issue, IssueCategory, PredictiveHotspot } from '../types';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  Calendar, 
  MapPin, 
  Layers, 
  ChevronRight, 
  Thermometer, 
  Activity, 
  Droplet, 
  Trash2, 
  Compass, 
  Sliders, 
  Wrench,
  Gauge,
  Percent,
  Calculator,
  UserCheck
} from 'lucide-react';

interface AiPredictionsDashboardProps {
  issues: Issue[];
  role: 'citizen' | 'authority' | 'admin';
  onAddPreventativeTicket?: (ticket: {
    title: string;
    description: string;
    category: IssueCategory;
    address: string;
    latitude: number;
    longitude: number;
    severity: 'low' | 'medium' | 'high';
  }) => void;
}

interface SimulatedPrediction {
  id: string;
  name: string;
  category: IssueCategory;
  riskScore: number;
  reasoning: string;
  historicalCount: number;
  keyFactors: string[];
  lat: number;
  lng: number;
  timeline: string;
  pavementAge?: number; // years
  averageDailyTraffic?: number; // vehicles
  moistureSensorOffset?: number; // mm
  illegalDumpingFrequency?: 'daily' | 'weekly' | 'monthly';
  complaintClusterDensity?: number; // reports / sq-mile
}

export default function AiPredictionsDashboard({ 
  issues, 
  role, 
  onAddPreventativeTicket 
}: AiPredictionsDashboardProps) {
  
  // Simulation states (interactive tuning parameters)
  const [trafficLoadMultiplier, setTrafficLoadMultiplier] = useState<number>(1.2);
  const [rainfallIndex, setRainfallIndex] = useState<number>(3.5); // Inches/week
  const [pavementAgeThreshold, setPavementAgeThreshold] = useState<number>(12); // years
  const [illegalDumpingWeight, setIllegalDumpingWeight] = useState<number>(1.5);
  
  // Filter for predictive category
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'pothole' | 'garbage' | 'leakage' | 'high_complaint'>('all');
  const [selectedPredictionId, setSelectedPredictionId] = useState<string | null>('pred-pothole-1');
  const [dispatchStatus, setDispatchStatus] = useState<Record<string, 'idle' | 'dispatched'>>({});

  // 1. Definition of predictive database
  const BASE_PREDICTIONS: SimulatedPrediction[] = [
    // --- POTHOLE PREDICTIONS ---
    {
      id: 'pred-pothole-1',
      name: 'E Pine St & 12th Ave Segment',
      category: 'pothole',
      riskScore: 88,
      reasoning: 'Critical freeze-thaw subgrade cycle detected. Heavy hybrid city bus routing (Route 11, 49) coupled with pavement age exceeding 15 years results in high structural fatigue.',
      historicalCount: 14,
      keyFactors: ['Pavement Age (15 yrs)', 'Heavy Bus Route Load', 'Water ingress in sub-base'],
      lat: 47.6152,
      lng: -122.3185,
      timeline: 'High risk window: 10-15 days during next major temperature oscillation',
      pavementAge: 15,
      averageDailyTraffic: 14500
    },
    {
      id: 'pred-pothole-2',
      name: 'Westlake Ave N (Near Marina)',
      category: 'pothole',
      riskScore: 72,
      reasoning: 'Sub-grade soil liquefaction risk near Lake Union canal. Water runoff saturates asphalt subgrade, creating subterranean washouts under continuous light-commercial loads.',
      historicalCount: 8,
      keyFactors: ['High soil humidity', 'Subgrade liquefaction', 'Water runoff saturation'],
      lat: 47.6285,
      lng: -122.3411,
      timeline: 'High risk window: Peak rainy season (mid-winter saturation)',
      pavementAge: 8,
      averageDailyTraffic: 22000
    },
    
    // --- RECURRING GARBAGE PREDICTIONS ---
    {
      id: 'pred-garbage-1',
      name: 'Cal Anderson Park (East Boundary Alleys)',
      category: 'garbage',
      riskScore: 92,
      reasoning: 'Alleyways with high blind-spot density combined with intensive weekend pedestrian overflow. High probability of commercial recycling container contamination and overflow.',
      historicalCount: 29,
      keyFactors: ['High blind-spot rating', 'Weekend park traffic spikes', 'Insufficient containment volume'],
      lat: 47.6178,
      lng: -122.3194,
      timeline: 'Predicted peak: Recurring Saturday nights between 22:00 and 04:00',
      illegalDumpingFrequency: 'weekly'
    },
    {
      id: 'pred-garbage-2',
      name: 'SODO Warehouse Alley Corridor',
      category: 'garbage',
      riskScore: 81,
      reasoning: 'Low-lit industrial zone adjacent to freight rail spurs. Consistent bi-weekly heavy bulk items (appliances, construction refuse) dumped during low-traffic overnight shifts.',
      historicalCount: 19,
      keyFactors: ['Low illuminance indices', 'Minimal street cameras', 'Commercial vehicle access'],
      lat: 47.5855,
      lng: -122.3298,
      timeline: 'Predicted peak: Weekend midnight hours during overcast weather',
      illegalDumpingFrequency: 'monthly'
    },

    // --- FREQUENT WATER LEAKAGES ---
    {
      id: 'pred-leakage-1',
      name: 'Yesler Way & 3rd Ave Intersection',
      category: 'leakage',
      riskScore: 85,
      reasoning: 'Hydrostatic pressure anomalies recorded at the localized node. Pipeline consists of 1965 ductile iron alloy experiencing severe ground settlement stress.',
      historicalCount: 6,
      keyFactors: ['Aging 1965 ductile iron', 'Localized seismic shift', 'Anomalous telemetry pressure spikes'],
      lat: 47.6020,
      lng: -122.3308,
      timeline: 'Preventative audit recommended within 30 days to mitigate street cave-in',
      moistureSensorOffset: 12.4
    },
    {
      id: 'pred-leakage-2',
      name: 'Eastlake Ave & E Allison St Water Main',
      category: 'leakage',
      riskScore: 68,
      reasoning: 'Rapid thermal soil contraction predicted to cause high-amplitude stresses on critical pipeline junctions. Moderate soil corrosion markers.',
      historicalCount: 3,
      keyFactors: ['Corrosive soil index', 'Thermal contraction', 'Water pressure spikes'],
      lat: 47.6495,
      lng: -122.3245,
      timeline: 'Vulnerability expected during rapid temperature drops below 32°F',
      moistureSensorOffset: 5.8
    },

    // --- HIGH COMPLAINT ZONES ---
    {
      id: 'pred-complaint-1',
      name: 'Pike Place Market Perimeter Zone',
      category: 'other',
      riskScore: 95,
      reasoning: 'High-density multi-use zoning with intense citizen pedestrian reporter concentration. Highly responsive demographic results in short time-to-report latency.',
      historicalCount: 52,
      keyFactors: ['Reporter density threshold exceeded', 'High-speed 5G network coverage', 'Intense tourist foot traffic'],
      lat: 47.6097,
      lng: -122.3422,
      timeline: 'Continuous high-volume reporting (forecasted 15+ incidents reported weekly)',
      complaintClusterDensity: 44
    },
    {
      id: 'pred-complaint-2',
      name: 'University District Student Alleys',
      category: 'other',
      riskScore: 78,
      reasoning: 'Cyclical lease rotation intervals trigger high concentrations of move-out debris reports, general lighting failures, and parking obstruction tickets.',
      historicalCount: 31,
      keyFactors: ['Demographic transition cycles', 'High student population density', 'Low nighttime visibility'],
      lat: 47.6612,
      lng: -122.3131,
      timeline: 'Severe spike expected during academic term transitions (late June and mid-September)',
      complaintClusterDensity: 28
    }
  ];

  // 2. DYNAMIC PREDICTIONS RECALCULATION ENGINE (Formulas affected by Sliders!)
  const adjustedPredictions = useMemo(() => {
    return BASE_PREDICTIONS.map(pred => {
      let scoreModifier = 0;

      // Category-specific tuning formulas
      if (pred.category === 'pothole') {
        // Pavement age threshold and traffic load impact potholes
        const ageDelta = (pred.pavementAge || 10) - pavementAgeThreshold;
        scoreModifier += ageDelta * 2.5; // Older pavement = higher risk
        scoreModifier += (trafficLoadMultiplier - 1) * 35; // Traffic weight
        scoreModifier += (rainfallIndex - 3) * 4; // Water infiltration
      } else if (pred.category === 'garbage') {
        // Illegal dumping weight and rainfall impacts outdoor garbage dampening
        scoreModifier += (illegalDumpingWeight - 1.2) * 25;
        if (rainfallIndex > 5) {
          // Rainfall deters dumpers slightly, but causes waterlogged garbage weight
          scoreModifier -= 4;
        }
      } else if (pred.category === 'leakage') {
        // Water pressure index simulated by rainfall/moisture offsets
        scoreModifier += (rainfallIndex - 3) * 6;
        scoreModifier += (pred.moistureSensorOffset || 0) * 1.5;
      } else {
        // High complaint zones are amplified by general social tension and density factors
        scoreModifier += (trafficLoadMultiplier - 1) * 15;
        scoreModifier += (pred.complaintClusterDensity || 20) * 0.4;
      }

      // Safe bounds 0 - 100
      const finalScore = Math.max(10, Math.min(100, Math.round(pred.riskScore + scoreModifier)));
      
      // Dynamic updates to reasoning based on modified metrics
      let dynamicReasoning = pred.reasoning;
      if (finalScore >= 90) {
        dynamicReasoning = `🚨 [CRITICAL ANOMALY ALERT] ${pred.reasoning} Tuning parameters indicate extreme hazard saturation.`;
      } else if (finalScore < 50) {
        dynamicReasoning = `🌱 [STABILIZED STATE] Risk has diminished due to favorable model tuner settings. Current indicators remain stable.`;
      }

      return {
        ...pred,
        riskScore: finalScore,
        reasoning: dynamicReasoning
      };
    });
  }, [trafficLoadMultiplier, rainfallIndex, pavementAgeThreshold, illegalDumpingWeight]);

  // Apply visual category filters
  const filteredPredictions = useMemo(() => {
    return adjustedPredictions.filter(p => {
      if (activeCategoryFilter === 'all') return true;
      if (activeCategoryFilter === 'high_complaint') return p.category === 'other';
      return p.category === activeCategoryFilter;
    });
  }, [adjustedPredictions, activeCategoryFilter]);

  // Find the selected prediction details
  const activePrediction = useMemo(() => {
    return adjustedPredictions.find(p => p.id === selectedPredictionId) || adjustedPredictions[0];
  }, [adjustedPredictions, selectedPredictionId]);

  // Handle preventative maintenance dispatch
  const handleDispatchPreventativeAction = (pred: SimulatedPrediction) => {
    if (dispatchStatus[pred.id] === 'dispatched') return;

    setDispatchStatus(prev => ({ ...prev, [pred.id]: 'dispatched' }));

    if (onAddPreventativeTicket) {
      // Map category properly
      const ticketCategory = pred.category;
      
      onAddPreventativeTicket({
        title: `🛡️ Preventative Work Order: ${pred.name}`,
        description: `AUTO-DISPATCHED BY PREDICTIVE AI METRICS.\n\nRisk Assessment Score: ${pred.riskScore}/100.\n\nReasoning: ${pred.reasoning}\n\nKey Risk Factors:\n${pred.keyFactors.map(f => `• ${f}`).join('\n')}`,
        category: ticketCategory,
        address: `${pred.name}, Seattle, WA`,
        latitude: pred.lat,
        longitude: pred.lng,
        severity: pred.riskScore >= 80 ? 'high' : pred.riskScore >= 50 ? 'medium' : 'low'
      });
    } else {
      alert(`Dispatching civic maintenance crew to ${pred.name} for early intervention!`);
    }
  };

  // Convert GPS to local SVG coordinates (same bounding box as MapDisplay for alignment)
  const getXY = (lat: number, lng: number) => {
    const latMin = 47.575;
    const latMax = 47.625;
    const lngMin = -122.355;
    const lngMax = -122.305;

    const x = ((lng - lngMin) / (lngMax - lngMin)) * 400;
    const y = 300 - ((lat - latMin) / (latMax - latMin)) * 300;

    return { x: Math.max(15, Math.min(385, x)), y: Math.max(15, Math.min(285, y)) };
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            🤖 MUNICIPAL COGNITIVE SERVICES
          </span>
          <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            AI Predictive Operations Center
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            This predictive engine combines computer vision indices, historical telemetry, and citizen report density matrices to forecast infrastructure fatigue BEFORE failures occur.
          </p>
        </div>

        {/* AI Engine Status Badge */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-center gap-3 font-mono text-xs z-10 shrink-0">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 block uppercase">MODEL RUN STATUS</span>
            <span className="text-slate-200 font-bold">LIVE TELEMETRY CALIBRATED</span>
          </div>
        </div>
      </div>

      {/* PARAMETRIC SIMULATOR & TUNING PANEL */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sliders className="text-amber-500" size={18} />
          <div>
            <h3 className="text-xs font-bold text-slate-200 font-mono uppercase">AI Environmental Parameter Tuner</h3>
            <p className="text-[10px] text-slate-500">Modify macro city metrics in real-time to recalculate risk probabilities dynamically.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          
          {/* Slider 1: Traffic load */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-850">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1"><Activity size={12} className="text-red-500" /> Transit Weight</span>
              <span className="text-amber-400 font-bold">x{trafficLoadMultiplier.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={trafficLoadMultiplier}
              onChange={(e) => setTrafficLoadMultiplier(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[9px] text-slate-500 block leading-tight font-mono">Simulates daily commercial bus & freight axle-load multipliers.</span>
          </div>

          {/* Slider 2: Weekly Rainfall */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-850">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1"><Droplet size={12} className="text-blue-400" /> Rainfall Index</span>
              <span className="text-blue-400 font-bold">{rainfallIndex.toFixed(1)} in/wk</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="8.0"
              step="0.5"
              value={rainfallIndex}
              onChange={(e) => setRainfallIndex(parseFloat(e.target.value))}
              className="w-full accent-blue-400 cursor-pointer"
            />
            <span className="text-[9px] text-slate-500 block leading-tight font-mono">Alters hydraulic pressure models & subterranean sub-base moisture saturation indexes.</span>
          </div>

          {/* Slider 3: Pavement Age */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-850">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1"><Wrench size={12} className="text-amber-500" /> Pavement Target Age</span>
              <span className="text-amber-400 font-bold">{pavementAgeThreshold} Years</span>
            </div>
            <input
              type="range"
              min="2"
              max="25"
              step="1"
              value={pavementAgeThreshold}
              onChange={(e) => setPavementAgeThreshold(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[9px] text-slate-500 block leading-tight font-mono">Changes the sensitivity baseline of asphalt fatigue age calculations.</span>
          </div>

          {/* Slider 4: Illegal Dumping Weight */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-850">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1"><Trash2 size={12} className="text-orange-400" /> Dumping Propensity</span>
              <span className="text-orange-400 font-bold">{illegalDumpingWeight.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={illegalDumpingWeight}
              onChange={(e) => setIllegalDumpingWeight(parseFloat(e.target.value))}
              className="w-full accent-orange-400 cursor-pointer"
            />
            <span className="text-[9px] text-slate-500 block leading-tight font-mono">Adjusts behavioral illegal refuse dumping factors for dark alleys.</span>
          </div>

        </div>
      </div>

      {/* CORE 2-COLUMN LAYOUT: PREDICTION WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COMPASS COLUMN: SENSORS & MAP GRAPH (Col Span 5) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 font-mono uppercase flex items-center gap-1.5">
              <Compass size={16} className="text-amber-500" /> Cognitive Heatmap Overlay
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Live neural projection map indicating localized high-risk nodes.</p>
          </div>

          {/* Interactive Block Map Canvas */}
          <div className="relative bg-slate-950 border border-slate-850 rounded-2xl h-[300px] overflow-hidden flex items-center justify-center">
            {/* Dot map backdrop */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-50 pointer-events-none" />

            <svg viewBox="0 0 400 300" className="w-full h-full">
              {/* Grid Roads */}
              <line x1="50" y1="0" x2="50" y2="300" stroke="#1e293b" strokeWidth="3" opacity="0.4" />
              <line x1="150" y1="0" x2="150" y2="300" stroke="#1e293b" strokeWidth="4" opacity="0.6" />
              <line x1="300" y1="0" x2="300" y2="300" stroke="#1e293b" strokeWidth="3" opacity="0.4" />
              
              <line x1="0" y1="80" x2="400" y2="80" stroke="#1e293b" strokeWidth="3" opacity="0.4" />
              <line x1="0" y1="180" x2="400" y2="180" stroke="#1e293b" strokeWidth="5" opacity="0.7" />
              <line x1="0" y1="250" x2="400" y2="250" stroke="#1e293b" strokeWidth="3" opacity="0.4" />

              {/* Draw Lake Union / Bay outline in Seattle */}
              <path d="M 0,0 C 100,20 120,100 80,180 C 40,240 20,300 0,300 Z" fill="#0f172a" opacity="0.4" stroke="#1e293b" />

              {/* Draw predictive hotspots with glowing warning radii */}
              {filteredPredictions.map(pred => {
                const { x, y } = getXY(pred.lat, pred.lng);
                const isSelected = selectedPredictionId === pred.id;
                
                // Color code categories
                let colorClass = 'fill-red-500/10 stroke-red-500/30 text-red-400';
                if (pred.category === 'garbage') colorClass = 'fill-orange-500/10 stroke-orange-500/30 text-orange-400';
                if (pred.category === 'leakage') colorClass = 'fill-blue-500/10 stroke-blue-500/30 text-blue-400';
                if (pred.category === 'other') colorClass = 'fill-purple-500/10 stroke-purple-500/30 text-purple-400';

                return (
                  <g 
                    key={pred.id} 
                    className="cursor-pointer group"
                    onClick={() => setSelectedPredictionId(pred.id)}
                  >
                    {/* Glowing outer threat halo */}
                    <circle
                      cx={x}
                      cy={y}
                      r={pred.riskScore * 0.28}
                      className={`${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} animate-pulse`}
                      strokeWidth={isSelected ? "2" : "1"}
                    />
                    {/* Core target marker */}
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      className={`${isSelected ? 'fill-amber-500' : 'fill-slate-800'} stroke-slate-950`}
                      strokeWidth="1.5"
                    />
                    {/* Tiny text identifier */}
                    <text
                      x={x + 10}
                      y={y + 3}
                      fill={isSelected ? '#f59e0b' : '#94a3b8'}
                      className="text-[8px] font-mono font-bold select-none opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {pred.riskScore}%
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Float Overlay Legend */}
            <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 border border-slate-850 p-2.5 rounded-xl flex justify-between gap-2 text-[8px] font-mono text-slate-400">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Potholes</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Garbage</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Leakages</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Hot Zones</span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 font-mono">
              <span className="text-[8px] text-slate-500 block uppercase">MEAN MODEL CONFIDENCE</span>
              <span className="text-sm font-black text-slate-200">91.4% ACCURACY</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 font-mono">
              <span className="text-[8px] text-slate-500 block uppercase">PREVENTATIVE SAVINGS</span>
              <span className="text-sm font-black text-emerald-400">$24,150 EST / MO</span>
            </div>
          </div>
        </div>

        {/* RIGHT SCHEDULER COLUMN: DETAILS & AUDIT LOGS (Col Span 7) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          
          {/* Subheader and Category filter tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 font-mono uppercase">Predictive Diagnostic Indexes</h3>
              <p className="text-[10px] text-slate-500">Examine specific risks generated by active algorithms.</p>
            </div>

            {/* Tiny tab filters */}
            <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-850 text-[9px] font-mono overflow-x-auto">
              <button
                onClick={() => {
                  setActiveCategoryFilter('all');
                  setSelectedPredictionId('pred-pothole-1');
                }}
                className={`px-2 py-1.5 rounded-lg font-bold shrink-0 ${activeCategoryFilter === 'all' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
              >
                All (8)
              </button>
              <button
                onClick={() => {
                  setActiveCategoryFilter('pothole');
                  setSelectedPredictionId('pred-pothole-1');
                }}
                className={`px-2 py-1.5 rounded-lg font-bold shrink-0 ${activeCategoryFilter === 'pothole' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Potholes
              </button>
              <button
                onClick={() => {
                  setActiveCategoryFilter('garbage');
                  setSelectedPredictionId('pred-garbage-1');
                }}
                className={`px-2 py-1.5 rounded-lg font-bold shrink-0 ${activeCategoryFilter === 'garbage' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Garbage
              </button>
              <button
                onClick={() => {
                  setActiveCategoryFilter('leakage');
                  setSelectedPredictionId('pred-leakage-1');
                }}
                className={`px-2 py-1.5 rounded-lg font-bold shrink-0 ${activeCategoryFilter === 'leakage' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Leakages
              </button>
              <button
                onClick={() => {
                  setActiveCategoryFilter('high_complaint');
                  setSelectedPredictionId('pred-complaint-1');
                }}
                className={`px-2 py-1.5 rounded-lg font-bold shrink-0 ${activeCategoryFilter === 'high_complaint' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Complaint Zones
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
            
            {/* List selector of filtered predictions (Col Span 5) */}
            <div className="sm:col-span-5 space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {filteredPredictions.map(pred => {
                const isSelected = selectedPredictionId === pred.id;
                
                return (
                  <div
                    id={`pred_card_${pred.id}`}
                    key={pred.id}
                    onClick={() => setSelectedPredictionId(pred.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-slate-950 border-amber-500/50 ring-1 ring-amber-500/20' 
                        : 'bg-slate-950/40 border-slate-850 hover:bg-slate-950/70'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-xs font-bold text-slate-200 truncate pr-2 block">{pred.name}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 font-bold ${
                        pred.riskScore >= 80 ? 'bg-red-500/10 text-red-400' :
                        pred.riskScore >= 60 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {pred.riskScore}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 font-mono text-[8px] text-slate-500">
                      <span className="capitalize">{pred.category.replace('_', ' ')}</span>
                      <span>Hist: {pred.historicalCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Inspected Risk Card Details (Col Span 7) */}
            <div className="sm:col-span-7 bg-slate-950/80 rounded-2xl border border-slate-850 p-4 space-y-4">
              {activePrediction ? (
                <>
                  {/* Title and Badge */}
                  <div className="border-b border-slate-850 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {activePrediction.category === 'pothole' && '🚧'}
                        {activePrediction.category === 'garbage' && '🗑️'}
                        {activePrediction.category === 'leakage' && '💧'}
                        {activePrediction.category === 'other' && '📍'}
                      </span>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">TARGET COORDINATE</span>
                        <h4 className="text-xs font-bold text-slate-100">{activePrediction.name}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Risk Score meter */}
                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Calculated Hazard Coeff.</span>
                      <span className={activePrediction.riskScore >= 80 ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>
                        {activePrediction.riskScore}% Risk Factor
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-850">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          activePrediction.riskScore >= 85 ? 'bg-red-500' :
                          activePrediction.riskScore >= 65 ? 'bg-amber-500' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${activePrediction.riskScore}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Reasoning Text */}
                  <div className="space-y-1 font-mono text-[10px] leading-relaxed text-slate-400">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Neural Engine Rationale:</span>
                    <p className="bg-slate-900 p-2.5 rounded-xl border border-slate-850 text-slate-300 italic">
                      "{activePrediction.reasoning}"
                    </p>
                  </div>

                  {/* Key Predictive Factors */}
                  <div className="space-y-1 font-mono text-[9px]">
                    <span className="text-slate-500 block uppercase font-bold">COGNITIVE CORRELATION MATRIX:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activePrediction.keyFactors.map((f, idx) => (
                        <span key={idx} className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded text-[8px]">
                          • {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Predicted timeline indicator */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 flex items-center gap-2 font-mono text-[10px] text-slate-300">
                    <Calendar size={12} className="text-amber-500 shrink-0" />
                    <div>
                      <span className="text-[8px] text-slate-500 block uppercase">FORECAST TIMELINE</span>
                      {activePrediction.timeline}
                    </div>
                  </div>

                  {/* Preventive dispatch action */}
                  <div className="pt-2">
                    {role === 'citizen' ? (
                      <div className="text-[9px] text-slate-500 font-mono text-center italic border-t border-slate-900 pt-2 leading-relaxed">
                        🔒 Preventative crew dispatch is locked. Only certified municipal authorities can issue preventive work orders.
                      </div>
                    ) : (
                      <button
                        id="dispatch_preventative_btn"
                        onClick={() => handleDispatchPreventativeAction(activePrediction)}
                        disabled={dispatchStatus[activePrediction.id] === 'dispatched'}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          dispatchStatus[activePrediction.id] === 'dispatched'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-not-allowed'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-lg shadow-amber-500/10 active:scale-95'
                        }`}
                      >
                        {dispatchStatus[activePrediction.id] === 'dispatched' ? (
                          <>
                            <UserCheck size={14} /> Preventative Work Order Dispatched
                          </>
                        ) : (
                          <>
                            <Wrench size={14} /> Dispatch Preventative Work Order
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 font-mono text-slate-500 text-xs">
                  Select a coordinate block from the list on the left to examine neural factors.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
