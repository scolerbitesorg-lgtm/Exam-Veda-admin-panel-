import React from 'react';
import { Terminal, Bot, Sparkles, Leaf, Zap, MessageSquareQuote } from 'lucide-react';

interface AIAssistantFloatingDockProps {
  onOpenCommandAgent: () => void;
  onOpenPersonalAdvisor: () => void;
}

export const AIAssistantFloatingDock: React.FC<AIAssistantFloatingDockProps> = ({
  onOpenCommandAgent,
  onOpenPersonalAdvisor,
}) => {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 bg-slate-950/90 backdrop-blur-md p-1.5 rounded-full border border-slate-700/80 shadow-2xl shadow-black/50">
      {/* 1. Permanent Command Agent Button */}
      <button
        onClick={onOpenCommandAgent}
        className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-600/90 to-amber-500 text-slate-950 hover:from-amber-500 hover:to-amber-400 font-extrabold text-xs transition-all duration-200 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
        title="AI Command & Action Agent (Permanent Executor)"
      >
        <div className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center">
          <Terminal className="w-3 h-3" />
        </div>
        <span className="hidden sm:inline">Command Agent</span>
        <span className="text-[9px] bg-slate-950 text-amber-300 px-1.5 py-0.2 rounded-full uppercase tracking-wider font-mono">
          EXEC
        </span>
      </button>

      {/* 2. Nature-Friendly Personal Mentor Button */}
      <button
        onClick={onOpenPersonalAdvisor}
        className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-emerald-600/90 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-400 font-extrabold text-xs transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
        title="Personal Nature-Friendly Admin Mentor & Strategy Advisor (Custom Keys)"
      >
        <div className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-300 flex items-center justify-center">
          <Leaf className="w-3 h-3 text-emerald-400" />
        </div>
        <span className="hidden sm:inline">Personal Mentor</span>
        <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded-full uppercase tracking-wider font-mono">
          AI
        </span>
      </button>
    </div>
  );
};
