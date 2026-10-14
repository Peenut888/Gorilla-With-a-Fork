import React from 'react';
import { Utensil, UtensilId } from '../types/game';
import { UTENSILS_CATALOG, ALL_UTENSIL_IDS } from '../game/utensils';

interface UtensilArmoryModalProps {
  currentUtensilId: UtensilId;
  unlockedUtensilIds: UtensilId[];
  rattlesCurrency: number;
  onSelectUtensil: (id: UtensilId) => void;
  onUnlockUtensil: (id: UtensilId, cost: number) => void;
  onClose: () => void;
}

export const UtensilArmoryModal: React.FC<UtensilArmoryModalProps> = ({
  currentUtensilId,
  unlockedUtensilIds,
  rattlesCurrency,
  onSelectUtensil,
  onUnlockUtensil,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Culinary Armory</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-400 font-medium">★ {rattlesCurrency} Rattle Trophies Available</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 font-display mt-0.5">
              Unlockable Battle Utensils
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors cursor-pointer"
          >
            Close Armory
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6">
          {/* Banner Showcase */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center gap-6 p-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden shrink-0 border border-slate-700">
              <img
                src="/src/assets/images/utensils_collection_1792002510137.jpg"
                alt="Mystical Battle Utensils"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col gap-1 text-center sm:text-left">
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wide">
                Silverback Dining Metallurgy
              </span>
              <h3 className="text-base font-bold text-slate-100">
                Custom Cutlery with Physics-Altering Kinetics
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                Each utensil brings unique tine configurations, reach arcs, aerodynamic knockback values, and projectile deflection powers. Collect Rattles in the nursery arena to unlock the full armory.
              </p>
            </div>
          </div>

          {/* Utensils Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ALL_UTENSIL_IDS.map((id) => {
              const u = UTENSILS_CATALOG[id];
              const isUnlocked = unlockedUtensilIds.includes(id);
              const isEquipped = currentUtensilId === id;
              const canAfford = rattlesCurrency >= u.unlockCost;

              return (
                <div
                  key={id}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                    isEquipped
                      ? 'border-sky-400 bg-sky-950/30 ring-1 ring-sky-400/40'
                      : isUnlocked
                      ? 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                      : 'border-slate-800/60 bg-slate-950/30 opacity-75'
                  }`}
                >
                  <div className="flex flex-col gap-2.5">
                    {/* Header badge */}
                    <div className="flex items-center justify-between">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border"
                        style={{
                          backgroundColor: `${u.color}20`,
                          color: u.color,
                          borderColor: `${u.color}40`,
                        }}
                      >
                        Ψ
                      </div>
                      <span className="text-[11px] font-mono font-medium text-slate-400">
                        {u.tines > 0 ? `${u.tines} Tines` : 'Paddle'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-100">{u.name}</h4>
                      <div className="text-[11px] text-slate-400 italic">{u.tagline}</div>
                    </div>

                    {/* Stats strip */}
                    <div className="grid grid-cols-2 gap-1.5 py-1 text-[11px] border-y border-slate-800/80">
                      <div className="flex justify-between text-slate-400">
                        <span>Damage:</span>
                        <span className="font-mono text-slate-200">{u.damage}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Knockback:</span>
                        <span className="font-mono text-slate-200">{u.knockback}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Reach:</span>
                        <span className="font-mono text-slate-200">{u.reach}px</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Cadence:</span>
                        <span className="font-mono text-slate-200">{u.cooldown}ms</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      {u.special}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {isEquipped ? (
                      <div className="w-full py-2 text-center text-xs font-bold text-sky-400 bg-sky-950/60 rounded-lg border border-sky-500/30">
                        EQUIPPED
                      </div>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => onSelectUtensil(id)}
                        className="w-full py-2 text-xs font-semibold text-slate-900 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors cursor-pointer"
                      >
                        Equip Utensil
                      </button>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => onUnlockUtensil(id, u.unlockCost)}
                        className={`w-full py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                          canAfford
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span>Unlock ({u.unlockCost} Rattles)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
