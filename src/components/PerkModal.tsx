import React from 'react';
import { Perk } from '../types/game';

interface PerkModalProps {
  perks: Perk[];
  onSelectPerk: (perk: Perk) => void;
  onSkip?: () => void;
}

export const PerkModal: React.FC<PerkModalProps> = ({ perks, onSelectPerk, onSkip }) => {
  const getTierColor = (tier: Perk['tier']) => {
    switch (tier) {
      case 'COMMON': return 'text-sky-400 border-sky-500/40 bg-sky-950/20';
      case 'RARE': return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
      case 'LEGENDARY': return 'text-purple-400 border-purple-500/40 bg-purple-950/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col gap-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>Room Cleared Reward</span>
            <span aria-hidden="true">·</span>
            <span className="text-sky-400 font-medium">Rogue-like Boon</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 font-display mt-1">
            Choose a Primate Augment
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Select a kinetic perk to hone your fork-wielding physics and aerosol defense.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {perks.map((perk) => (
            <button
              key={perk.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectPerk(perk);
              }}
              className="p-5 rounded-xl border border-slate-800 hover:border-sky-500/60 bg-slate-950/60 hover:bg-slate-950/90 transition-colors text-left flex flex-col justify-between gap-4 cursor-pointer group shadow-lg"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border ${getTierColor(perk.tier)}`}>
                    {perk.tier}
                  </span>
                </div>

                <div className="font-bold text-sm text-slate-200 group-hover:text-sky-300 transition-colors">
                  {perk.name}
                </div>

                <div className="text-xs text-slate-400 leading-relaxed">
                  {perk.description}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-sky-400 group-hover:text-sky-300">
                <span>Select Boon</span>
                <span>→</span>
              </div>
            </button>
          ))}
        </div>

        {/* Skip button option */}
        <div className="flex justify-center pt-1 border-t border-slate-800/60">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onSkip) {
                onSkip();
              } else if (perks.length > 0) {
                onSelectPerk(perks[0]);
              }
            }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer py-1 px-3"
          >
            Skip Augment & Open Floor Map →
          </button>
        </div>
      </div>
    </div>
  );
};
