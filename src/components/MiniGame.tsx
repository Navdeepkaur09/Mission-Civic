import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, CheckCircle, Trash2, HelpCircle, Trophy, RefreshCw, Star, Play, Award, Zap } from 'lucide-react';

interface Scenario {
  id: number;
  title: string;
  instructions: string;
  safetyTip: string;
}

export default function MiniGame({ userEmail, onGameComplete }: { userEmail: string; onGameComplete: (score: number) => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [completedScenarios, setCompletedScenarios] = useState<number[]>([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | null }>({ text: '', type: null });

  // Scenario 1 State: Storm Drain items
  const [drainItems, setDrainItems] = useState([
    { id: 'leaf-1', label: '🍂 Dry Leaf', isHazard: false, cleared: false },
    { id: 'can-1', label: '🥤 Soda Can', isHazard: false, cleared: false },
    { id: 'leaf-2', label: '🍁 Dry Leaf', isHazard: false, cleared: false },
    { id: 'needle-1', label: '💉 Unknown Syringe (HAZARD!)', isHazard: true, cleared: false },
    { id: 'bag-1', label: '🛍️ Plastic Bag', isHazard: false, cleared: false },
  ]);

  // Scenario 2 State: Trash Can lid
  const [lidSecured, setLidSecured] = useState(false);
  const [bungeesAttached, setBungeesAttached] = useState(0);
  const [dogDistance, setDogDistance] = useState(100); // percentage distance

  // Scenario 3 State: Sidewalk branches
  const [conesPlaced, setConesPlaced] = useState<boolean[]>([false, false, false]);
  const [photoTaken, setPhotoTaken] = useState(false);

  // General Timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && timeLeft > 0 && !gameFinished) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleScenarioFailure('Time expired! Remember to act quickly but cautiously.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, gameFinished]);

  // Scenario 2 Dog Timer
  useEffect(() => {
    let dogTimer: any;
    if (isPlaying && currentScenario === 2 && !gameFinished) {
      dogTimer = setInterval(() => {
        setDogDistance((prev) => {
          if (prev <= 0) {
            if (!lidSecured || bungeesAttached < 2) {
              handleScenarioFailure('Stray dogs tipped the garbage over! Always secure the latch and bungees properly.');
            }
            return 100;
          }
          return prev - 8;
        });
      }, 800);
    }
    return () => clearInterval(dogTimer);
  }, [isPlaying, currentScenario, lidSecured, bungeesAttached, gameFinished]);

  const handleStartGame = () => {
    setIsPlaying(true);
    setScore(0);
    setCurrentScenario(1);
    setTimeLeft(25);
    setCompletedScenarios([]);
    setGameFinished(false);
    setMessage({ text: 'Clear the storm drain! Tap non-hazardous items. DO NOT touch the hazard.', type: 'info' });
    
    // reset scenarios
    setDrainItems([
      { id: 'leaf-1', label: '🍂 Dry Leaf', isHazard: false, cleared: false },
      { id: 'can-1', label: '🥤 Soda Can', isHazard: false, cleared: false },
      { id: 'leaf-2', label: '🍁 Dry Leaf', isHazard: false, cleared: false },
      { id: 'needle-1', label: '💉 Unknown Syringe (HAZARD!)', isHazard: true, cleared: false },
      { id: 'bag-1', label: '🛍️ Plastic Bag', isHazard: false, cleared: false },
    ]);
    setLidSecured(false);
    setBungeesAttached(0);
    setDogDistance(100);
    setConesPlaced([false, false, false]);
    setPhotoTaken(false);
  };

  const handleScenarioFailure = (failMsg: string) => {
    setMessage({ text: failMsg, type: 'error' });
    setScore((prev) => Math.max(0, prev - 20));
    advanceScenario();
  };

  const advanceScenario = () => {
    if (currentScenario === 1) {
      setCurrentScenario(2);
      setTimeLeft(20);
      setDogDistance(100);
      setMessage({ text: 'STRAY ANIMALS APPROACHING! Fast! Tap to close the lid, then add 2 bungee straps.', type: 'info' });
    } else if (currentScenario === 2) {
      setCurrentScenario(3);
      setTimeLeft(20);
      setMessage({ text: 'A heavy broken branch blocks the path. Place 3 orange warning safety cones, then document the hazard.', type: 'info' });
    } else {
      // Game ended
      setGameFinished(true);
      setIsPlaying(false);
      // Trigger callback with final score
      const finalScore = score + (timeLeft * 2);
      onGameComplete(finalScore);
    }
  };

  // Scenario 1 Handlers
  const handleItemTap = (itemId: string, isHazard: boolean) => {
    if (isHazard) {
      handleScenarioFailure('Safety Violation! Never pick up hazardous sharp items like syringes. Report them immediately to the city authority!');
      return;
    }

    setDrainItems((prev) => {
      const updated = prev.map((item) => (item.id === itemId ? { ...item, cleared: true } : item));
      const remainingSafeItems = updated.filter((item) => !item.isHazard && !item.cleared).length;
      
      if (remainingSafeItems === 0) {
        // Completed scenario 1
        setScore((prevScore) => prevScore + 50);
        setCompletedScenarios((prev) => [...prev, 1]);
        setMessage({ text: 'Excellent! Drain is clear. Hazardous items are left for professional removal.', type: 'success' });
        setTimeout(() => advanceScenario(), 2500);
      }
      return updated;
    });
  };

  // Scenario 2 Handlers
  const handleToggleLid = () => {
    setLidSecured(true);
    setScore((prev) => prev + 15);
  };

  const handleAttachBungee = () => {
    if (!lidSecured) {
      setMessage({ text: 'Close the lid before attaching securing straps!', type: 'error' });
      return;
    }
    setBungeesAttached((prev) => {
      const next = prev + 1;
      setScore((s) => s + 15);
      if (next >= 2) {
        // completed scenario 2
        setCompletedScenarios((prevScenarios) => [...prevScenarios, 2]);
        setMessage({ text: 'Successfully secured! Garbage is safe from animal scavengers.', type: 'success' });
        setTimeout(() => advanceScenario(), 2000);
      }
      return next;
    });
  };

  // Scenario 3 Handlers
  const handlePlaceCone = (index: number) => {
    setConesPlaced((prev) => {
      const next = [...prev];
      next[index] = true;
      setScore((s) => s + 10);
      return next;
    });
  };

  const handleTakePhoto = () => {
    if (conesPlaced.some(c => !c)) {
      setMessage({ text: 'Secure the zone with warning cones before documenting the issue!', type: 'error' });
      return;
    }
    setPhotoTaken(true);
    setScore((prev) => prev + 20);
    setCompletedScenarios((prev) => [...prev, 3]);
    setMessage({ text: 'Safety zone recorded! Submission logged safely.', type: 'success' });
    setTimeout(() => advanceScenario(), 2000);
  };

  return (
    <div id="maintenance_academy" className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 max-w-4xl mx-auto shadow-2xl border border-slate-800">
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-5 mb-6">
        <div>
          <span className="bg-amber-500/10 text-amber-400 text-xs px-3 py-1 rounded-full font-mono font-medium tracking-wider flex items-center gap-1.5 w-fit">
            <Zap size={12} /> MINOR MAINTENANCE ACADEMY
          </span>
          <h2 className="text-2xl font-bold mt-1 text-slate-100">Interactive Safety Training</h2>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0 font-mono">
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl text-center">
            <p className="text-[10px] text-slate-400">CURRENT SCORE</p>
            <p className="text-xl font-bold text-amber-400">{score}</p>
          </div>
          {isPlaying && (
            <div className="bg-slate-800/80 px-4 py-2 rounded-xl text-center min-w-24">
              <p className="text-[10px] text-slate-400">TIME REMAINING</p>
              <p className={`text-xl font-bold ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>{timeLeft}s</p>
            </div>
          )}
        </div>
      </div>

      {!isPlaying && !gameFinished ? (
        <div className="text-center py-12 px-4 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-5 text-amber-400">
            <Trophy size={32} />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-200">Test Your Safety Knowledge!</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Learn the critical rules of physical community maintenance. Learn when it is safe to act, what safety gear to require, and how to protect yourself and others.
          </p>
          <div className="bg-slate-800/50 p-4 rounded-xl text-left border border-slate-700/50 mb-8 space-y-2.5">
            <div className="flex gap-2 text-xs text-slate-300">
              <span className="text-amber-400">✓</span>
              <span>Earn <strong>up to 200 Points</strong> for your Citizen Profile.</span>
            </div>
            <div className="flex gap-2 text-xs text-slate-300">
              <span className="text-amber-400">✓</span>
              <span>Unlock the exclusive <strong>Safety Champion Badge</strong>!</span>
            </div>
            <div className="flex gap-2 text-xs text-slate-300">
              <span className="text-amber-400">✓</span>
              <span>Master 3 realistic interactive hazards.</span>
            </div>
          </div>
          <button
            id="start_training_btn"
            onClick={handleStartGame}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-8 py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Play size={18} fill="currentColor" /> Start Safety Training Game
          </button>
        </div>
      ) : gameFinished ? (
        <div className="text-center py-12 px-4 max-w-lg mx-auto">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
              className="absolute inset-0 border-2 border-dashed border-amber-400 rounded-full"
            />
            <div className="absolute inset-2 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400">
              <Award size={48} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-100 mb-2">Training Completed!</h3>
          <p className="text-slate-400 text-sm mb-6">
            You completed {completedScenarios.length} out of 3 challenges. Your knowledge of civic safety protocols helps protect the whole block.
          </p>
          
          <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 mb-8 font-mono">
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-400 text-xs">ACADEMY BASE SCORE</span>
              <span className="text-slate-200">{score} pts</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-400 text-xs">SPEED BONUS (TIME LEFT × 2)</span>
              <span className="text-emerald-400">+{timeLeft * 2} pts</span>
            </div>
            <div className="h-px bg-slate-700 my-2" />
            <div className="flex justify-between items-center text-lg font-bold">
              <span className="text-amber-400">TOTAL SCORE REWARD</span>
              <span className="text-amber-400">{score + (timeLeft * 2)} Points</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              id="restart_game_btn"
              onClick={handleStartGame}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-slate-700"
            >
              <RefreshCw size={16} /> Retake Training
            </button>
            <button
              id="finish_game_btn"
              onClick={() => setGameFinished(false)}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/10"
            >
              Claim Rewards & Points
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status feedback message */}
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl flex items-start gap-3 border ${
                message.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : message.type === 'error'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
              }`}
            >
              {message.type === 'error' ? (
                <ShieldAlert className="shrink-0 mt-0.5" size={18} />
              ) : (
                <CheckCircle className="shrink-0 mt-0.5" size={18} />
              )}
              <div className="text-sm">
                <span className="font-bold">{message.type === 'error' ? 'SAFETY RULE EXPIRED: ' : ''}</span>
                {message.text}
              </div>
            </motion.div>
          )}

          {/* Current Scenario Title & Instruction Card */}
          <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-800">
            <span className="text-amber-400 text-xs font-mono">SCENARIO {currentScenario} OF 3</span>
            <h4 className="text-lg font-bold text-slate-100 mt-1">
              {currentScenario === 1 && '🍂 Storm Drain Hazard Clearing'}
              {currentScenario === 2 && '🦮 Securing Urban Animal Access'}
              {currentScenario === 3 && '⚠️ Sidewalk Path Safety Cordon'}
            </h4>
            <p className="text-slate-400 text-xs mt-1">
              {currentScenario === 1 && 'Safety Guideline: Always use tools (gloves, tongs) and NEVER manually touch sharp needles, chemical bottles, or medical bags.'}
              {currentScenario === 2 && 'Safety Guideline: Secure garbage lids immediately with locks to prevent raccoons and stray packs from scattering bacteria.'}
              {currentScenario === 3 && 'Safety Guideline: Place cautionary indicators several paces back to give oncoming pedestrian traffic plenty of reaction distance.'}
            </p>
          </div>

          {/* Scenario Stages Grid */}
          <div className="h-80 bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden relative flex flex-col justify-between p-4">
            
            {/* Scenario 1 Content: Item picker */}
            {currentScenario === 1 && (
              <div className="h-full flex flex-col justify-center">
                <p className="text-center text-xs text-slate-500 mb-4 font-mono">TAP TO SAFELY REMOVE REFUSE FROM THE STORM SEWER GRATE</p>
                <div className="flex flex-wrap gap-3 justify-center items-center">
                  {drainItems.map((item) => (
                    <motion.button
                      key={item.id}
                      onClick={() => !item.cleared && handleItemTap(item.id, item.isHazard)}
                      disabled={item.cleared}
                      whileHover={{ scale: item.cleared ? 1 : 1.05 }}
                      whileTap={{ scale: item.cleared ? 1 : 0.95 }}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
                        item.cleared
                          ? 'opacity-20 bg-slate-900 border-transparent pointer-events-none'
                          : item.isHazard
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                          : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500'
                      }`}
                    >
                      {item.cleared ? '✓ Cleared' : item.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Scenario 2 Content: Garbage Can */}
            {currentScenario === 2 && (
              <div className="h-full flex flex-col justify-between">
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full transition-all duration-300"
                    style={{ width: `${100 - dogDistance}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 px-1 font-mono">
                  <span>🏡 SAFE ZONE</span>
                  <span className="text-rose-400">🐕 STRAY DOG ARRIVING IN: {Math.max(0, Math.ceil(dogDistance / 8))}s</span>
                </div>

                <div className="flex flex-col items-center justify-center flex-grow py-4 gap-4">
                  <div className="flex items-center gap-8">
                    {/* Visual garbage container representation */}
                    <div className="relative p-6 bg-slate-800 rounded-t-lg rounded-b-2xl border-2 border-slate-600 w-24 text-center">
                      <div className={`absolute top-0 left-0 right-0 h-4 bg-slate-700 border-b border-slate-600 transition-transform origin-top ${lidSecured ? 'translate-y-0 rotate-0' : '-translate-y-6 -rotate-12'}`} />
                      <Trash2 size={24} className="mx-auto text-slate-400 mt-2" />
                      <div className="mt-3 flex gap-1 justify-center">
                        {[...Array(bungeesAttached)].map((_, i) => (
                          <span key={i} className="w-2 h-4 bg-emerald-500 rounded" title="Attached strapping" />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={handleToggleLid}
                        disabled={lidSecured}
                        className={`w-full px-4 py-2.5 rounded-xl font-medium text-xs transition-colors ${
                          lidSecured ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400'
                        }`}
                      >
                        {lidSecured ? '🔒 Lid Closed & Latched' : '🔽 Close Lid & Lock Latch'}
                      </button>

                      <button
                        onClick={handleAttachBungee}
                        className={`w-full px-4 py-2.5 rounded-xl font-medium text-xs transition-colors bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500`}
                      >
                        🔩 Attach Bungee Cord ({bungeesAttached}/2)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scenario 3 Content: Cone Placer */}
            {currentScenario === 3 && (
              <div className="h-full flex flex-col justify-between">
                <div className="flex-grow flex items-center justify-center gap-6">
                  {/* Damaged hazard tree */}
                  <div className="text-center p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <p className="text-4xl">🪵</p>
                    <p className="text-xs text-rose-400 mt-2 font-bold font-mono">BRANCH BLOCKING PATH</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-slate-400 font-mono">PLACE SAFETY DISTANCE WARNING CONES</p>
                    <div className="flex gap-2">
                      {conesPlaced.map((placed, i) => (
                        <button
                          key={i}
                          onClick={() => !placed && handlePlaceCone(i)}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all border ${
                            placed
                              ? 'bg-amber-500/10 border-amber-500/40 text-2xl'
                              : 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-400'
                          }`}
                        >
                          {placed ? '⚠️' : '+'}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleTakePhoto}
                      className={`mt-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        photoTaken
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      }`}
                    >
                      📷 Document & Submit Issue
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tips footer bar inside game container */}
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs flex items-center gap-2 text-slate-400">
              <HelpCircle size={14} className="text-amber-400 shrink-0" />
              <span>
                {currentScenario === 1 && 'Safety Tip: Never reach into blind spots with your hands. Always use tool assets or call Sanitation.'}
                {currentScenario === 2 && 'Safety Tip: Stray dogs may carry rabies or infections. Never engage or try to feed wildlife scavengers.'}
                {currentScenario === 3 && 'Safety Tip: Always photograph hazards from a safe distance of at least 10 feet. Safety first!'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
