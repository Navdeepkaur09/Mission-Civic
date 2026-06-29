import { useState } from 'react';
import { Badge, UserProfile } from '../types';
import { ALL_BADGES } from '../data';
import { ShieldAlert, Award, Star, Heart, TrendingUp, CheckCircle, Flame } from 'lucide-react';

interface BadgesTabProps {
  userProfile: UserProfile;
  onRedeemCoins: (cost: number) => Promise<boolean>;
}

const SHOP_ITEMS = [
  { id: 'transit', name: '🚍 1-Week Bus Transit Pass', cost: 150, desc: 'Unlimited travel on Metro City buses and light rails.' },
  { id: 'tree', name: '🌳 Zip Code Tree Planting', cost: 100, desc: 'Co-sponsor planting a green canopy street tree in your area.' },
  { id: 'park', name: '🎟️ Green Alley Festival Entry', cost: 200, desc: 'Free standard admission ticket to the next municipal concert.' },
  { id: 'coffee', name: '☕ Local Merchant Coffee Voucher', cost: 80, desc: 'A redeemable $5 discount code at participating local cafes.' }
];

export default function BadgesTab({ userProfile, onRedeemCoins }: BadgesTabProps) {
  const [redeemingItemId, setRedeemingItemId] = useState<string | null>(null);
  const [unlockedReward, setUnlockedReward] = useState<{ name: string; code: string } | null>(null);

  const handleRedeem = async (itemId: string, cost: number, itemName: string) => {
    setRedeemingItemId(itemId);
    try {
      const success = await onRedeemCoins(cost);
      if (success) {
        const randomCode = `CIVIC-REDEEM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        setUnlockedReward({ name: itemName, code: randomCode });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRedeemingItemId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Profile Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 font-bold shrink-0 text-lg border border-amber-500/20">
            ★
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Accumulated XP</p>
            <p className="text-xl font-black text-slate-100 font-mono mt-0.5">{userProfile.points} XP</p>
            <p className="text-[9px] text-slate-400 mt-1">Total experience</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/20">
            🪙
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Gold Coins</p>
            <p className="text-xl font-black text-slate-100 font-mono mt-0.5">{userProfile.coins || 0}</p>
            <p className="text-[9px] text-slate-400 mt-1">Spendable balance</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Reports Published</p>
            <p className="text-xl font-black text-slate-100 font-mono mt-0.5">{userProfile.reportsFiled}</p>
            <p className="text-[9px] text-slate-400 mt-1">+30 points per report</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Votes Approved</p>
            <p className="text-xl font-black text-slate-100 font-mono mt-0.5">{userProfile.verificationsDone}</p>
            <p className="text-[9px] text-slate-400 mt-1">+10 points per vote</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-400 shrink-0 border border-orange-500/20">
            <Flame size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Academy Completed</p>
            <p className="text-xl font-black text-slate-100 font-mono mt-0.5">{userProfile.gameCompletedCount}</p>
            <p className="text-[9px] text-slate-400 mt-1">Trainings completed</p>
          </div>
        </div>

      </div>

      {/* Badges and milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Badges Grid Panel */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-100">Municipal Badge Catalog</h3>
            <p className="text-xs text-slate-500 mt-1">Unlock specialized badges and raise your civic tier rank</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ALL_BADGES.map((badge) => {
              const isUnlocked = userProfile.badges.includes(badge.id) || userProfile.points >= badge.pointsRequired;
              
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-xl border flex gap-3.5 transition-all relative overflow-hidden ${
                    isUnlocked
                      ? 'bg-slate-900 border-slate-800 shadow-md'
                      : 'bg-slate-950/60 border-slate-900/80 opacity-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    isUnlocked
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-slate-900 text-slate-600'
                  }`}>
                    {/* Simplified icon mapper */}
                    <span className="text-lg font-bold">
                      {badge.icon === 'Flag' && '🚩'}
                      {badge.icon === 'Hammer' && '🛠️'}
                      {badge.icon === 'ShieldCheck' && '🛡️'}
                      {badge.icon === 'Trash2' && '🗑️'}
                      {badge.icon === 'Lightbulb' && '💡'}
                      {badge.icon === 'Award' && '🏆'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      {badge.name} {isUnlocked && <span className="text-[9px] text-emerald-400 bg-emerald-400/10 px-1 rounded">Unlocked</span>}
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-normal">{badge.description}</p>
                    <p className="text-[9px] text-slate-500 font-mono mt-1">Unlock threshold: {badge.pointsRequired} pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Impact Dashboard panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <Heart className="text-rose-400" size={16} /> Civic Impact Quotient
              </h3>
              <p className="text-xs text-slate-500 mt-1">Real-time projection of your active contributions to Metro City</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">CITIZEN SAFETY RATING:</span>
                  <span className="text-amber-400 font-bold">Silver Tier II</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: '65%' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-4 text-center">
                <div>
                  <p className="text-[10px] text-slate-500 font-mono">NEIGHBOR IMPACT</p>
                  <p className="text-lg font-bold text-emerald-400 mt-0.5">84 Households</p>
                  <p className="text-[9px] text-slate-500">Benefited from resolution</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-mono">MUNICIPAL HOURS SAVED</p>
                  <p className="text-lg font-bold text-blue-400 mt-0.5">14.2 Hours</p>
                  <p className="text-[9px] text-slate-500">Via prompt AI routing</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-900">
              "By submitting local alerts with rich photos and testing your knowledge in the safety academy, you keep the grid secure and help municipal crews route resources efficiently."
            </p>
          </div>

          <div className="border-t border-slate-800 pt-5 mt-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">METRO COOPERATIVE SHOP</span>
              <span className="text-[10px] font-mono text-amber-500 flex items-center gap-1 font-bold">
                🪙 {userProfile.coins || 0} Coins
              </span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {SHOP_ITEMS.map((item) => {
                const canAfford = (userProfile.coins || 0) >= item.cost;
                const isRedeeming = redeemingItemId === item.id;

                return (
                  <div key={item.id} className="bg-slate-950/70 p-3 rounded-xl border border-slate-900 flex justify-between items-center gap-3">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-200 leading-tight">{item.name}</h4>
                      <p className="text-[9px] text-slate-500 leading-normal">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleRedeem(item.id, item.cost, item.name)}
                      disabled={!canAfford || isRedeeming}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold shrink-0 transition-all ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm shadow-amber-500/10 cursor-pointer active:scale-95'
                          : 'bg-slate-850 text-slate-600 cursor-not-allowed border border-slate-900/40'
                      }`}
                    >
                      {isRedeeming ? '...' : `🪙 ${item.cost}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Celebrating successful coin redemptions */}
      {unlockedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 text-3xl">
              🎁
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                REDEMPTION SUCCESSFUL
              </span>
              <h3 className="text-sm font-bold text-slate-100">{unlockedReward.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your reward is confirmed! Show this digital coupon at city centers or enter the code during checkout.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-dashed border-slate-800 space-y-1.5 font-mono">
              <span className="text-[9px] text-slate-500 block uppercase">YOUR UNIQUE CIVIC CODE</span>
              <span className="text-lg font-black text-amber-400 tracking-widest">{unlockedReward.code}</span>
            </div>

            <button
              onClick={() => setUnlockedReward(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
            >
              Back to Catalog
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
