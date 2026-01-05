
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameLog, TeamState } from './types';
import { INITIAL_STATE, DEFAULT_SHOT_CLOCK, SHORT_SHOT_CLOCK, DEFAULT_PERIOD_LENGTH } from './constants';
import Digit from './components/Digit';
import { analyzeGame } from './services/geminiService';
import { 
  Trophy, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw, 
  ArrowLeft, 
  ArrowRight, 
  Volume2, 
  Sparkles, 
  History,
  Info
} from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Audio context for buzzer (optional simulation)
  const buzzerRef = useRef<HTMLAudioElement | null>(null);

  // Timer Tick Logic
  useEffect(() => {
    // Use any for the interval variable to avoid "Cannot find namespace 'NodeJS'" error in browsers
    let interval: any;
    if (gameState.isRunning) {
      interval = setInterval(() => {
        setGameState(prev => {
          if (prev.gameClock <= 0) {
            return { ...prev, isRunning: false, gameClock: 0 };
          }

          const nextGameClock = prev.gameClock - 0.1;
          const nextShotClock = prev.shotClock - 0.1;

          // Auto pause if shot clock hits zero or game clock hits zero
          const shouldPause = nextShotClock <= 0 || nextGameClock <= 0;

          return {
            ...prev,
            gameClock: nextGameClock <= 0 ? 0 : nextGameClock,
            shotClock: nextShotClock <= 0 ? 0 : nextShotClock,
            isRunning: !shouldPause && prev.isRunning
          };
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameState.isRunning]);

  const addLog = useCallback((event: string) => {
    setLogs(prev => [
      ...prev,
      {
        timestamp: Date.now(),
        event,
        homeScore: gameState.home.score,
        awayScore: gameState.away.score
      }
    ]);
  }, [gameState.home.score, gameState.away.score]);

  // Actions
  const updateScore = (team: 'home' | 'away', delta: number) => {
    setGameState(prev => {
      const teamState = prev[team];
      const newScore = Math.max(0, teamState.score + delta);
      return {
        ...prev,
        [team]: { ...teamState, score: newScore }
      };
    });
    addLog(`${team === 'home' ? gameState.home.name : gameState.away.name} ${delta > 0 ? '+' : ''}${delta} points`);
  };

  const updateFouls = (team: 'home' | 'away', delta: number) => {
    setGameState(prev => {
      const teamState = prev[team];
      const newFouls = Math.max(0, teamState.fouls + delta);
      return {
        ...prev,
        [team]: { 
          ...teamState, 
          fouls: newFouls,
          bonus: newFouls >= 5,
          doubleBonus: newFouls >= 7
        }
      };
    });
  };

  const toggleTimer = () => {
    setGameState(prev => ({ ...prev, isRunning: !prev.isRunning }));
    addLog(gameState.isRunning ? "Clock Paused" : "Clock Started");
  };

  const resetShotClock = (seconds: number = DEFAULT_SHOT_CLOCK) => {
    setGameState(prev => ({ ...prev, shotClock: seconds }));
  };

  const setPossession = (team: 'home' | 'away' | null) => {
    setGameState(prev => ({ ...prev, possession: team }));
  };

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeGame(gameState, logs);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    
    if (mins === 0 && seconds < 60) {
      return `${secs}.${ms}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-2 md:p-6 overflow-x-hidden">
      {/* HEADER / NAV */}
      <header className="w-full max-w-7xl flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500 p-1.5 rounded-lg">
            <Trophy className="text-slate-950 w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white">HOOPSBOARD<span className="text-amber-500">PRO</span></h1>
        </div>
        <div className="flex gap-4">
           <button 
            onClick={handleAIAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full font-bold text-sm hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'AI Insights'}
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* MAIN SCOREBOARD DISPLAY */}
      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Team (HOME) */}
        <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col items-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          <h2 className="text-3xl font-black text-slate-400 mb-4">{gameState.home.name}</h2>
          <Digit value={gameState.home.score} size="xl" color="text-blue-500" />
          
          <div className="mt-8 grid grid-cols-2 gap-4 w-full text-center">
            <div className="bg-slate-800/50 p-3 rounded-xl">
              <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Fouls</span>
              <Digit value={gameState.home.fouls} size="md" color="text-red-500" />
            </div>
            <div className="bg-slate-800/50 p-3 rounded-xl">
              <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Timeouts</span>
              <Digit value={gameState.home.timeouts} size="md" color="text-white" />
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            {gameState.home.bonus && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] font-black rounded border border-amber-500/30">BONUS</span>}
            {gameState.home.doubleBonus && <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[10px] font-black rounded border border-red-500/30">DBL BONUS</span>}
            {gameState.possession === 'home' && <ArrowLeft className="text-blue-400 w-5 h-5 animate-pulse" />}
          </div>
        </div>

        {/* Center Clock Area */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center shadow-inner relative">
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
              <div className="bg-slate-800 px-3 py-1 rounded-lg flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Period</span>
                <span className="text-xl font-digital text-amber-500">{gameState.period}</span>
              </div>
              <div className="bg-slate-800 px-3 py-1 rounded-lg flex items-center gap-2">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Possession</span>
                 <div className="flex gap-1">
                    <div className={`w-3 h-3 rounded-full ${gameState.possession === 'home' ? 'bg-blue-500' : 'bg-slate-700'}`} />
                    <div className={`w-3 h-3 rounded-full ${gameState.possession === 'away' ? 'bg-red-500' : 'bg-slate-700'}`} />
                 </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-center">
               <Digit value={formatTime(gameState.gameClock)} size="xl" className="tracking-tighter" />
               <div className="mt-4 flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Shot Clock</span>
                  <Digit value={Math.floor(gameState.shotClock)} size="lg" color={gameState.shotClock < 5 ? 'text-red-600' : 'text-amber-400'} />
               </div>
            </div>
          </div>

          {/* QUICK CONTROLS AREA */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             <button 
              onClick={toggleTimer} 
              className={`col-span-2 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-lg transition shadow-lg ${gameState.isRunning ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}
             >
               {gameState.isRunning ? <Pause /> : <Play />}
               {gameState.isRunning ? 'PAUSE CLOCK' : 'START CLOCK'}
             </button>
             <button onClick={() => resetShotClock(DEFAULT_SHOT_CLOCK)} className="bg-slate-800 py-4 rounded-2xl hover:bg-slate-700 transition flex flex-col items-center justify-center">
                <RotateCcw className="w-5 h-5 mb-1 text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Reset 24</span>
             </button>
             <button onClick={() => resetShotClock(SHORT_SHOT_CLOCK)} className="bg-slate-800 py-4 rounded-2xl hover:bg-slate-700 transition flex flex-col items-center justify-center">
                <RotateCcw className="w-5 h-5 mb-1 text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Reset 14</span>
             </button>
          </div>
        </div>

        {/* Right Team (AWAY) */}
        <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col items-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          <h2 className="text-3xl font-black text-slate-400 mb-4">{gameState.away.name}</h2>
          <Digit value={gameState.away.score} size="xl" color="text-red-500" />
          
          <div className="mt-8 grid grid-cols-2 gap-4 w-full text-center">
            <div className="bg-slate-800/50 p-3 rounded-xl">
              <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Fouls</span>
              <Digit value={gameState.away.fouls} size="md" color="text-red-500" />
            </div>
            <div className="bg-slate-800/50 p-3 rounded-xl">
              <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Timeouts</span>
              <Digit value={gameState.away.timeouts} size="md" color="text-white" />
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            {gameState.away.bonus && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] font-black rounded border border-amber-500/30">BONUS</span>}
            {gameState.away.doubleBonus && <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[10px] font-black rounded border border-red-500/30">DBL BONUS</span>}
            {gameState.possession === 'away' && <ArrowRight className="text-red-400 w-5 h-5 animate-pulse" />}
          </div>
        </div>

      </main>

      {/* AI INSIGHTS BAR */}
      {analysis && (
        <div className="w-full max-w-7xl mt-6 animate-in slide-in-from-bottom duration-500">
           <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900 border border-purple-500/30 rounded-2xl p-4 flex items-start gap-4 shadow-2xl">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Sparkles className="text-purple-400 w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest block mb-1">Gemini AI Analysis</span>
                <p className="text-slate-200 text-sm leading-relaxed italic">"{analysis}"</p>
              </div>
           </div>
        </div>
      )}

      {/* OPERATOR PANEL */}
      <section className="w-full max-w-7xl mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Scoring Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
           <div className="flex items-center gap-2 mb-6">
              <Info className="text-slate-500 w-4 h-4" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Score & Stat Operator</h3>
           </div>
           
           <div className="grid grid-cols-2 gap-8">
              {/* Home Controls */}
              <div className="space-y-4">
                 <span className="text-xs font-bold text-blue-500 uppercase">{gameState.home.name}</span>
                 <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => updateScore('home', 1)} className="p-2 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 transition">+1</button>
                    <button onClick={() => updateScore('home', 2)} className="p-2 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 transition">+2</button>
                    <button onClick={() => updateScore('home', 3)} className="p-2 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 transition">+3</button>
                    <button onClick={() => updateScore('home', -1)} className="p-2 bg-slate-800 rounded-lg font-bold hover:bg-slate-700 transition">-1</button>
                    <button onClick={() => updateFouls('home', 1)} className="p-2 bg-red-600 rounded-lg font-bold hover:bg-red-500 transition">FOUL</button>
                    <button onClick={() => setPossession('home')} className="p-2 bg-blue-900 rounded-lg font-bold hover:bg-blue-800 transition"><ArrowLeft className="mx-auto" /></button>
                 </div>
              </div>

              {/* Away Controls */}
              <div className="space-y-4">
                 <span className="text-xs font-bold text-red-500 uppercase text-right block">{gameState.away.name}</span>
                 <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => updateScore('away', 1)} className="p-2 bg-red-600 rounded-lg font-bold hover:bg-red-500 transition">+1</button>
                    <button onClick={() => updateScore('away', 2)} className="p-2 bg-red-600 rounded-lg font-bold hover:bg-red-500 transition">+2</button>
                    <button onClick={() => updateScore('away', 3)} className="p-2 bg-red-600 rounded-lg font-bold hover:bg-red-500 transition">+3</button>
                    <button onClick={() => updateScore('away', -1)} className="p-2 bg-slate-800 rounded-lg font-bold hover:bg-slate-700 transition">-1</button>
                    <button onClick={() => updateFouls('away', 1)} className="p-2 bg-red-600 rounded-lg font-bold hover:bg-red-500 transition">FOUL</button>
                    <button onClick={() => setPossession('away')} className="p-2 bg-red-900 rounded-lg font-bold hover:bg-red-800 transition"><ArrowRight className="mx-auto" /></button>
                 </div>
              </div>
           </div>
        </div>

        {/* Game Log */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-80 overflow-hidden flex flex-col">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="text-slate-500 w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Live Game Feed</h3>
              </div>
              <button onClick={() => setLogs([])} className="text-[10px] font-bold text-slate-500 hover:text-slate-300">CLEAR LOG</button>
           </div>
           <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-2">
                  <RotateCcw className="w-8 h-8 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No activity yet</p>
                </div>
              ) : (
                logs.slice().reverse().map((log, idx) => (
                  <div key={idx} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex justify-between items-center text-xs animate-in slide-in-from-right duration-300">
                    <div className="flex flex-col">
                      <span className="text-slate-500 font-medium mb-1">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span className="font-bold text-slate-200">{log.event}</span>
                    </div>
                    <div className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 font-digital text-amber-500">
                      {log.homeScore} - {log.awayScore}
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </section>

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-black mb-6">Game Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase text-slate-500 mb-2 block">Team Names</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      value={gameState.home.name} 
                      onChange={(e) => setGameState(p => ({ ...p, home: { ...p.home, name: e.target.value.toUpperCase() }}))}
                      className="bg-slate-800 border border-slate-700 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input 
                      type="text" 
                      value={gameState.away.name} 
                      onChange={(e) => setGameState(p => ({ ...p, away: { ...p.away, name: e.target.value.toUpperCase() }}))}
                      className="bg-slate-800 border border-slate-700 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-slate-500 mb-2 block">Period Management</label>
                  <div className="flex gap-2">
                    <button onClick={() => setGameState(p => ({ ...p, period: Math.max(1, p.period - 1)}))} className="flex-1 bg-slate-800 p-3 rounded-xl font-bold">-</button>
                    <div className="flex-[2] bg-slate-950 flex items-center justify-center font-bold text-xl rounded-xl border border-slate-800">P{gameState.period}</div>
                    <button onClick={() => setGameState(p => ({ ...p, period: p.period + 1}))} className="flex-1 bg-slate-800 p-3 rounded-xl font-bold">+</button>
                  </div>
                </div>

                <div>
                   <label className="text-xs font-black uppercase text-slate-500 mb-2 block">Clock Adjustment</label>
                   <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setGameState(p => ({ ...p, gameClock: p.gameClock + 60}))} className="bg-slate-800 p-3 rounded-xl font-bold">+1m</button>
                      <button onClick={() => setGameState(p => ({ ...p, gameClock: Math.max(0, p.gameClock - 60)}))} className="bg-slate-800 p-3 rounded-xl font-bold">-1m</button>
                   </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => {
                    setGameState(INITIAL_STATE);
                    setLogs([]);
                    setIsSettingsOpen(false);
                  }}
                  className="flex-1 py-4 text-slate-500 font-bold hover:text-slate-300 transition"
                >
                  RESET FULL GAME
                </button>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 py-4 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition"
                >
                  DONE
                </button>
              </div>
           </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mt-12 mb-6 flex flex-col items-center gap-4 text-slate-600">
        <div className="flex gap-6 text-xs font-bold uppercase tracking-widest">
           <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" /> Buzzers Active</span>
           <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Gemini 3 Analysis Enabled</span>
        </div>
        <p className="text-[10px]">© 2024 HoopsBoard Professional. Designed for professional game management.</p>
      </footer>
    </div>
  );
};

export default App;
