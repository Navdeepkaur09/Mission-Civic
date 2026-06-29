import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Issue, UserProfile, LeaderboardEntry, IssueCategory } from '../types';
import MapDisplay from './MapDisplay';
import ReportIssueForm from './ReportIssueForm';
import MiniGame from './MiniGame';
import BadgesTab from './BadgesTab';
import LeaderboardTab from './LeaderboardTab';
import DiyQuestGame from './DiyQuestGame';
import { Sparkles, MapPin, CheckSquare, Gamepad2, Award, ListFilter, HelpCircle, ShieldAlert, Eye, Vote, ThumbsUp, ChevronRight, Zap, CheckCircle, Clock, Truck, Wrench, User, Phone, Activity } from 'lucide-react';

interface CitizenDashboardProps {
  issues: Issue[];
  userProfile: UserProfile;
  leaderboard: LeaderboardEntry[];
  onReportSuccess: (issue: Issue) => void;
  onVerifyIssue: (issueId: string) => void;
  onGameComplete: (score: number) => void;
  onRedeemCoins: (cost: number) => Promise<boolean>;
  onUpdateIssueStatus: (
    issueId: string, 
    status: string, 
    proofUrl?: string, 
    proofDesc?: string,
    assignedWorker?: string,
    assignedWorkerPhone?: string,
    afterImageUrl?: string
  ) => void;
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

export default function CitizenDashboard({
  issues,
  userProfile,
  leaderboard,
  onReportSuccess,
  onVerifyIssue,
  onGameComplete,
  onRedeemCoins,
  onUpdateIssueStatus,
  onAddPreventativeTicket
}: CitizenDashboardProps) {
  const [activeTab, setActiveTab] = useState<'map' | 'report' | 'verify' | 'game' | 'rewards'>('map');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showGamePrompt, setShowGamePrompt] = useState<{ show: boolean; issue: Issue | null }>({ show: false, issue: null });
  const [activeDiyQuestIssue, setActiveDiyQuestIssue] = useState<Issue | null>(null);

  // Progress tracker states inside the Verify tab
  const [verifySubTab, setVerifySubTab] = useState<'neighbors' | 'my_reports'>('neighbors');
  const [selectedTrackIssue, setSelectedTrackIssue] = useState<Issue | null>(null);

  // Filter issues for verification (reported or verifying status, not authored by current user, or filter as general)
  const feedIssues = issues.filter((issue) => {
    if (filterCategory !== 'all' && issue.category !== filterCategory) return false;
    return issue.status !== 'resolved';
  });

  const handleGameComplete = (score: number) => {
    onGameComplete(score);
    setActiveTab('rewards');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'in_progress': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'verified': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'verifying': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Navigation HUD */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-6 w-full lg:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 font-bold border border-amber-500/20">
              ★
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-mono block">MUNICIPAL CITIZEN PORTAL</span>
              <span className="text-sm font-bold text-slate-200">Welcome back, {userProfile.name}</span>
            </div>
          </div>
          
          {/* XP & Coins Stats */}
          <div className="flex items-center gap-4 border-l border-slate-800 pl-6 h-8">
            <div className="flex items-center gap-1.5" title="XP (Experience Points)">
              <span className="text-amber-400 text-sm">✨</span>
              <div className="font-mono text-xs">
                <span className="text-slate-500 text-[10px] block uppercase leading-none">XP</span>
                <span className="text-slate-100 font-bold">{userProfile.points}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5" title="Earned Coins">
              <span className="text-amber-500 text-sm">🪙</span>
              <div className="font-mono text-xs">
                <span className="text-slate-500 text-[10px] block uppercase leading-none">Coins</span>
                <span className="text-slate-100 font-bold">{userProfile.coins || 0}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5" title="Completed Trainings">
              <span className="text-emerald-400 text-sm">🎓</span>
              <div className="font-mono text-xs">
                <span className="text-slate-500 text-[10px] block uppercase leading-none">Academy</span>
                <span className="text-slate-100 font-bold">{userProfile.gameCompletedCount || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex flex-wrap bg-slate-950 p-1 rounded-2xl text-xs font-medium border border-slate-900">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${activeTab === 'map' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🗺️ Live Map
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${activeTab === 'report' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            ✍️ Report Issue
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${activeTab === 'verify' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🔍 Verify Feed
          </button>
          <button
            onClick={() => setActiveTab('game')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${activeTab === 'game' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🎮 Safety Academy
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${activeTab === 'rewards' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🏆 Leaderboard & Badges
          </button>
        </div>
      </div>

      {/* DIY QUEST INTEGRATIVE GAME OVERLAY */}
      <AnimatePresence>
        {activeDiyQuestIssue && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md overflow-y-auto p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <DiyQuestGame
                issue={activeDiyQuestIssue}
                onResolveIssue={onUpdateIssueStatus}
                onClose={() => {
                  setActiveDiyQuestIssue(null);
                  setSelectedIssue(null);
                }}
                onEarnRewards={(xp, coins) => {
                  onGameComplete(xp + coins); // credit score to user
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Tab Body */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          <MapDisplay
            issues={issues}
            selectedIssueId={selectedIssue?.id}
            onSelectIssue={(issue) => setSelectedIssue(issue)}
          />

          {/* Active Citizen Tracking feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">Your Reports Tracking Panel</h3>
                <p className="text-xs text-slate-500">Trace your active alerts and verified municipal responses in real-time</p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {issues.filter(i => i.reporterEmail === userProfile.email).length} Alerts Logged
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {issues.filter((issue) => issue.reporterEmail === userProfile.email).length === 0 ? (
                <div className="md:col-span-3 text-center py-8 bg-slate-950/40 rounded-2xl border border-slate-900">
                  <p className="text-xs text-slate-500">You haven't reported any community issues yet.</p>
                  <button
                    onClick={() => setActiveTab('report')}
                    className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/80 transition-colors"
                  >
                    + Report First Issue
                  </button>
                </div>
              ) : (
                issues
                  .filter((issue) => issue.reporterEmail === userProfile.email)
                  .map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className={`bg-slate-950/60 hover:bg-slate-950 border rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between ${
                        selectedIssue?.id === issue.id ? 'ring-1 ring-amber-500/50 border-amber-500/30' : 'border-slate-800/80'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full ${getStatusBadgeClass(issue.status)}`}>
                            {issue.status.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{issue.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{issue.description}</p>
                      </div>

                      <div className="border-t border-slate-900 mt-3 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span className="truncate max-w-[100px]">{issue.department}</span>
                        <span className="text-slate-300 flex items-center gap-1">
                          👍 {issue.verificationCount} verifications
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Selected Issue Details and DIY Action Panel */}
            {selectedIssue && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950 border border-slate-800 rounded-3xl p-6 mt-6 space-y-4 shadow-xl text-left"
              >
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full ${getStatusBadgeClass(selectedIssue.status)}`}>
                      {selectedIssue.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Report ID: {selectedIssue.id.slice(0, 8)}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedIssue(null)}
                    className="text-xs text-slate-500 hover:text-slate-300 font-mono"
                  >
                    Close Details ✕
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  {selectedIssue.imageUrl && (
                    <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
                      <img 
                        src={selectedIssue.imageUrl} 
                        alt={selectedIssue.title} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="space-y-2 flex-grow">
                    <h4 className="text-sm font-bold text-slate-100">{selectedIssue.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{selectedIssue.description}</p>
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-slate-500 pt-2">
                      <div>CATEGORY: <span className="text-slate-300 capitalize">{selectedIssue.category}</span></div>
                      <div>SEVERITY: <span className="text-slate-300 capitalize">{selectedIssue.severity}</span></div>
                      <div>DEPARTMENT: <span className="text-slate-300">{selectedIssue.department}</span></div>
                      <div>ADDRESS: <span className="text-slate-300 truncate block">{selectedIssue.address}</span></div>
                    </div>
                  </div>
                </div>

                {/* DIY ACTION CORNER */}
                {selectedIssue.status !== 'resolved' && selectedIssue.severity !== 'high' && (
                  <div className="bg-gradient-to-r from-amber-500/10 to-amber-500/0 border border-amber-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <h5 className="text-xs font-bold text-amber-400 flex items-center justify-center sm:justify-start gap-1">
                        <Zap size={14} className="animate-pulse" /> Custom DIY Self-Help Quest Available!
                      </h5>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        This is a low-risk, non-harmful hazard. Patch or resolve it yourself to earn <strong>+200 XP, 250 Coins</strong>, and a <strong>DIY Hero Badge</strong>!
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveDiyQuestIssue(selectedIssue)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/10 shrink-0 flex items-center gap-1 active:scale-95"
                    >
                      <Zap size={12} /> Start DIY Quest
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'report' && (
        <ReportIssueForm
          userEmail={userProfile.email}
          userName={userProfile.name}
          onSuccess={(newIssue) => {
            onReportSuccess(newIssue);
            setSelectedIssue(newIssue);
            // If the issue is minor (severity is low or medium), offer the educational game!
            if (newIssue.severity === 'low' || newIssue.severity === 'medium') {
              setShowGamePrompt({ show: true, issue: newIssue });
            } else {
              setActiveTab('map');
            }
          }}
          onCancel={() => setActiveTab('map')}
        />
      )}

      {activeTab === 'verify' && (
        <div className="space-y-6">
          {/* Dual Segmented Toggle: Neighbors Board vs My Submitted Tracker */}
          <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit">
            <button
              onClick={() => {
                setVerifySubTab('neighbors');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 ${
                verifySubTab === 'neighbors' 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👥 Verify Neighbors' Reports
            </button>
            <button
              onClick={() => {
                setVerifySubTab('my_reports');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 relative ${
                verifySubTab === 'my_reports' 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📦 My Submitted Reports Tracker
              {issues.filter(i => i.reporterEmail === userProfile.email).length > 0 && (
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {issues.filter(i => i.reporterEmail === userProfile.email).length}
                </span>
              )}
            </button>
          </div>

          {verifySubTab === 'neighbors' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Vote className="text-amber-500" size={18} /> Community Verification Board
                  </h3>
                  <p className="text-xs text-slate-500">Support your neighbors! Review active reported complaints and endorse true reports to speed up resolution.</p>
                </div>

                {/* Categorization filter */}
                <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl text-xs font-mono border border-slate-900 w-fit self-end">
                  {['all', 'pothole', 'garbage', 'streetlight', 'leakage'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                        filterCategory === cat ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {feedIssues.length === 0 ? (
                <div className="text-center py-12 bg-slate-950/40 rounded-3xl border border-slate-900">
                  <p className="text-xs text-slate-500 font-mono">No active incidents found in this category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {feedIssues.map((issue) => {
                    const alreadyVerified = issue.verifications.includes(userProfile.email);
                    
                    return (
                      <div
                        key={issue.id}
                        className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all"
                      >
                        <div className="flex gap-4">
                          {issue.imageUrl && (
                            <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shrink-0 relative">
                              <img
                                src={issue.imageUrl}
                                alt={issue.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              {issue.severity === 'high' && (
                                <span className="absolute top-1 left-1 bg-rose-500 text-white font-mono font-bold text-[8px] px-1 rounded">HIGH</span>
                              )}
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                              <span className="uppercase">{issue.category}</span>
                              <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{issue.title}</h4>
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{issue.description}</p>
                            <p className="text-[10px] text-amber-500 font-mono mt-1 flex items-center gap-0.5">
                              <MapPin size={10} /> {issue.address.split(',')[0]}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-slate-900/60 pt-3.5 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-500 truncate max-w-[150px]">
                            Reported by {issue.reporterName}
                          </span>

                          <button
                            onClick={() => onVerifyIssue(issue.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                              alreadyVerified
                                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80'
                            }`}
                          >
                            <ThumbsUp size={12} fill={alreadyVerified ? 'currentColor' : 'none'} />
                            {alreadyVerified ? 'Endorsed (Undo)' : 'Endorse Report'} • {issue.verificationCount}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* MY REPORTS SHOPPING-STYLE TRACKER TAB */
            <div className="animate-fadeIn">
              {issues.filter(i => i.reporterEmail === userProfile.email).length === 0 ? (
                <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl max-w-lg mx-auto space-y-4">
                  <span className="text-4xl block">📦</span>
                  <h4 className="text-base font-bold text-slate-100">No Reports Logged</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    You haven't submitted any municipal alerts yet. Once you file an alert, you can track its real-time progress here with shopping order-style milestones.
                  </p>
                  <button
                    onClick={() => setActiveTab('report')}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 mx-auto"
                  >
                    <Sparkles size={14} fill="currentColor" /> Submit First Report
                  </button>
                </div>
              ) : (() => {
                const myReports = issues.filter(i => i.reporterEmail === userProfile.email);
                const currentTrackIssue = selectedTrackIssue || myReports[0];
                
                const isResolved = currentTrackIssue.status === 'resolved' || currentTrackIssue.status === 'community_resolved';
                const isInProgress = currentTrackIssue.status === 'in_progress';
                const isVerified = currentTrackIssue.status === 'verified';
                const isVerifying = currentTrackIssue.status === 'verifying';

                // Delivery date calculation helper
                const getEstimatedCompletionDate = (createdAtStr: string, estTime?: string) => {
                  const createdDate = new Date(createdAtStr);
                  let daysToAdd = 3;
                  if (estTime) {
                    if (estTime.includes('hour')) daysToAdd = 1;
                    else if (estTime.includes('day')) {
                      const match = estTime.match(/\d+/);
                      if (match) daysToAdd = parseInt(match[0]);
                    }
                  }
                  createdDate.setDate(createdDate.getDate() + daysToAdd);
                  return createdDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                };

                const estDate = getEstimatedCompletionDate(currentTrackIssue.createdAt, currentTrackIssue.estimatedResolutionTime);

                const stepsData = [
                  {
                    id: 1,
                    title: "Report Registered",
                    description: "Incident successfully logged on the CivicResolve municipal database, assigned a tracking ID.",
                    completed: true,
                    active: false,
                    icon: CheckSquare,
                    time: new Date(currentTrackIssue.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) + " • " + new Date(currentTrackIssue.createdAt).toLocaleDateString(),
                  },
                  {
                    id: 2,
                    title: "AI Analysis & Verification Board",
                    description: `Gemini classified hazard category with ${Math.round((currentTrackIssue.aiConfidence || 0.95) * 100)}% accuracy. Neighbors verify to expedite response.`,
                    completed: isVerified || isInProgress || isResolved,
                    active: currentTrackIssue.status === 'reported' || isVerifying,
                    icon: Sparkles,
                    time: currentTrackIssue.verificationCount > 0 ? `${currentTrackIssue.verificationCount} Endorsement(s)` : "Awaiting Endorsements",
                  },
                  {
                    id: 3,
                    title: "Dispatched to Authority",
                    description: `Dispatched and queued under ${currentTrackIssue.department}. Action order drafted.`,
                    completed: isInProgress || isResolved,
                    active: isVerified,
                    icon: Truck,
                    time: isVerified || isInProgress || isResolved ? "Dispatched" : "In queue",
                  },
                  {
                    id: 4,
                    title: "Fix & Remediation Active",
                    description: currentTrackIssue.assignedWorker 
                      ? `Remediation underway on-site. Dispatcher: ${currentTrackIssue.assignedWorker}` 
                      : "Remediation scheduled with city maintenance crew.",
                    completed: isResolved,
                    active: isInProgress,
                    icon: Wrench,
                    time: isInProgress ? "Active now" : (isResolved ? "Remediation completed" : "Scheduled"),
                  },
                  {
                    id: 5,
                    title: "Resolved & AI Certified",
                    description: isResolved 
                      ? (currentTrackIssue.resolutionProofDescription || "Remediation verified by AI computer vision comparison scanning. Path clear!") 
                      : "Awaiting final proof-of-work visual comparison scan to archive.",
                    completed: isResolved,
                    active: false,
                    icon: CheckCircle,
                    time: isResolved ? "AI Certified" : "Pending fix",
                  }
                ];

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left List Pane (5 Columns) */}
                    <div className="lg:col-span-5 space-y-3.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-mono font-bold text-slate-400 uppercase">SUBMITTED LIST ({myReports.length})</span>
                        <span className="text-[10px] text-slate-500 font-mono">SELECT TO TRACK</span>
                      </div>
                      
                      <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                        {myReports.map((report) => (
                          <div
                            key={report.id}
                            onClick={() => setSelectedTrackIssue(report)}
                            className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                              currentTrackIssue.id === report.id
                                ? 'bg-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/5'
                                : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <span className={`text-[8px] tracking-wide uppercase font-mono px-2 py-0.5 rounded ${getStatusBadgeClass(report.status)}`}>
                                {report.status.replace('_', ' ')}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                {new Date(report.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-200 truncate">{report.title}</h4>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{report.description}</p>
                            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-950 text-[10px] text-slate-500 font-mono">
                              <span className="truncate max-w-[130px]">{report.department}</span>
                              <span className="text-slate-400 font-bold">👍 {report.verificationCount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Detailed Tracker Pane (7 Columns) */}
                    <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-left space-y-6">
                      
                      {/* Tracking Header */}
                      <div className="border-b border-slate-800 pb-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">
                              {currentTrackIssue.category === 'pothole' ? '🕳️' :
                               currentTrackIssue.category === 'garbage' ? '🗑️' :
                               currentTrackIssue.category === 'streetlight' ? '💡' :
                               currentTrackIssue.category === 'leakage' ? '🚰' : '🛠️'}
                            </span>
                            <div>
                              <h3 className="text-sm font-bold text-slate-100">{currentTrackIssue.title}</h3>
                              <span className="text-[9px] font-mono text-slate-500 font-bold">HAZARD TRACKING ID: {currentTrackIssue.id.slice(0, 14)}</span>
                            </div>
                          </div>
                          <span className={`text-[9px] tracking-wide uppercase font-mono px-2 py-0.5 rounded ${getStatusBadgeClass(currentTrackIssue.status)}`}>
                            {currentTrackIssue.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Order Delivery Style Time Bar */}
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-[11px]">
                          <div className="flex items-center gap-2 text-amber-400 font-bold">
                            <Clock size={14} className="animate-pulse" />
                            <span>ESTIMATED REMEDIATION BY:</span>
                          </div>
                          <div className="text-slate-100 font-extrabold text-xs sm:text-right">
                            {isResolved ? (
                              <span className="text-emerald-400">✓ REMEDIATION COMPLETE & CERTIFIED</span>
                            ) : (
                              estDate
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Vertically Styled Order Milestones */}
                      <div className="relative pl-8 space-y-6 pt-1 pb-1">
                        {stepsData.map((step, idx) => {
                          const StepIcon = step.icon;
                          return (
                            <div key={step.id} className="relative">
                              {/* Connecting Line */}
                              {idx < stepsData.length - 1 && (
                                <div className={`absolute left-[-17px] top-6 bottom-[-24px] w-0.5 ${
                                  step.completed ? 'bg-emerald-500' : 'bg-slate-800'
                                }`} />
                              )}
                              {/* Icon Circle */}
                              <div className={`absolute left-[-26px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                                step.completed 
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                                  : step.active 
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.4)]' 
                                  : 'bg-slate-950 text-slate-500 border-slate-800'
                              }`}>
                                <StepIcon size={11} />
                              </div>
                              {/* Milestone Details */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h5 className={`text-xs font-bold font-mono uppercase tracking-wide ${
                                    step.completed ? 'text-emerald-400' : step.active ? 'text-amber-400' : 'text-slate-400'
                                  }`}>
                                    {step.title}
                                  </h5>
                                  <span className="text-[10px] font-mono text-slate-500 truncate">{step.time}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{step.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Municipal Dispatch Worker Details */}
                      {currentTrackIssue.assignedWorker && (
                        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/60 space-y-2 font-mono text-[11px]">
                          <div className="text-[9px] text-amber-500 font-bold uppercase tracking-wider mb-1">📋 MUNICIPAL ASSIGNED CREW</div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">ASSIGNED DISPATCHER:</span>
                            <span className="text-slate-200 font-bold flex items-center gap-1.5">
                              <User size={12} className="text-slate-400" /> {currentTrackIssue.assignedWorker}
                            </span>
                          </div>
                          {currentTrackIssue.assignedWorkerPhone && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">DIRECT DISPATCH HOTLINE:</span>
                              <span className="text-slate-200 font-bold flex items-center gap-1.5">
                                <Phone size={12} className="text-slate-400" /> {currentTrackIssue.assignedWorkerPhone}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Before vs After Visual Evidence Comparison */}
                      {isResolved && (currentTrackIssue.afterImageUrl || currentTrackIssue.resolutionProofUrl) && (
                        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/60 space-y-3">
                          <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider font-mono">🌟 RESOLUTION EVIDENCE DISPLAY (BEFORE & AFTER COMPARISON)</div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-slate-500 block">BEFORE HAZARD STATE</span>
                              <div className="h-24 rounded-lg overflow-hidden border border-slate-900 bg-slate-950">
                                <img src={currentTrackIssue.imageUrl} alt="Before State" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-slate-500 block">AFTER FIXED STATE</span>
                              <div className="h-24 rounded-lg overflow-hidden border border-slate-900 bg-emerald-950/10">
                                <img src={currentTrackIssue.afterImageUrl || currentTrackIssue.resolutionProofUrl} alt="After State" className="w-full h-full object-cover border border-emerald-500/20 rounded-lg" referrerPolicy="no-referrer" />
                              </div>
                            </div>
                          </div>
                          {currentTrackIssue.resolutionProofDescription && (
                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans bg-slate-900/60 p-2.5 rounded-xl border border-slate-900 mt-1">
                              <strong>Inspector Comments:</strong> {currentTrackIssue.resolutionProofDescription}
                            </p>
                          )}
                        </div>
                      )}

                      {/* DIY Quest Accelerator CTA */}
                      {!isResolved && currentTrackIssue.severity !== 'high' && currentTrackIssue.safetyLevel === 'safe' && (
                        <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="space-y-1 text-center sm:text-left">
                            <h6 className="text-xs font-bold text-amber-400 flex items-center justify-center sm:justify-start gap-1">
                              <Zap size={14} className="animate-pulse text-amber-500" /> SPEED UP RESOLUTION WITH DIY QUEST!
                            </h6>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              Can't wait for city crew schedules? Fix this low-risk hazard yourself to earn <strong>+200 XP, 250 Coins</strong> and the <strong>DIY Hero Badge</strong>!
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setActiveDiyQuestIssue(currentTrackIssue);
                            }}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/15 flex items-center gap-1 shrink-0 whitespace-nowrap active:scale-95"
                          >
                            <Zap size={12} fill="currentColor" /> Solve via DIY Quest
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {activeTab === 'game' && (
        <MiniGame
          userEmail={userProfile.email}
          onGameComplete={handleGameComplete}
        />
      )}

      {activeTab === 'rewards' && (
        <div className="space-y-8">
          <BadgesTab userProfile={userProfile} onRedeemCoins={onRedeemCoins} />
          
          <div className="border-t border-slate-800 pt-8">
            <LeaderboardTab
              leaderboard={leaderboard}
              currentUserEmail={userProfile.email}
            />
          </div>
        </div>
      )}

      {/* Interactive Academy Game Prompt Modal */}
      <AnimatePresence>
        {showGamePrompt.show && showGamePrompt.issue && (
          <div id="safety_academy_prompt_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 text-center relative overflow-hidden"
            >
              {/* Decorative radial lighting */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
                <Gamepad2 size={32} className="animate-bounce" />
              </div>

              <div className="space-y-2">
                <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2.5 py-1 rounded-full font-mono font-medium tracking-wider flex items-center justify-center gap-1 w-fit mx-auto">
                  <Zap size={12} className="animate-pulse" /> AI DETECTED MINOR INCIDENT
                </span>
                <h3 className="text-xl font-bold text-slate-100">{showGamePrompt.issue.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gemini analyzed your report as a minor safety incident. You can safely clear, manage, or fix this everyday hazard yourself and receive double community rewards!
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-left space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>POTENTIAL REWARDS</span>
                  <span className="text-amber-400">BOUNTY INCOMING</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">✨ Academy XP Points</span>
                  <span className="text-slate-200 font-bold">+200 XP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">🪙 Gold Coins</span>
                  <span className="text-slate-200 font-bold">+250 Coins</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">🎖️ Academy Achievement Badge</span>
                  <span className="text-amber-400 font-bold">Safety DIY Hero</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  id="skip_academy_btn"
                  onClick={() => {
                    setShowGamePrompt({ show: false, issue: null });
                    setActiveTab('map');
                  }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/60 transition-colors"
                >
                  Skip for Now
                </button>
                <button
                  id="enter_diy_quest_btn_modal"
                  onClick={() => {
                    setShowGamePrompt({ show: false, issue: null });
                    setActiveDiyQuestIssue(showGamePrompt.issue);
                  }}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1"
                >
                  <Zap size={14} /> Start DIY Quest
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
