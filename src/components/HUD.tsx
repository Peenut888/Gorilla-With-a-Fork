import React from 'react';
import { PlayerState, Utensil } from '../types/game';
import { UTENSILS_CATALOG } from '../game/utensils';

interface HUDProps {
  player: PlayerState;
  utensil: Utensil;
  floorNumber: number;
  floorName: string;
  roomTitle: string;
  roomCleared: boolean;
  onOpenMap: () => void;
  onOpenArmory: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  utensil,
  floorNumber,
  floorName,
  roomTitle,
  roomCleared,
  onOpenMap,
  onOpenArmory,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const dashReady = player.dashCooldown <= 0 && !player.isDashing;
  const dashPercent = dashReady ? 100 : Math.max(0, (1 - player.dashCooldown / 1.2) * 100);
  const chargePercent = Math.min(100, (player.chargeTime / 0.6) * 100);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-20">
      {/* Top HUD Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Kongrad Vitality & Status */}
        <div className="flex flex-col gap-2 bg-slate-950/75 backdrop-blur-md p-3.5 rounded-xl border border-slate-800/80 shadow-lg pointer-events-auto min-w-[280px] md:min-w-[340px]">
          <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-slate-900">
                <img
                  src="/src/assets/images/player_gorilla_sprite_1792004033798.jpg"
                  alt="Kongrad"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-semibold text-slate-200">Kongrad the Tined</span>
            </div>
            <span className="tabular-nums font-mono font-medium text-slate-300">
              {Math.max(0, Math.round(player.hp))} / {player.maxHp} HP
            </span>
          </div>

          {/* Health Bar */}
          <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 25 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>

          {/* Secondary Meters: Dash & Whirlwind Charge */}
          <div className="grid grid-cols-2 gap-3 pt-1 text-[11px] text-slate-400">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Knuckle Dash</span>
                <span className="font-mono text-slate-300">{dashReady ? 'READY' : 'CD'}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    dashReady ? 'bg-sky-400' : 'bg-slate-600'
                  }`}
                  style={{ width: `${dashPercent}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Whirlwind Charge</span>
                <span className="font-mono text-slate-300">
                  {chargePercent >= 100 ? 'MAX' : `${Math.round(chargePercent)}%`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    chargePercent >= 100 ? 'bg-amber-400 animate-pulse' : 'bg-amber-600'
                  }`}
                  style={{ width: `${chargePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Floor & Progress Info */}
        <div className="flex flex-col items-end gap-1.5 bg-slate-950/75 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-800/80 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Floor {floorNumber}</span>
            <span aria-hidden="true">·</span>
            <span>{floorName}</span>
          </div>
          <div className="text-sm font-bold text-sky-400">{roomTitle}</div>
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-0.5">
            <span className="text-amber-400 font-mono font-medium">★ {player.rattlesCurrency} Rattles</span>
            <span aria-hidden="true">·</span>
            <span>{player.kills} Defeated</span>
          </div>
        </div>
      </div>

      {/* Room Cleared Banner Prompt */}
      {roomCleared && (
        <div className="self-center flex flex-col items-center gap-2 bg-slate-950/90 backdrop-blur-md px-6 py-4 rounded-xl border border-sky-500/40 shadow-xl pointer-events-auto animate-bounce">
          <div className="text-sm font-bold text-sky-300 tracking-wide">
            ROOM CLEARED! AREA SECURE
          </div>
          <div className="text-xs text-slate-300 text-center max-w-sm">
            All coughing babies dispatched. Open the floor map to venture onward!
          </div>
          <button
            onClick={onOpenMap}
            className="mt-1 px-4 py-2 text-xs font-bold text-slate-900 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors cursor-pointer shadow-md"
          >
            Advance to Next Room →
          </button>
        </div>
      )}

      {/* Bottom HUD Row */}
      <div className="flex items-end justify-between gap-4">
        {/* Equipped Utensil Card */}
        <button
          onClick={onOpenArmory}
          className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors pointer-events-auto text-left cursor-pointer group"
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg border border-slate-700"
            style={{ backgroundColor: `${utensil.color}15`, color: utensil.color }}
          >
            Ψ
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">{utensil.name}</span>
              <span aria-hidden="true">·</span>
              <span>{utensil.damage} DMG</span>
            </div>
            <div className="text-[11px] text-slate-400 max-w-xs truncate">
              {utensil.special}
            </div>
          </div>
        </button>

        {/* Quick Map & Controls Helper */}
        <div className="hidden sm:flex items-center gap-3 pointer-events-auto">
          <button
            onClick={onOpenMap}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 rounded-lg border border-slate-700/80 transition-colors cursor-pointer"
          >
            Floor Map [M]
          </button>
          <div className="text-xs text-slate-500 bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800/60">
            [WASD] Move · [L-Click] Swing · [Hold L-Click] Whirlwind · [Space/R-Click] Dash
          </div>
        </div>
      </div>
    </div>
  );
};
