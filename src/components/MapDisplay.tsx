import { useState } from 'react';
import { Issue, PredictiveHotspot } from '../types';
import { AlertTriangle, MapPin, Eye, CheckCircle2, Navigation, TrendingUp } from 'lucide-react';

interface MapDisplayProps {
  issues: Issue[];
  hotspots?: PredictiveHotspot[];
  onSelectIssue?: (issue: Issue) => void;
  selectedIssueId?: string;
}

export default function MapDisplay({ issues, hotspots = [], onSelectIssue, selectedIssueId }: MapDisplayProps) {
  const [selectedHotspot, setSelectedHotspot] = useState<PredictiveHotspot | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [mapMode, setMapMode] = useState<'all' | 'complaints' | 'hotspots'>('all');

  // Convert GPS coordinates to local SVG map coordinates
  // Seattle bounding box bounds (approximate)
  // Lat: 47.58 to 47.62
  // Lng: -122.35 to -122.31
  const getXY = (lat: number, lng: number) => {
    const latMin = 47.575;
    const latMax = 47.625;
    const lngMin = -122.355;
    const lngMax = -122.305;

    // SVG dimensions: 600 width, 400 height
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 600;
    // Invert Y because SVG coordinates start at top left
    const y = 400 - ((lat - latMin) / (latMax - latMin)) * 400;

    return { x: Math.max(20, Math.min(580, x)), y: Math.max(20, Math.min(380, y)) };
  };

  const getMarkerColor = (category: string, status: string) => {
    if (status === 'resolved') return 'fill-emerald-500 stroke-emerald-600';
    if (status === 'in_progress') return 'fill-amber-500 stroke-amber-600';
    
    switch (category) {
      case 'pothole':
      case 'road_damage':
        return 'fill-red-500 stroke-red-600';
      case 'garbage':
        return 'fill-orange-500 stroke-orange-600';
      case 'leakage':
        return 'fill-blue-500 stroke-blue-600';
      case 'streetlight':
        return 'fill-yellow-500 stroke-yellow-600';
      default:
        return 'fill-purple-500 stroke-purple-600';
    }
  };

  const handleIssueClick = (issue: Issue) => {
    setSelectedHotspot(null);
    setSelectedIssue(issue);
    if (onSelectIssue) onSelectIssue(issue);
  };

  const handleHotspotClick = (hotspot: PredictiveHotspot) => {
    setSelectedIssue(null);
    setSelectedHotspot(hotspot);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/60">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Navigation className="text-amber-500" size={18} /> City Operations Live Grid
          </h3>
          <p className="text-xs text-slate-400">Interactive live incident coordinates and AI predicted hotspots</p>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-xl w-fit self-end text-xs">
          <button
            onClick={() => setMapMode('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${mapMode === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All Layers
          </button>
          <button
            onClick={() => setMapMode('complaints')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${mapMode === 'complaints' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Incidents
          </button>
          <button
            onClick={() => setMapMode('hotspots')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${mapMode === 'hotspots' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            AI Hotspots
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Stage */}
        <div className="lg:col-span-3 relative bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden min-h-[350px]">
          {/* Grid Background Lines representing city blocks */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
          
          <svg viewBox="0 0 600 400" className="w-full h-full min-h-[350px]">
            {/* Hypothetical Freeways and Roads */}
            <path d="M 50,0 Q 150,200 100,400" fill="none" stroke="#334155" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
            <path d="M 0,220 L 600,220" fill="none" stroke="#334155" strokeWidth="4" opacity="0.4" />
            <path d="M 0,100 L 600,140" fill="none" stroke="#334155" strokeWidth="4" opacity="0.3" />
            <path d="M 320,0 L 320,400" fill="none" stroke="#334155" strokeWidth="4" opacity="0.4" />
            <path d="M 460,0 L 460,400" fill="none" stroke="#334155" strokeWidth="3" opacity="0.2" />

            {/* Simulated Water Body / Seattle Puget Sound boundary */}
            <path d="M 0,0 C 120,50 80,180 30,300 C -10,380 -5,400 -5,400 L 0,400 Z" fill="#1e293b" opacity="0.25" />
            <text x="35" y="120" fill="#475569" className="text-[10px] font-mono italic select-none">Puget Sound Basin</text>

            {/* City Park Zone */}
            <rect x="360" y="50" width="80" height="60" rx="6" fill="#14532d" opacity="0.25" />
            <text x="400" y="85" textAnchor="middle" fill="#22c55e" className="text-[10px] font-medium font-mono select-none" opacity="0.5">City Park</text>

            {/* 1. Draw Hotspots warning halos */}
            {(mapMode === 'all' || mapMode === 'hotspots') && hotspots.map((hotspot) => {
              const { x, y } = getXY(hotspot.coordinates.lat, hotspot.coordinates.lng);
              const radius = hotspot.riskScore * 0.45; // larger halo for higher risk
              const isSel = selectedHotspot?.id === hotspot.id;
              
              return (
                <g key={hotspot.id} className="cursor-pointer" onClick={() => handleHotspotClick(hotspot)}>
                  {/* Warning Pulsing Outer Ring */}
                  <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    className="fill-amber-500/10 stroke-amber-500/40 animate-pulse"
                    strokeWidth={isSel ? '2' : '1'}
                    strokeDasharray="4 2"
                  />
                  {/* Inner Warning Core */}
                  <circle
                    cx={x}
                    cy={y}
                    r="8"
                    className="fill-amber-500 stroke-slate-950"
                    strokeWidth="1.5"
                  />
                  <text x={x} y={y - 12} textAnchor="middle" fill="#fbbf24" className="text-[9px] font-mono font-bold select-none drop-shadow">
                    ⚠️ {hotspot.riskScore}% Risk
                  </text>
                </g>
              );
            })}

            {/* 2. Draw active reported issues */}
            {(mapMode === 'all' || mapMode === 'complaints') && issues.map((issue) => {
              const { x, y } = getXY(issue.latitude, issue.longitude);
              const isSel = selectedIssueId === issue.id || selectedIssue?.id === issue.id;
              
              return (
                <g key={issue.id} className="cursor-pointer group" onClick={() => handleIssueClick(issue)}>
                  {/* Outer glow ring */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSel ? '15' : '10'}
                    className={`opacity-20 transition-all ${
                      issue.status === 'resolved' 
                        ? 'fill-emerald-400 group-hover:scale-125' 
                        : issue.status === 'in_progress'
                        ? 'fill-amber-400 animate-ping'
                        : 'fill-red-400 animate-pulse'
                    }`}
                  />
                  
                  {/* Map Pin Marker */}
                  <path
                    d={`M ${x},${y} m -6,-6 c 0,-6 12,-6 12,0 c 0,5 -6,11 -6,11 c 0,0 -6,-6 -6,-11 z`}
                    className={`transition-colors ${getMarkerColor(issue.category, issue.status)}`}
                    strokeWidth={isSel ? '2' : '1'}
                  />
                  
                  {/* Micro Dot inside pin */}
                  <circle cx={x} cy={y - 6} r="2.5" fill="#0f172a" />
                </g>
              );
            })}
          </svg>

          {/* Map Compass HUD Overlay */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-400 flex items-center gap-1.5 backdrop-blur-sm shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live HUD Online • GPS bounds Seattle Corridor
          </div>
          <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg text-[10px] font-mono text-slate-400 backdrop-blur-sm shadow-md space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-red-500 border border-red-600 block" />
              <span>Pothole / Road hazard</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-orange-500 border border-orange-600 block" />
              <span>Sanitation Dump</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-yellow-400 border border-yellow-500 block" />
              <span>Lights Out</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-600 block" />
              <span>Resolved Anchors</span>
            </div>
          </div>
        </div>

        {/* Dynamic Detail Card Side Panel */}
        <div className="lg:col-span-1 flex flex-col justify-between h-full bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 min-h-[300px]">
          {selectedIssue ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ${
                  selectedIssue.status === 'resolved' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : selectedIssue.status === 'in_progress'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {selectedIssue.status.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">ID: {selectedIssue.id}</span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-200 line-clamp-2">{selectedIssue.title}</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                  <MapPin size={10} className="text-amber-500 shrink-0" /> {selectedIssue.address.split(',')[0]}
                </p>
              </div>

              {selectedIssue.imageUrl && (
                <div className="h-28 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 relative">
                  <img
                    src={selectedIssue.imageUrl}
                    alt={selectedIssue.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {selectedIssue.aiConfidence && (
                    <span className="absolute bottom-1 right-1 bg-slate-950/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-amber-400">
                      AI Conf: {Math.round(selectedIssue.aiConfidence * 100)}%
                    </span>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                {selectedIssue.description}
              </p>

              <div className="space-y-1.5 bg-slate-900/40 p-2.5 rounded-lg text-[11px] font-mono">
                {selectedIssue.issueDetected && (
                  <div className="flex flex-col border-b border-slate-900/80 pb-1.5 mb-1.5">
                    <span className="text-[10px] text-amber-500 font-bold mb-0.5 uppercase tracking-wide flex items-center gap-1">✨ AI DETECTED ISSUE:</span>
                    <span className="text-slate-200 leading-normal font-sans italic">{selectedIssue.issueDetected}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">DEPT:</span>
                  <span className="text-slate-300 truncate max-w-[120px]" title={selectedIssue.department}>
                    {selectedIssue.department}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SEVERITY:</span>
                  <span className={`font-bold ${
                    selectedIssue.severity === 'high' ? 'text-rose-400' : selectedIssue.severity === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{selectedIssue.severity.toUpperCase()}</span>
                </div>
                {selectedIssue.priorityScore && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">PRIORITY:</span>
                    <span className="text-amber-400 font-bold">{selectedIssue.priorityScore}/100</span>
                  </div>
                )}
                {selectedIssue.estimatedResolutionTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">EST. RESOLVE:</span>
                    <span className="text-slate-300 font-bold">{selectedIssue.estimatedResolutionTime}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">VERIFIED:</span>
                  <span className="text-slate-300">{selectedIssue.verificationCount} citizens</span>
                </div>
              </div>

              {selectedIssue.aiReasoning && (
                <div className="text-[10px] bg-slate-900/25 p-2 rounded border border-slate-900 leading-normal font-mono text-slate-400">
                  <span className="text-amber-500 font-bold block mb-0.5 uppercase">AI Reasoning:</span>
                  {selectedIssue.aiReasoning}
                </div>
              )}
            </div>
          ) : selectedHotspot ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 font-bold">
                  <TrendingUp size={10} /> AI PREDICTION
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Zone: {selectedHotspot.id}</span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-amber-400">{selectedHotspot.region}</h4>
                <p className="text-xs text-slate-300 mt-1 capitalize font-medium font-mono">
                  Potential recurring: {selectedHotspot.category}
                </p>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">📈</span>
                  <div className="flex-grow">
                    <p className="text-[10px] text-slate-400 font-mono">RISK PROBABILITY</p>
                    <p className="text-lg font-bold text-amber-400 font-mono">{selectedHotspot.riskScore}%</p>
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${selectedHotspot.riskScore}%` }} />
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/50">
                {selectedHotspot.reasoning}
              </p>

              <div className="text-[10px] font-mono text-slate-400 leading-normal border-t border-slate-800 pt-3">
                <span className="text-amber-500 block mb-0.5">FORECASTED TIMELINE:</span>
                {selectedHotspot.predictedTimeline}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-3.5 border border-slate-700/40">
                <Eye size={20} />
              </div>
              <h4 className="text-sm font-bold text-slate-300 mb-1">Click Map Elements</h4>
              <p className="text-xs text-slate-500 leading-normal max-w-[160px] mx-auto">
                Select any incident pin or pulsing orange AI hotspot zone to inspect detailed analytical insights.
              </p>
            </div>
          )}

          {/* Prompt guide */}
          {(selectedIssue || selectedHotspot) && (
            <button
              onClick={() => { setSelectedIssue(null); setSelectedHotspot(null); }}
              className="mt-4 w-full py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium font-mono transition-colors"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
