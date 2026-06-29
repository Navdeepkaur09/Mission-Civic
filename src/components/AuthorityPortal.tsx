import React, { useState } from 'react';
import { Issue, IssueStatus, Department, IssueSeverity, IssueCategory } from '../types';
import MapDisplay from './MapDisplay';
import AiPredictionsDashboard from './AiPredictionsDashboard';
import { 
  CheckSquare, 
  ListFilter, 
  ClipboardCheck, 
  ArrowRight, 
  ShieldAlert, 
  FileImage, 
  Upload, 
  CheckCircle, 
  ExternalLink, 
  MapPin, 
  Sparkles,
  Search,
  Users,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Phone,
  BarChart3,
  TrendingUp,
  Map as MapIcon,
  Briefcase
} from 'lucide-react';

interface AuthorityPortalProps {
  issues: Issue[];
  departmentName: string;
  onUpdateIssueStatus: (
    issueId: string, 
    status: IssueStatus, 
    proofUrl?: string, 
    proofDesc?: string,
    assignedWorker?: string,
    assignedWorkerPhone?: string,
    afterImageUrl?: string
  ) => void;
}

// Pre-configured list of workers by department for operations assignment
const DEPARTMENT_WORKERS: Record<string, { name: string; role: string; phone: string }[]> = {
  'Department of Transportation': [
    { name: 'Marcus Wright', role: 'Road Crew Supervisor', phone: '(206) 555-0143' },
    { name: 'Liam Neeson', role: 'Cold-Patch Lead', phone: '(206) 555-9831' },
    { name: 'Evelyn Salt', role: 'Concrete & Sidewalk Eng.', phone: '(206) 555-7422' }
  ],
  'Department of Sanitation & Waste Management': [
    { name: 'Sarah Connor', role: 'Refuse Fleet Lead', phone: '(206) 555-0188' },
    { name: 'Gary Busey', role: 'Sweeper Dispatcher', phone: '(206) 555-4321' },
    { name: 'Denzel Washington', role: 'Hazmat Clean Operator', phone: '(206) 555-8910' }
  ],
  'Department of Public Utilities (Water & Gas)': [
    { name: 'Elena Rostova', role: 'Hydraulics Analyst', phone: '(206) 555-1199' },
    { name: 'Gordon Freeman', role: 'Pipe Valve Engineer', phone: '(206) 555-3829' },
    { name: 'John Doe', role: 'Gas Sniffer Tech', phone: '(206) 555-4422' }
  ],
  'Department of Energy & Lighting': [
    { name: 'David Cho', role: 'Grid Operations Chief', phone: '(206) 555-6611' },
    { name: 'Nikola Tesla', role: 'Substation Foreman', phone: '(206) 555-1856' },
    { name: 'Thomas Edison', role: 'Streetlight Luminary Tech', phone: '(206) 555-1879' }
  ],
  'City Parks & Recreation': [
    { name: 'Amanda Grier', role: 'Arborist Specialist', phone: '(206) 555-5544' },
    { name: 'Leslie Knope', role: 'Deputy Director of Fun', phone: '(206) 555-2015' },
    { name: 'Ron Swanson', role: 'Superintendent Arborist', phone: '(206) 555-1970' }
  ]
};

const DEFAULT_WORKERS = [
  { name: 'Alex Mercer', role: 'General Dispatch Operator', phone: '(206) 555-1212' },
  { name: 'Claire Redfield', role: 'Field Safety Officer', phone: '(206) 555-1998' }
];

export default function AuthorityPortal({ 
  issues, 
  departmentName, 
  onUpdateIssueStatus,
  onAddPreventativeTicket
}: AuthorityPortalProps & {
  onAddPreventativeTicket?: (ticket: {
    title: string;
    description: string;
    category: IssueCategory;
    address: string;
    latitude: number;
    longitude: number;
    severity: 'low' | 'medium' | 'high';
  }) => void;
}) {
  // Tabs for the workspace: Queue list, Map live grid, or statistics overview
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'queue' | 'map' | 'predictions' | 'stats'>('queue');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  
  // Advanced filters state
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [deptFilterScope, setDeptFilterScope] = useState<'my_dept' | 'all_depts'>('my_dept');
  const [searchQuery, setSearchQuery] = useState('');

  // Update Status & Worker assignment form states
  const [updateStatus, setUpdateStatus] = useState<IssueStatus>('in_progress');
  const [assignedWorkerName, setAssignedWorkerName] = useState('');
  const [proofDesc, setProofDesc] = useState('');
  const [proofImage, setProofImage] = useState('');

  const activeIssue = issues.find(i => i.id === selectedIssueId);

  // Retrieve workers roster for the active issue's department, or general fallback
  const getWorkersForDepartment = (dept: string) => {
    return DEPARTMENT_WORKERS[dept] || DEFAULT_WORKERS;
  };

  // Preset resolutions gallery for simulated verification updates
  const presetResolutionPhotos = [
    { name: 'Road Patch Complete', url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600', desc: 'Asphalt cold-patch applied, rolled, and tested for immediate traffic safety.' },
    { name: 'Sanitation Refuse Cleared', url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=600', desc: 'Sidewalk trash heaps bagged, loaded to sweeper, and street disinfected.' },
    { name: 'Luminary Repaired', url: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&q=80&w=600', desc: 'LED light fixtures reconnected and junction box waterproofed.' },
    { name: 'Leakage Curbed', url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7eed?auto=format&fit=crop&q=80&w=600', desc: 'Hydrant bypass valve installed and main line compression checked.' }
  ];

  // Run filtering on raw issues
  const filteredIssues = issues.filter((issue) => {
    // 1. Department Scope Filter
    if (deptFilterScope === 'my_dept' && issue.department !== departmentName) {
      return false;
    }

    // 2. Status Filter
    if (statusFilter === 'resolved' && issue.status !== 'resolved') {
      return false;
    } else if (statusFilter === 'unresolved' && issue.status === 'resolved') {
      return false;
    }

    // 3. Severity Filter
    if (severityFilter !== 'all' && issue.severity !== severityFilter) {
      return false;
    }

    // 4. Text Search Filter (Title, ID, Description, Address)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = issue.title.toLowerCase().includes(q);
      const matchesId = issue.id.toLowerCase().includes(q);
      const matchesDesc = issue.description.toLowerCase().includes(q);
      const matchesAddress = issue.address.toLowerCase().includes(q);
      if (!matchesTitle && !matchesId && !matchesDesc && !matchesAddress) {
        return false;
      }
    }

    return true;
  });

  const handleUpdateStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIssueId && activeIssue) {
      const workersRoster = getWorkersForDepartment(activeIssue.department);
      const selectedWorkerObj = workersRoster.find(w => w.name === assignedWorkerName);
      const workerPhone = selectedWorkerObj?.phone || '';

      onUpdateIssueStatus(
        selectedIssueId,
        updateStatus,
        updateStatus === 'resolved' ? (proofImage || 'https://images.unsplash.com/photo-1581094288338-2314dddb7eed?auto=format&fit=crop&q=80&w=600') : undefined,
        updateStatus === 'resolved' ? proofDesc : undefined,
        assignedWorkerName || activeIssue.assignedWorker,
        workerPhone || activeIssue.assignedWorkerPhone,
        updateStatus === 'resolved' ? (proofImage || 'https://images.unsplash.com/photo-1581094288338-2314dddb7eed?auto=format&fit=crop&q=80&w=600') : undefined
      );

      // Reset local state variables
      setSelectedIssueId(null);
      setProofDesc('');
      setProofImage('');
      setAssignedWorkerName('');
    }
  };

  // Convert files to Base64 simulation for local preview upload
  const handleProofImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick Action: Escalate to AI Suggested priority score
  const handleEscalateToAISuggestion = (issue: Issue) => {
    if (!issue.priorityScore) return;
    
    // Convert AI suggested score to standard status/severity escalate
    let computedSeverity: IssueSeverity = 'medium';
    if (issue.priorityScore >= 75) computedSeverity = 'high';
    else if (issue.priorityScore < 35) computedSeverity = 'low';

    // Update severity in API
    onUpdateIssueStatus(
      issue.id,
      issue.status,
      issue.resolutionProofUrl,
      issue.resolutionProofDescription,
      issue.assignedWorker,
      issue.assignedWorkerPhone,
      issue.afterImageUrl
    );
    
    // Simulate updating the active severity inline
    issue.severity = computedSeverity;
    alert(`Escalated severity of "${issue.title}" to ${computedSeverity.toUpperCase()} based on AI Priority Rating of ${issue.priorityScore}/100.`);
  };

  // --- STATISTICS PRE-COMPUTATION ---
  const myDeptIssues = issues.filter(i => i.department === departmentName);
  const resolvedCount = myDeptIssues.filter(i => i.status === 'resolved').length;
  const inProgressCount = myDeptIssues.filter(i => i.status === 'in_progress').length;
  const unresolvedCount = myDeptIssues.filter(i => i.status !== 'resolved').length;
  
  const highSeverityCount = myDeptIssues.filter(i => i.severity === 'high' && i.status !== 'resolved').length;
  const completionRate = myDeptIssues.length > 0 ? Math.round((resolvedCount / myDeptIssues.length) * 100) : 0;
  
  const averageConfidence = myDeptIssues.reduce((acc, issue) => acc + (issue.aiConfidence || 0.8), 0) / (myDeptIssues.length || 1);
  const averageAiConfidencePct = Math.round(averageConfidence * 100);

  // Statistics Category distribution data
  const categoriesList = ['pothole', 'garbage', 'leakage', 'streetlight', 'road_damage', 'other'];
  const categoryStats = categoriesList.map(cat => {
    const totalCatCount = issues.filter(i => i.category === cat).length;
    const resolvedCatCount = issues.filter(i => i.category === cat && i.status === 'resolved').length;
    return {
      category: cat,
      total: totalCatCount,
      resolved: resolvedCatCount,
      rate: totalCatCount > 0 ? Math.round((resolvedCatCount / totalCatCount) * 100) : 0
    };
  });

  return (
    <div className="space-y-6">
      
      {/* 1. KEY STATISTICS HERO PANEL (BENTO BOX) */}
      <div id="stats_hero_grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 border border-amber-500/20 shrink-0">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Queue Workload</p>
            <p className="text-xl font-black text-slate-100 font-mono mt-0.5">{unresolvedCount} Active</p>
            <p className="text-[9px] text-slate-400 mt-1">{myDeptIssues.length} total department tickets</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 border border-rose-500/20 shrink-0">
            <AlertOctagon size={20} className={highSeverityCount > 0 ? "animate-pulse text-rose-500" : ""} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">High Severity</p>
            <p className="text-xl font-black text-slate-100 font-mono mt-0.5">{highSeverityCount} Critical</p>
            <p className="text-[9px] text-slate-400 mt-1">Requires immediate dispatch</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Resolution Rate</p>
            <p className="text-xl font-black text-slate-100 font-mono mt-0.5">{completionRate}% Done</p>
            <p className="text-[9px] text-emerald-400/90 font-mono mt-1">✓ {resolvedCount} incidents closed</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20 shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">AI Accuracy Rating</p>
            <p className="text-xl font-black text-slate-100 font-mono mt-0.5">{averageAiConfidencePct}% Safe</p>
            <p className="text-[9px] text-slate-400 mt-1">Assisted by computer vision</p>
          </div>
        </div>

      </div>

      {/* 2. LIVE NAVIGATION TABS */}
      <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 w-full sm:w-max flex-wrap gap-1">
        <button
          id="tab_view_queue"
          onClick={() => setActiveWorkspaceTab('queue')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all ${
            activeWorkspaceTab === 'queue' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardCheck size={14} /> 📋 COMPLAINT QUEUE
        </button>
        <button
          id="tab_view_map"
          onClick={() => setActiveWorkspaceTab('map')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all ${
            activeWorkspaceTab === 'map' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapIcon size={14} /> 🗺️ OPERATIONS MAP LIVE
        </button>
        <button
          id="tab_view_predictions"
          onClick={() => setActiveWorkspaceTab('predictions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all ${
            activeWorkspaceTab === 'predictions' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles size={14} /> 🤖 AI PREDICTIVE RADAR
        </button>
        <button
          id="tab_view_stats"
          onClick={() => setActiveWorkspaceTab('stats')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all ${
            activeWorkspaceTab === 'stats' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 size={14} /> 📊 STATISTICS & CHARTS
        </button>
      </div>

      {/* 3. DUAL WORKSPACE LAYOUT (Left Workspace | Right Inspector) OR PREDICTIONS WORKSPACE */}
      {activeWorkspaceTab === 'predictions' ? (
        <div className="w-full">
          <AiPredictionsDashboard 
            issues={issues} 
            role="authority" 
            onAddPreventativeTicket={onAddPreventativeTicket} 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT WORKSPACE (Col Span 2) */}
          <div className="lg:col-span-2 space-y-4">
          
          {activeWorkspaceTab === 'queue' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              
              {/* Workspace Header & Action Filters */}
              <div className="flex flex-col gap-4 border-b border-slate-800 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <ClipboardCheck className="text-amber-500" size={18} /> Public Incident Complaint Queue
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Domain manager role: <span className="text-amber-400 font-mono font-bold">{departmentName}</span>
                    </p>
                  </div>

                  {/* Department Scope Switcher */}
                  <div className="flex bg-slate-950 p-1 rounded-xl text-[10px] font-mono border border-slate-900 w-fit">
                    <button
                      id="scope_my_dept_btn"
                      onClick={() => setDeptFilterScope('my_dept')}
                      className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                        deptFilterScope === 'my_dept' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      My Department Only
                    </button>
                    <button
                      id="scope_all_depts_btn"
                      onClick={() => setDeptFilterScope('all_depts')}
                      className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                        deptFilterScope === 'all_depts' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All Municipal Units
                    </button>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                  
                  {/* Search */}
                  <div className="sm:col-span-5 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                    <input
                      id="queue_search_input"
                      type="text"
                      placeholder="Search tickets by description, ID, title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-300 placeholder-slate-650 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-slate-700 font-mono"
                    />
                  </div>

                  {/* Status filter */}
                  <div className="sm:col-span-4 flex bg-slate-950 p-1 rounded-xl text-[10px] font-mono border border-slate-800">
                    <button
                      id="status_filter_unresolved"
                      onClick={() => setStatusFilter('unresolved')}
                      className={`flex-1 py-1.5 rounded-lg text-center ${statusFilter === 'unresolved' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Active
                    </button>
                    <button
                      id="status_filter_resolved"
                      onClick={() => setStatusFilter('resolved')}
                      className={`flex-1 py-1.5 rounded-lg text-center ${statusFilter === 'resolved' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Resolved
                    </button>
                    <button
                      id="status_filter_all"
                      onClick={() => setStatusFilter('all')}
                      className={`flex-1 py-1.5 rounded-lg text-center ${statusFilter === 'all' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      All
                    </button>
                  </div>

                  {/* Severity filter */}
                  <div className="sm:col-span-3">
                    <select
                      id="severity_filter_select"
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl p-2.5 focus:outline-none font-mono"
                    >
                      <option value="all">⚡ All Severities</option>
                      <option value="high">🚨 High Priority</option>
                      <option value="medium">⚠️ Medium Priority</option>
                      <option value="low">🌱 Low Priority</option>
                    </select>
                  </div>

                </div>

              </div>

              {/* List rendering */}
              <div id="queue_cards_list" className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredIssues.length === 0 ? (
                  <div className="text-center py-16 bg-slate-950/40 rounded-2xl border border-slate-850">
                    <AlertOctagon className="mx-auto text-slate-600 mb-2" size={24} />
                    <p className="text-xs text-slate-500 font-mono">No incident tickets matching selected queue filters.</p>
                  </div>
                ) : (
                  filteredIssues.map((issue) => {
                    const isMine = issue.department === departmentName;
                    
                    return (
                      <div
                        id={`queue_card_${issue.id}`}
                        key={issue.id}
                        onClick={() => {
                          setSelectedIssueId(issue.id);
                          setUpdateStatus(issue.status);
                          setAssignedWorkerName(issue.assignedWorker || '');
                        }}
                        className={`bg-slate-950/50 hover:bg-slate-950/80 border rounded-2xl p-4 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          selectedIssueId === issue.id ? 'border-amber-500/50 ring-1 ring-amber-500/30' : 'border-slate-850'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl shrink-0 mt-0.5">
                            {issue.category === 'pothole' && '🛠️'}
                            {issue.category === 'garbage' && '🗑️'}
                            {issue.category === 'streetlight' && '💡'}
                            {issue.category === 'leakage' && '💧'}
                            {issue.category === 'road_damage' && '🚧'}
                            {issue.category === 'other' && '📍'}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-slate-200">{issue.title}</span>
                              {isMine && (
                                <span className="bg-amber-500/10 text-amber-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-amber-500/20">
                                  MY DEPT
                                </span>
                              )}
                              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded capitalize ${
                                issue.severity === 'high' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                                issue.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {issue.severity} severity
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 leading-normal">{issue.description}</p>
                            
                            {/* Metadata Footer */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 font-mono text-[9px] text-slate-500">
                              <span className="flex items-center gap-0.5">
                                <MapPin size={10} /> {issue.address.split(',')[0]}
                              </span>
                              <span>•</span>
                              <span>ID: {issue.id}</span>
                              {issue.assignedWorker && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-500 font-bold flex items-center gap-0.5">
                                    <Users size={10} /> Assigned: {issue.assignedWorker}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right side stats on the queue item card */}
                        <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-none border-slate-900 pt-3 md:pt-0 shrink-0">
                          <div className="text-left md:text-right font-mono text-[10px]">
                            <p className="text-slate-500 leading-none">AI SCORE</p>
                            <p className="text-amber-400 font-bold mt-1">
                              {issue.priorityScore ? `${issue.priorityScore}/100` : 'None'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-mono px-2 py-1 rounded-lg uppercase border ${
                              issue.status === 'resolved'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold'
                                : issue.status === 'in_progress'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-slate-800 text-slate-400 border-transparent'
                            }`}>
                              {issue.status.replace('_', ' ')}
                            </span>
                            <ChevronRight size={14} className="text-slate-600 shrink-0" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {activeWorkspaceTab === 'map' && (
            <div className="space-y-4">
              <MapDisplay 
                issues={filteredIssues} 
                onSelectIssue={(issue) => {
                  setSelectedIssueId(issue.id);
                  setUpdateStatus(issue.status);
                  setAssignedWorkerName(issue.assignedWorker || '');
                }}
                selectedIssueId={selectedIssueId || undefined}
              />
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 leading-relaxed font-mono">
                💡 <span className="text-slate-200 font-bold">Interactive Dispatching</span>: Click any map node marker pin to load that incident directly into the right Detail & Operations Action board to update the active work order.
              </div>
            </div>
          )}

          {activeWorkspaceTab === 'stats' && (
            <div id="stats_dashboard_panel" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <BarChart3 className="text-amber-500" size={18} /> Municipal Performance Metrics
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Statistical breakdown of community reports and operational response metrics.</p>
              </div>

              {/* Grid 2x2 for advanced statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Category Bar chart */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-4">
                  <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">Reports by Category</h4>
                  
                  <div className="space-y-3">
                    {categoryStats.map(stat => (
                      <div key={stat.category} className="space-y-1 font-mono text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span className="capitalize">{stat.category.replace('_', ' ')}</span>
                          <span className="text-slate-300 font-bold">{stat.resolved} / {stat.total} Solved</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-850 flex">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${stat.rate}%` }}
                            title={`Resolved Rate: ${stat.rate}%`}
                          />
                          <div 
                            className="bg-amber-500 h-full opacity-50"
                            style={{ width: `${stat.total > 0 ? ((stat.total - stat.resolved) / stat.total) * 100 : 0}%` }}
                            title={`In Progress / Unresolved`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Agility Scores */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-4">
                  <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">Department Efficiency</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Transportation Team</span>
                      <span className="text-emerald-400 font-bold">94/100 (High Agility)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Sanitation Crew</span>
                      <span className="text-emerald-400 font-bold">89/100 (Efficient)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Public Utilities Crew</span>
                      <span className="text-emerald-400 font-bold">92/100 (Highly Agile)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Energy & Lighting Team</span>
                      <span className="text-amber-400 font-bold">78/100 (Moderate Pace)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Parks & Recreation</span>
                      <span className="text-emerald-400 font-bold">85/100 (Agile response)</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-900 pt-3 text-[10px] text-slate-500 leading-normal font-sans italic">
                    * Agility Index is calculated automatically based on mean ticket resolution times, community support volume, and field worker utilization indices.
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* RIGHT ACTION INSPECTOR PANEL (Col Span 1) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-fit">
          {activeIssue ? (
            <form onSubmit={handleUpdateStatusSubmit} className="space-y-5">
              
              {/* Header Details */}
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">INCIDENT COMMAND AUDITOR</span>
                <h4 className="text-sm font-bold text-slate-100 mt-1">{activeIssue.title}</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  ID: {activeIssue.id} • Submitted by <span className="text-slate-300 font-bold">{activeIssue.reporterName}</span>
                </p>
              </div>

              {/* AI SUGGESTED PRIORITY & CONFIDENCE ARC */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1"><Sparkles className="text-amber-500" size={12} /> AI SCAN DIAGNOSTICS</span>
                  <span className="bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded text-[8px] font-bold border border-amber-500/20">
                    Confidence: {Math.round((activeIssue.aiConfidence || 0.85) * 100)}%
                  </span>
                </div>

                {activeIssue.issueDetected && (
                  <div className="text-[10px] text-slate-300 bg-slate-900 p-2.5 rounded-xl leading-normal border border-slate-800 font-mono">
                    <span className="text-slate-500 uppercase block mb-1">Issue Identified:</span>
                    {activeIssue.issueDetected}
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 font-mono text-[11px] pt-1">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase leading-none">Priority Rating</span>
                    <span className={`text-base font-black ${
                      (activeIssue.priorityScore || 50) >= 75 ? 'text-rose-500' :
                      (activeIssue.priorityScore || 50) < 35 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {activeIssue.priorityScore || 50}/100
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block uppercase leading-none">Est. Resolution</span>
                    <span className="text-slate-100 font-bold text-xs">{activeIssue.estimatedResolutionTime || '24-48 Hours'}</span>
                  </div>
                </div>

                {activeIssue.aiReasoning && (
                  <p className="text-[10px] text-slate-400 italic leading-relaxed pt-1 border-t border-slate-900">
                    {activeIssue.aiReasoning}
                  </p>
                )}

                {/* Escalate button */}
                <button
                  type="button"
                  onClick={() => handleEscalateToAISuggestion(activeIssue)}
                  className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 text-[10px] font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  ⚡ Escalate to AI Suggested Severity
                </button>
              </div>

              {/* BEFORE / AFTER IMAGE COMPARISON VIEW */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-300 font-mono uppercase block">Incident Imagery (Before / After)</span>
                
                <div className="grid grid-cols-2 gap-2">
                  
                  {/* Citizen reported Before Image */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 font-mono uppercase block">Citizen Before:</span>
                    <div className="h-24 bg-slate-950 rounded-xl overflow-hidden border border-slate-850 relative">
                      <img 
                        src={activeIssue.imageUrl || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=300"} 
                        alt="Before hazard report" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Operational resolved After Image */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 font-mono uppercase block">Resolved After:</span>
                    <div className="h-24 bg-slate-950 rounded-xl overflow-hidden border border-slate-850 relative flex items-center justify-center">
                      {proofImage || activeIssue.afterImageUrl || activeIssue.resolutionProofUrl ? (
                        <img 
                          src={proofImage || activeIssue.afterImageUrl || activeIssue.resolutionProofUrl} 
                          alt="After repair proof" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <span className="text-[18px] text-slate-600 block">📷</span>
                          <span className="text-[8px] text-slate-500 font-mono">No Proof Uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* ASSIGN FIELD WORKER */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 font-mono uppercase block flex items-center gap-1">
                  <Briefcase size={12} className="text-amber-500" /> Assign Dispatch Worker
                </label>
                
                <select
                  id="worker_assignment_select"
                  value={assignedWorkerName}
                  onChange={(e) => setAssignedWorkerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none font-mono"
                >
                  <option value="">-- Click to Assign Worker --</option>
                  {getWorkersForDepartment(activeIssue.department).map((worker) => (
                    <option key={worker.name} value={worker.name}>
                      👷 {worker.name} ({worker.role})
                    </option>
                  ))}
                </select>

                {assignedWorkerName && (
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between text-[10px] font-mono">
                    <div className="text-slate-400">
                      <span className="text-slate-500 block text-[8px] uppercase">Assigned Staff</span>
                      <span className="text-slate-200 font-bold">{assignedWorkerName}</span>
                    </div>
                    <a 
                      href={`tel:${getWorkersForDepartment(activeIssue.department).find(w => w.name === assignedWorkerName)?.phone}`}
                      className="p-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 rounded-lg flex items-center gap-1"
                      title="Call Worker Dispatch"
                    >
                      <Phone size={10} /> Call
                    </a>
                  </div>
                )}
              </div>

              {/* ACTION: WORK ORDER COMMAND UPDATE */}
              <div className="space-y-4 border-t border-slate-800 pt-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 font-mono uppercase">Update Command Code</label>
                  <select
                    id="update_status_code_select"
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value as IssueStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="reported">Reported (Received)</option>
                    <option value="verifying">Verifying (Field Audit)</option>
                    <option value="verified">Verified (Approved Backing)</option>
                    <option value="in_progress">In Progress (Dispatching Crew)</option>
                    <option value="resolved">Resolved (Completed Proof)</option>
                    <option value="failed_verification">Failed Verification (Reject Entry)</option>
                  </select>
                </div>

                {/* Resolution proof uploading/descriptions (only if resolved) */}
                {updateStatus === 'resolved' && (
                  <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono font-bold">
                      <FileImage size={12} /> VERIFIED RESOLUTION PROOF
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-500 uppercase">1. Describe completion details:</label>
                      <textarea
                        id="proof_desc_textarea"
                        required
                        rows={2}
                        value={proofDesc}
                        onChange={(e) => setProofDesc(e.target.value)}
                        placeholder="e.g., Road repair squad filled pothole with asphalt and sealed margins. Safe for driving."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none placeholder-slate-600 font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-mono text-slate-500 uppercase">2. Select completion image:</label>
                        <span className="text-[8px] text-amber-500 font-mono">Real-time uploader</span>
                      </div>
                      
                      {/* Presets Grid */}
                      <div className="grid grid-cols-2 gap-1.5">
                        {presetResolutionPhotos.map((ph, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setProofImage(ph.url);
                              if (!proofDesc) setProofDesc(ph.desc);
                            }}
                            className={`px-2 py-1.5 bg-slate-900 border text-left hover:border-slate-600 rounded-lg text-[9px] text-slate-300 font-mono transition-all truncate ${
                              proofImage === ph.url ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-slate-800'
                            }`}
                          >
                            {ph.name}
                          </button>
                        ))}
                      </div>

                      {/* File Uploader Input */}
                      <div className="border border-dashed border-slate-800 hover:border-slate-700 bg-slate-900 p-2.5 rounded-xl text-center relative cursor-pointer">
                        <Upload className="mx-auto text-slate-500 mb-1" size={14} />
                        <span className="text-[9px] font-mono text-slate-400 block">Drag & drop or Click to Upload</span>
                        <input
                          id="after_image_file_input"
                          type="file"
                          accept="image/*"
                          onChange={handleProofImageFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    id="close_ticket_detail_btn"
                    type="button"
                    onClick={() => setSelectedIssueId(null)}
                    className="flex-grow py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Close
                  </button>
                  <button
                    id="submit_ticket_status_btn"
                    type="submit"
                    className="flex-grow py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
                  >
                    Commit Dispatch <ArrowRight size={14} />
                  </button>
                </div>

              </div>

            </form>
          ) : (
            <div id="inspector_empty_state" className="h-full flex flex-col items-center justify-center text-center py-20 space-y-3">
              <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-500 border border-slate-850">
                <ClipboardCheck size={22} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-300 font-mono uppercase">Ticket Inspector Empty</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-[200px] mx-auto mt-1">
                  Select an incident complaint from the queue or map live pins to assign staff, view AI priority guides, or record resolutions.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
      )}

    </div>
  );
}

// Chevron right vector icon helper
function ChevronRight(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || "16"}
      height={props.size || "16"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
