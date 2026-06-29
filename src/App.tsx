import React, { useState, useEffect } from 'react';
import { Issue, UserProfile, LeaderboardEntry } from './types';
import { MOCK_LEADERBOARD, SYSTEM_STATS } from './data';
import CitizenDashboard from './components/CitizenDashboard';
import AuthorityPortal from './components/AuthorityPortal';
import AdminDashboard from './components/AdminDashboard';
import { Sparkles, Shield, Users, LogOut, Info, CheckCircle, Flame, Target, Trophy, HelpCircle, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginRole, setLoginRole] = useState<'citizen' | 'authority' | 'admin'>('citizen');
  const [loginMode, setLoginMode] = useState<'signin' | 'signup'>('signin');
  
  // App-wide data states
  const [issues, setIssues] = useState<Issue[]>([]);
  const [usersRegistry, setUsersRegistry] = useState<Record<string, UserProfile>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' | null }>({ text: '', type: null });

  // 1. Fetch Issues and Hydrate Profiles on Mount
  const fetchIssues = async () => {
    try {
      const response = await fetch('/api/issues');
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      }
    } catch (e) {
      console.error('Error fetching issues from backend:', e);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // Show self-destructing toast notifications
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification({ text: '', type: null });
    }, 4500);
  };

  // 2. Profile Sync or Registration Flow
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = loginEmail.trim().toLowerCase();
    if (!email) return;

    try {
      // Check if user already exists
      const checkResponse = await fetch(`/api/user/check?email=${encodeURIComponent(email)}`);
      let userExists = false;
      let existingProfileData: any = null;
      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        userExists = checkResult.exists;
        existingProfileData = checkResult;
      }

      if (loginMode === 'signin') {
        if (!userExists) {
          showToast(`This email is not registered yet. Switch to "Sign Up" to create a new profile!`, 'info');
          setLoginMode('signup');
          return;
        }

        // Fetch registered user profile
        const response = await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        if (response.ok) {
          const profile = await response.json();
          setCurrentUser(profile);
          setUsersRegistry(prev => ({ ...prev, [profile.email]: profile }));
          showToast(`Welcome back, ${profile.name}! Joined as ${profile.role.toUpperCase()}`, 'success');
        }
      } else {
        // Sign Up Mode
        if (userExists) {
          showToast(`Account already exists! Logging you into your registered ${existingProfileData.role.toUpperCase()} profile...`, 'info');
          
          const response = await fetch('/api/user/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });

          if (response.ok) {
            const profile = await response.json();
            setCurrentUser(profile);
            setUsersRegistry(prev => ({ ...prev, [profile.email]: profile }));
          }
          return;
        }

        // Create new account
        const nameToUse = loginName.trim() || email.split('@')[0];
        const response = await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name: nameToUse,
            role: loginRole
          })
        });

        if (response.ok) {
          const profile = await response.json();
          setCurrentUser(profile);
          setUsersRegistry(prev => ({ ...prev, [profile.email]: profile }));
          showToast(`Successfully registered and logged in as ${profile.name} (${profile.role})`, 'success');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Connection failed. Operating in offline sandbox mode.', 'error');
      
      // Offline fallback profile
      const fallbackProfile: UserProfile = {
        id: `user-${Date.now()}`,
        name: loginName.trim() || email.split('@')[0],
        email: email,
        role: loginRole,
        points: loginRole === 'citizen' ? 40 : 0,
        coins: loginRole === 'citizen' ? 10 : 0,
        badges: [],
        verificationsDone: 0,
        reportsFiled: 0,
        gameCompletedCount: 0
      };
      setCurrentUser(fallbackProfile);
      setUsersRegistry(prev => ({ ...prev, [email]: fallbackProfile }));
    }
  };

  // 3. Quick Login Presets for convenient testing
  const handlePresetLogin = async (preset: 'citizen' | 'authority' | 'admin') => {
    let email = '';
    let name = '';
    let role: 'citizen' | 'authority' | 'admin' = 'citizen';

    if (preset === 'citizen') {
      email = 'nav090105@gmail.com';
      name = 'Nav';
      role = 'citizen';
    } else if (preset === 'authority') {
      email = 'authority@city.gov';
      name = 'Officer Davis';
      role = 'authority';
    } else {
      email = 'admin@city.gov';
      name = 'Admin Director Sarah';
      role = 'admin';
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role })
      });

      if (response.ok) {
        const profile = await response.json();
        setCurrentUser(profile);
        setUsersRegistry(prev => ({ ...prev, [profile.email]: profile }));
        showToast(`Logged in with Preset: ${profile.name}`, 'success');
      }
    } catch (e) {
      console.error(e);
      // Offline preset fallback
      const offlineProfile: UserProfile = {
        id: `preset-${preset}`,
        name: name,
        email: email,
        role: role,
        department: role === 'authority' ? 'Department of Transportation' : undefined,
        points: role === 'citizen' ? 120 : 0,
        coins: role === 'citizen' ? 80 : 0,
        badges: role === 'citizen' ? ['first_report', 'pothole_patrol'] : [],
        verificationsDone: role === 'citizen' ? 3 : 0,
        reportsFiled: role === 'citizen' ? 4 : 0,
        gameCompletedCount: role === 'citizen' ? 1 : 0
      };
      setCurrentUser(offlineProfile);
      setUsersRegistry(prev => ({ ...prev, [email]: offlineProfile }));
      showToast(`Logged in in offline mode: ${name}`, 'info');
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setLoginEmail('');
    setLoginName('');
    showToast('Signed out of Municipal Platform', 'info');
  };

  // 4. API Endpoints handlers called by child pages

  // A. Create new issue report
  const handleReportSuccess = (newIssue: Issue) => {
    setIssues(prev => [newIssue, ...prev]);
    showToast('Incident published to public operations database successfully!', 'success');
    
    // Update local user points & metrics locally so it reflects in UI instantly
    if (currentUser) {
      const updatedProfile = {
        ...currentUser,
        reportsFiled: currentUser.reportsFiled + 1,
        points: currentUser.points + 30,
        badges: currentUser.reportsFiled + 1 >= 1 && !currentUser.badges.includes('first_report')
          ? [...currentUser.badges, 'first_report']
          : currentUser.badges
      };
      setCurrentUser(updatedProfile);
      setUsersRegistry(prev => ({ ...prev, [currentUser.email]: updatedProfile }));

      // Sync user profile stats inside leaderboard
      setLeaderboard(prev => {
        const exists = prev.find(l => l.name === currentUser.name);
        if (exists) {
          return prev.map(l => l.name === currentUser.name ? { ...l, points: updatedProfile.points, reportsCount: updatedProfile.reportsFiled } : l);
        }
        return [...prev, { rank: prev.length + 1, name: currentUser.name, points: updatedProfile.points, reportsCount: updatedProfile.reportsFiled, role: 'Active Neighbor' }];
      });
    }
  };

  // B. Endorse / Verify an issue
  const handleVerifyIssue = async (issueId: string) => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/issues/${issueId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: currentUser.email })
      });

      if (response.ok) {
        const updatedIssue = await response.json();
        setIssues(prev => prev.map(i => i.id === issueId ? updatedIssue : i));
        
        // Update local user state
        const added = updatedIssue.verifications.includes(currentUser.email);
        const ptsChange = added ? 10 : -10;
        const verifChange = added ? 1 : -1;
        
        const updatedProfile = {
          ...currentUser,
          points: Math.max(0, currentUser.points + ptsChange),
          verificationsDone: Math.max(0, currentUser.verificationsDone + verifChange),
          badges: currentUser.verificationsDone + verifChange >= 5 && !currentUser.badges.includes('community_guardian')
            ? [...currentUser.badges, 'community_guardian']
            : currentUser.badges
        };
        setCurrentUser(updatedProfile);
        setUsersRegistry(prev => ({ ...prev, [currentUser.email]: updatedProfile }));
        
        showToast(added ? 'Report endorsed! Civic points credited.' : 'Endorsement withdrawn.', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Database synchronization error.', 'error');
    }
  };

  // C. Update Issue status (Officer)
  const handleUpdateIssueStatus = async (
    issueId: string, 
    status: string, 
    proofUrl?: string, 
    proofDesc?: string,
    assignedWorker?: string,
    assignedWorkerPhone?: string,
    afterImageUrl?: string
  ) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          resolutionProofUrl: proofUrl,
          resolutionProofDescription: proofDesc,
          assignedWorker,
          assignedWorkerPhone,
          afterImageUrl
        })
      });

      if (response.ok) {
        const updatedIssue = await response.json();
        setIssues(prev => prev.map(i => i.id === issueId ? updatedIssue : i));
        showToast(`Work order status updated to ${status.replace('_', ' ')}`, 'success');
      }
    } catch (e) {
      console.error(e);
      // Offline fallback
      setIssues(prev => prev.map(i => {
        if (i.id === issueId) {
          return {
            ...i,
            status: status as any,
            resolutionProofUrl: proofUrl || i.resolutionProofUrl,
            resolutionProofDescription: proofDesc || i.resolutionProofDescription,
            assignedWorker: assignedWorker !== undefined ? assignedWorker : i.assignedWorker,
            assignedWorkerPhone: assignedWorkerPhone !== undefined ? assignedWorkerPhone : i.assignedWorkerPhone,
            afterImageUrl: afterImageUrl !== undefined ? afterImageUrl : i.afterImageUrl,
            updatedAt: new Date().toISOString()
          };
        }
        return i;
      }));
      showToast('Work order updated in local state (Offline Mode).', 'success');
    }
  };

  // C2. Create Preventative Ticket (AI Predictive dashboard)
  const handleCreatePreventativeTicket = async (ticket: {
    title: string;
    description: string;
    category: any;
    address: string;
    latitude: number;
    longitude: number;
    severity: 'low' | 'medium' | 'high';
  }) => {
    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ticket,
          isPreventative: true,
          userEmail: currentUser?.email || 'admin@city.gov',
          userName: currentUser?.name || 'Municipal Predictive Service'
        })
      });

      if (response.ok) {
        const createdIssue = await response.json();
        setIssues(prev => [createdIssue, ...prev]);
        showToast('Preventative dispatch published and crew queued!', 'success');
      } else {
        throw new Error('API failed');
      }
    } catch (e) {
      console.error(e);
      const mockTicket = {
        id: `issue-${Date.now()}`,
        status: 'reported' as any,
        ...ticket,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reporterName: currentUser?.name || 'Municipal Predictive Service',
        reporterEmail: currentUser?.email || 'admin@city.gov',
        imageUrl: 'https://images.unsplash.com/photo-1599740831464-5aefe11fca9a?auto=format&fit=crop&q=80&w=600',
        verificationCount: 0,
        downvoteCount: 0,
        verifications: [],
        aiConfidence: 0.98,
        aiReasoning: 'Preventative dispatch queued offline.'
      };
      setIssues(prev => [mockTicket, ...prev]);
      showToast('Preventative dispatch queued in local state (Offline Mode).', 'success');
    }
  };

  // D. safety mini-game completed callback
  const handleGameComplete = async (score: number) => {
    if (!currentUser) return;

    try {
      const response = await fetch('/api/user/game-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: currentUser.email, score })
      });

      if (response.ok) {
        const profile = await response.json();
        setCurrentUser(profile);
        setUsersRegistry(prev => ({ ...prev, [profile.email]: profile }));
        showToast(`Academy training complete! Unlocked safety rewards.`, 'success');
      }
    } catch (err) {
      console.error(err);
      // Offline fallback reward
      const updatedProfile = {
        ...currentUser,
        points: currentUser.points + Math.round(score / 2),
        gameCompletedCount: currentUser.gameCompletedCount + 1,
        badges: score >= 100 && !currentUser.badges.includes('safety_champion')
          ? [...currentUser.badges, 'safety_champion']
          : currentUser.badges
      };
      setCurrentUser(updatedProfile);
      setUsersRegistry(prev => ({ ...prev, [currentUser.email]: updatedProfile }));
      showToast('Academy offline rewards logged.', 'info');
    }
  };

  // D2. spend coins on community rewards
  const handleRedeemCoins = async (cost: number) => {
    if (!currentUser) return false;
    try {
      const response = await fetch('/api/user/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: currentUser.email, cost })
      });
      if (response.ok) {
        const profile = await response.json();
        setCurrentUser(profile);
        setUsersRegistry(prev => ({ ...prev, [profile.email]: profile }));
        showToast('Redeemed successfully!', 'success');
        return true;
      } else {
        const err = await response.json();
        showToast(err.error || 'Redemption failed', 'error');
        return false;
      }
    } catch (e) {
      console.error(e);
      // offline fallback
      if (currentUser.coins >= cost) {
        const profile = { ...currentUser, coins: currentUser.coins - cost };
        setCurrentUser(profile);
        setUsersRegistry(prev => ({ ...prev, [profile.email]: profile }));
        showToast('Redeemed successfully! (Offline Mode)', 'success');
        return true;
      }
      showToast('Insufficient coins', 'error');
      return false;
    }
  };

  // E. Update User Role (Admin controller)
  const handleUpdateUserRole = (email: string, role: 'citizen' | 'authority' | 'admin', department?: string) => {
    setUsersRegistry(prev => {
      const target = prev[email];
      if (!target) return prev;
      
      const updated = {
        ...target,
        role,
        department
      };

      showToast(`Clearance for ${target.name} adjusted to ${role}`, 'success');

      // if modifying current user, sync immediately
      if (currentUser?.email === email) {
        setCurrentUser(updated);
      }

      return {
        ...prev,
        [email]: updated
      };
    });
  };

  // Synchronize users registry with standard profiles if empty
  useEffect(() => {
    if (Object.keys(usersRegistry).length === 0) {
      // populate with mock preset emails
      setUsersRegistry({
        'nav090105@gmail.com': {
          id: 'user-nav',
          name: 'Nav',
          email: 'nav090105@gmail.com',
          role: 'citizen',
          points: 120,
          badges: ['first_report', 'pothole_patrol'],
          verificationsDone: 3,
          reportsFiled: 4,
          gameCompletedCount: 1
        },
        'authority@city.gov': {
          id: 'user-auth',
          name: 'Officer Davis',
          email: 'authority@city.gov',
          role: 'authority',
          department: 'Department of Transportation',
          points: 0,
          badges: [],
          verificationsDone: 0,
          reportsFiled: 0,
          gameCompletedCount: 0
        },
        'admin@city.gov': {
          id: 'user-admin',
          name: 'Admin Director Sarah',
          email: 'admin@city.gov',
          role: 'admin',
          points: 0,
          badges: [],
          verificationsDone: 0,
          reportsFiled: 0,
          gameCompletedCount: 0
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans antialiased">
      
      {/* GLOWING TOAST NOTIFICATION CONTAINER */}
      {notification.text && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-fadeIn bg-slate-900 border border-slate-800 text-xs px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md max-w-sm">
          {notification.type === 'success' ? (
            <span className="text-emerald-400 font-bold">✓</span>
          ) : notification.type === 'error' ? (
            <span className="text-rose-400 font-bold">⚠️</span>
          ) : (
            <span className="text-amber-400 font-bold">ℹ</span>
          )}
          <span className="text-slate-200 font-medium">{notification.text}</span>
        </div>
      )}

      {/* TOP HEADER STATUS BRAND BAR */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👁️</span>
            <div>
              <span className="text-sm font-black tracking-tight text-slate-100">CivicResolve</span>
              <span className="text-[9px] font-mono font-bold text-amber-500 block leading-none">AI OP PLATFORM</span>
            </div>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-xl text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-400 uppercase text-[10px]">{currentUser.role} ID:</span>
                <span className="text-slate-100 font-bold">{currentUser.name}</span>
              </div>
              <button
                id="sign_out_btn"
                onClick={handleSignOut}
                className="bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 p-2 rounded-xl transition-all border border-slate-800 flex items-center justify-center"
                title="Disconnect Persona"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500/40" /> Seattle Metropolitan Node Connected
            </div>
          )}
        </div>
      </header>

      {/* PRIMARY VIEWS DISPATCHER */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser ? (
          /* ACTIVE USER ROUTER */
          <div>
            {currentUser.role === 'citizen' && (
              <CitizenDashboard
                issues={issues}
                userProfile={currentUser}
                leaderboard={leaderboard}
                onReportSuccess={handleReportSuccess}
                onVerifyIssue={handleVerifyIssue}
                onGameComplete={handleGameComplete}
                onRedeemCoins={handleRedeemCoins}
                onUpdateIssueStatus={handleUpdateIssueStatus}
                onAddPreventativeTicket={handleCreatePreventativeTicket}
              />
            )}
            {currentUser.role === 'authority' && (
              <AuthorityPortal
                issues={issues}
                departmentName={currentUser.department || 'Department of Transportation'}
                onUpdateIssueStatus={handleUpdateIssueStatus}
                onAddPreventativeTicket={handleCreatePreventativeTicket}
              />
            )}
            {currentUser.role === 'admin' && (
              <AdminDashboard
                issues={issues}
                users={usersRegistry}
                onUpdateUserRole={handleUpdateUserRole}
              />
            )}
          </div>
        ) : (
          /* LOGIN OR QUICK PRESENTS CONTAINER */
          <div className="max-w-md mx-auto space-y-6 my-8 animate-fadeIn">
            
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Access CivicResolve Gateway</h1>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Securely report active street defects, review neighborhood logs, and trace municipal public work dispatches.
              </p>
            </div>

            {/* Quick Testing Presets */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-300 font-mono uppercase flex items-center gap-1.5">
                  ⚡ Quick Role presets
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Quickly swap clearances to test the Citizen, Authority, and Admin views</p>
              </div>

              <div className="space-y-2.5">
                <button
                  id="preset_citizen_btn"
                  onClick={() => handlePresetLogin('citizen')}
                  className="w-full p-4 bg-slate-950 hover:bg-slate-900 border border-slate-850/80 hover:border-slate-700 rounded-2xl flex items-center justify-between text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">👩‍👩‍👧‍👦</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Test Citizen Portal</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Profile: Nav • 120 pts • 2 Badges</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">CHOOSE</span>
                </button>

                <button
                  id="preset_authority_btn"
                  onClick={() => handlePresetLogin('authority')}
                  className="w-full p-4 bg-slate-950 hover:bg-slate-900 border border-slate-850/80 hover:border-slate-700 rounded-2xl flex items-center justify-between text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">👮</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Test Authority Dashboard</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Profile: Officer Davis • DOT Dispatcher</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">CHOOSE</span>
                </button>

                <button
                  id="preset_admin_btn"
                  onClick={() => handlePresetLogin('admin')}
                  className="w-full p-4 bg-slate-950 hover:bg-slate-900 border border-slate-850/80 hover:border-slate-700 rounded-2xl flex items-center justify-between text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">👑</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Test Admin Board</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Profile: Admin Director Sarah • Insights Controller</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">CHOOSE</span>
                </button>
              </div>
            </div>

            {/* Custom Register/Login form */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3 gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-300 font-mono uppercase">
                    {loginMode === 'signin' ? 'Sign In Gate' : 'Sign Up Register'}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {loginMode === 'signin' 
                      ? 'Access existing citizen or officer dashboards' 
                      : 'Enroll a new profile with role clearance'}
                  </p>
                </div>

                {/* Switcher Toggle tabs */}
                <div className="bg-slate-950 p-1 rounded-xl flex border border-slate-850 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('signin');
                      setLoginName('');
                    }}
                    className={`px-3 py-1 text-[10px] font-mono rounded-lg transition-all ${
                      loginMode === 'signin' 
                        ? 'bg-amber-500 text-slate-950 font-extrabold' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMode('signup')}
                    className={`px-3 py-1 text-[10px] font-mono rounded-lg transition-all ${
                      loginMode === 'signup' 
                        ? 'bg-amber-500 text-slate-950 font-extrabold' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Your Email Address</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g., citizen@mymail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-amber-500/40 transition-all"
                  />
                </div>

                {loginMode === 'signup' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Your Name (Optional)</label>
                      <input
                        type="text"
                        value={loginName}
                        onChange={(e) => setLoginName(e.target.value)}
                        placeholder="e.g., Alex Johnson"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-amber-500/40 transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Requested Role Clearance</label>
                      <select
                        value={loginRole}
                        onChange={(e) => setLoginRole(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="citizen">Active Citizen</option>
                        <option value="authority">Authority (Municipal Officer)</option>
                        <option value="admin">Admin Controller</option>
                      </select>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  id="submit_login_btn"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors mt-2 uppercase tracking-wide"
                >
                  {loginMode === 'signin' ? 'Verify & Sign In' : 'Register Custom Account'}
                </button>
              </form>
            </div>

            {/* Platform summary stats */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 text-[11px] font-mono text-slate-500 leading-normal">
              <span className="text-slate-400 block font-bold mb-1">MUNICIPAL DEPLOYMENT TELEMETRY:</span>
              <p>• Total City complaints logged: {SYSTEM_STATS.totalIssuesReported}</p>
              <p>• Successfully resolved: {SYSTEM_STATS.resolvedIssues}</p>
              <p>• Registered active citizens: {SYSTEM_STATS.citizensRegistered}</p>
            </div>

          </div>
        )}
      </main>

      {/* STYLISH HUMBLE FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div>
            <span>© 2026 CivicResolve. Developed on AI Studio Node.</span>
          </div>
          <div className="flex gap-4">
            <span>Server: CJS Output • Port 3000</span>
            <span>•</span>
            <span>Engine: Gemini-3.5-Flash</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
