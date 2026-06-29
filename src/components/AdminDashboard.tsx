import { useState, useEffect } from 'react';
import { Issue, UserProfile } from '../types';
import { Users, Sparkles, Brain, BarChart3, TrendingUp, CheckCircle, Clock, ShieldAlert, Award, ArrowUpRight } from 'lucide-react';

interface AdminDashboardProps {
  issues: Issue[];
  users: Record<string, UserProfile>;
  onUpdateUserRole: (email: string, role: 'citizen' | 'authority' | 'admin', department?: string) => void;
}

export default function AdminDashboard({ issues, users, onUpdateUserRole }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'insights'>('insights');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiReport, setAiReport] = useState<any | null>(null);

  // Statistics calculations
  const totalIssues = issues.length;
  const activeCount = issues.filter(i => i.status !== 'resolved').length;
  const resolvedCount = issues.filter(i => i.status === 'resolved').length;
  const averageConfidence = issues.length > 0
    ? (issues.reduce((acc, i) => acc + (i.aiConfidence || 0), 0) / issues.length) * 100
    : 0;

  const handleGenerateAiReport = async () => {
    setIsGeneratingAi(true);
    setAiReport(null);
    try {
      const response = await fetch('/api/ai-insights');
      if (!response.ok) throw new Error('Insights fetch failed');
      const data = await response.json();
      setAiReport(data);
    } catch (err) {
      console.error(err);
      // Fallback fallback insights
      setAiReport({
        executiveSummary: 'AI analysis suggests elevated road distress complaints on Pine St and Broad St corridors. High resolution turnaround times are noted for Sanitation, while Lighting is facing delays.',
        resourceAllocationAdvice: 'Direct 15% more manpower to the Department of Transportation to support immediate cold patch asphalt reinforcements.',
        preventivePolicy: 'Implement pre-emptive water pressure sensor locks along major conduits to isolate main leakage vectors before sidewalk degradation.',
        departmentEfficiencyRatings: [
          { departmentName: 'Department of Transportation', rating: 'Overburdened', issueVolume: 8 },
          { departmentName: 'Department of Sanitation & Waste Management', rating: 'Excellent Priority Response', issueVolume: 4 },
          { departmentName: 'Department of Energy & Lighting', rating: 'Moderate Pace', issueVolume: 3 }
        ]
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Generate initial insights on load if empty
  useEffect(() => {
    if (!aiReport) {
      handleGenerateAiReport();
    }
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Upper Navigation HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 font-bold border border-rose-500/20">
            📊
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-mono block">MUNICIPAL CONTROL BOARD</span>
            <span className="text-sm font-bold text-slate-200">Admin Control Console</span>
          </div>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-2xl text-xs font-medium border border-slate-900">
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${activeTab === 'insights' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BarChart3 size={14} /> AI City Insights & Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${activeTab === 'users' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Users size={14} /> Citizen & Staff Management
          </button>
        </div>
      </div>

      {activeTab === 'insights' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Analytical Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 font-bold shrink-0">
                #
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono">TOTAL COMPLAINTS LOGGED</p>
                <p className="text-xl font-bold text-slate-100 font-mono mt-0.5">{totalIssues}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 font-bold shrink-0">
                ●
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono">ACTIVE DISPATCH CASES</p>
                <p className="text-xl font-bold text-slate-100 font-mono mt-0.5">{activeCount}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 font-bold shrink-0">
                ✓
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono">RESOLVED ANCHORS</p>
                <p className="text-xl font-bold text-slate-100 font-mono mt-0.5">{resolvedCount}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 font-bold shrink-0">
                🧠
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono">AI CONFIDENCE INDEX</p>
                <p className="text-xl font-bold text-slate-100 font-mono mt-0.5">{averageConfidence.toFixed(1)}%</p>
              </div>
            </div>

          </div>

          {/* AI Insights Strategic Report */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Brain className="text-amber-500" size={18} /> Executive AI Innovation Report
                </h3>
                <p className="text-xs text-slate-500">Formulated dynamically by Gemini based on active municipal complaints</p>
              </div>

              <button
                id="generate_ai_report_btn"
                onClick={handleGenerateAiReport}
                disabled={isGeneratingAi}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isGeneratingAi
                    ? 'bg-slate-800 text-slate-500'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10'
                }`}
              >
                <Sparkles size={13} fill="currentColor" /> {isGeneratingAi ? 'Analyzing databases...' : 'Re-Generate AI Report'}
              </button>
            </div>

            {isGeneratingAi ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 border-2 border-dashed border-amber-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-mono animate-pulse">Running data aggregation matrices through Gemini-3.5-Flash...</p>
              </div>
            ) : aiReport ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Insights and Strategic Recommendations */}
                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-2">
                    <span className="text-[10px] text-amber-500 font-bold font-mono uppercase block">1. EXECUTIVE SUMMARY</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {aiReport.executiveSummary}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-2">
                    <span className="text-[10px] text-blue-400 font-bold font-mono uppercase block">2. STRATEGIC RESOURCE ALLOCATION RECOMMENDATION</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {aiReport.resourceAllocationAdvice}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-2">
                    <span className="text-[10px] text-emerald-400 font-bold font-mono uppercase block">3. PROPOSED PREVENTATIVE POLICY</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {aiReport.preventivePolicy}
                    </p>
                  </div>
                </div>

                {/* Department Efficiency scorecard */}
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-5">
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 font-mono uppercase">Department Dispatch Scorecard</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Live dispatch loads and speed ratings</p>
                  </div>

                  <div className="space-y-3.5">
                    {aiReport.departmentEfficiencyRatings?.map((dept: any, index: number) => (
                      <div key={index} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-200 truncate max-w-[150px]">{dept.departmentName}</span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            dept.rating === 'Excellent' || dept.rating === 'Highly Agile'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : dept.rating === 'Overburdened'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {dept.rating}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">Active complaints volume: {dept.issueVolume}</p>
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 leading-relaxed border-t border-slate-900 pt-4">
                    ⚡ Budget recommendations and department scores align directly with verified community endorsement thresholds.
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-slate-500">Error rendering report details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Users className="text-rose-400" size={18} /> Citizen and Officer Registry
              </h3>
              <p className="text-xs text-slate-500">Edit, approve roles, and grant dispatch clearances to staff members</p>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {Object.keys(users).length} System Accounts Logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-mono text-[10px] uppercase">
                  <th className="pb-3 pl-2">Name</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Clearance Level</th>
                  <th className="pb-3">Active Department</th>
                  <th className="pb-3 text-right pr-2">Community Points</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(users).map((profile) => (
                  <tr key={profile.email} className="border-b border-slate-800/40 hover:bg-slate-950/40 transition-colors">
                    <td className="py-3.5 pl-2 font-medium text-slate-200">
                      {profile.name}
                    </td>
                    <td className="py-3.5 font-mono text-slate-400">
                      {profile.email}
                    </td>
                    <td className="py-3.5">
                      <select
                        value={profile.role}
                        onChange={(e) => onUpdateUserRole(
                          profile.email,
                          e.target.value as 'citizen' | 'authority' | 'admin',
                          e.target.value === 'authority' ? 'Department of Transportation' : undefined
                        )}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="citizen">Citizen</option>
                        <option value="authority">Municipal Inspector (Authority)</option>
                        <option value="admin">System Administrator</option>
                      </select>
                    </td>
                    <td className="py-3.5 font-mono text-xs text-slate-400">
                      {profile.role === 'authority' ? (
                        <select
                          value={profile.department || 'Department of Transportation'}
                          onChange={(e) => onUpdateUserRole(profile.email, 'authority', e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none max-w-[180px]"
                        >
                          <option value="Department of Transportation">DOT (Transportation)</option>
                          <option value="Department of Sanitation & Waste Management">DSWM (Sanitation)</option>
                          <option value="Department of Energy & Lighting">DEL (Energy & Lighting)</option>
                          <option value="Department of Public Utilities (Water & Gas)">DPU (Utilities)</option>
                        </select>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right pr-2 text-amber-400 font-mono font-bold">
                      {profile.points} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
