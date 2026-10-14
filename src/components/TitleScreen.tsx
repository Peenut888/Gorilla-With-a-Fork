import React from 'react';
import { Utensil } from '../types/game';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenArmory: () => void;
  onOpenHowToPlay: () => void;
  rattlesCurrency: number;
  equippedUtensil: Utensil;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenArmory,
  onOpenHowToPlay,
  rattlesCurrency,
  equippedUtensil,
}) => {
  return (
    <div className="relative w-full flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
      <div className="w-full max-w-4xl flex flex-col items-center gap-8">
        {/* Hero Artwork Container */}
        <div className="relative w-full aspect-video max-h-[380px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 group">
          <img
            src="/src/assets/images/gorilla_fork_hero_1792002508781.jpg"
            alt="Gorilla with a Fork vs Coughing Babies"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6 md:p-8">
            <div className="flex items-center gap-2 text-xs text-sky-400 font-semibold uppercase tracking-wider mb-1">
              <span>Kinetic Rogue-like Arena</span>
              <span aria-hidden="true">·</span>
              <span>Procedural Nurseries</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-100 font-display tracking-tight leading-none text-balance">
              GORILLA WITH A FORK
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-xl mt-2 leading-relaxed">
              Wield oversized dining silverware against the chaotic bio-cough aerosol menace of the coughing babies in high-velocity, elastic physics combat.
            </p>
          </div>
        </div>

        {/* Action Controls & Equipped Cutlery */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Play Action */}
          <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-6 shadow-xl">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200">Current Loadout</span>
                <span className="text-amber-400 font-mono font-medium">★ {rattlesCurrency} Rattles Banked</span>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-slate-900 shadow-md">
                  <img
                    src="/src/assets/images/player_gorilla_sprite_1792004033798.jpg"
                    alt="Silverback Gorilla Player Model"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl border shrink-0"
                  style={{
                    backgroundColor: `${equippedUtensil.color}15`,
                    color: equippedUtensil.color,
                    borderColor: `${equippedUtensil.color}30`,
                  }}
                >
                  Ψ
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">{equippedUtensil.name}</span>
                    <span className="text-[11px] text-slate-400">· {equippedUtensil.damage} DMG</span>
                  </div>
                  <span className="text-xs text-slate-400">{equippedUtensil.special}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={onStartGame}
                className="w-full sm:flex-1 py-3 px-6 text-sm font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-xl transition-all shadow-lg hover:shadow-sky-500/20 cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span>Enter Nursery Arena</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button
                onClick={onOpenArmory}
                className="w-full sm:w-auto py-3 px-5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Inspect Armory
              </button>
            </div>
          </div>

          {/* Survival Guide Card */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-4 shadow-xl">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wide">
                Silverback Tactics
              </span>
              <h3 className="font-bold text-base text-slate-100">
                Master the Physics
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Swat aerosol clouds to disperse them, swat flying rattles to reflect them, and slam toddlers into bouncy rubber ducks for chain kinetic smashes.
              </p>
            </div>

            <button
              onClick={onOpenHowToPlay}
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-300 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors cursor-pointer text-center"
            >
              Read Combat Manual
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
