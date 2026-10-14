import React from 'react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Combat Manual</span>
              <span aria-hidden="true">·</span>
              <span className="text-sky-400 font-medium">Physics Survival Tactics</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 font-display mt-0.5">
              Gorilla with a Fork: Field Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 text-slate-300">
          {/* Controls grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
              <div className="text-xs font-bold text-sky-400 uppercase tracking-wide mb-2">
                Desktop Controls
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex justify-between">
                  <span className="text-slate-400">WASD / Arrow Keys:</span>
                  <span className="font-mono text-slate-200">Move Kongrad</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Mouse Aim:</span>
                  <span className="font-mono text-slate-200">Direct Fork Angle</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Left Click:</span>
                  <span className="font-mono text-slate-200">Swing / Jab Tines</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Hold Left Click:</span>
                  <span className="font-mono text-slate-200">Charge 360° Whirlwind</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Space / Right Click:</span>
                  <span className="font-mono text-slate-200">Knuckle Dash (i-frames)</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2">
                Mobile & Touch Controls
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex justify-between">
                  <span className="text-slate-400">Left Thumbstick:</span>
                  <span className="font-mono text-slate-200">Omni Directional Run</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">SWING Button:</span>
                  <span className="font-mono text-slate-200">Tap to Jab / Hold Whirl</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">DASH Button:</span>
                  <span className="font-mono text-slate-200">Instant Knuckle Burst</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Core Physics Tactics */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-100 font-display">
              Core Physics Tactics & Mechanics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-800/80 flex flex-col gap-2">
                <div className="text-xl">🏓</div>
                <div className="font-bold text-xs text-slate-200">Projectile Deflection</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Time your utensil swing as a flying rattle grenade or pacifier approaches. Swatting it reflects it back with supersonic speed and bonus damage!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-800/80 flex flex-col gap-2">
                <div className="text-xl">🎱</div>
                <div className="font-bold text-xs text-slate-200">Billiard Wall Impacts</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Coughing babies suffer massive bonus damage when slammed into arena walls, ABC toy blocks, or other babies. Use the Pitchfork or Spork for maximum flight arcs.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-800/80 flex flex-col gap-2">
                <div className="text-xl">💨</div>
                <div className="font-bold text-xs text-slate-200">Aerosol Cloud Clearance</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Green aerosol clouds linger and inflict tick damage. Swatting with your fork generates wind displacement that disperses them, or use the Tuning Fork to instantly vaporize them.
                </p>
              </div>
            </div>

            {/* Interactive Physics Obstacles Guide */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="text-xs font-bold text-sky-400 uppercase tracking-wide">
                Nursery Physics Obstacles
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                  <span className="font-bold text-slate-200 block mb-0.5">🎳 Bowling Pins</span>
                  <span className="text-slate-400 text-[11px] leading-tight block">Swat pins to bowl down ranks of babies for huge STRIKE! combos.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                  <span className="font-bold text-slate-200 block mb-0.5">🏐 Giant Beach Balls</span>
                  <span className="text-slate-400 text-[11px] leading-tight block">Hyper-elastic bouncing balls that rocket around the room knocking babies.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                  <span className="font-bold text-slate-200 block mb-0.5">🎪 Jack-in-the-Box</span>
                  <span className="text-slate-400 text-[11px] leading-tight block">Touch or swat to prime an explosive spring that flings nearby bodies away.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                  <span className="font-bold text-slate-200 block mb-0.5">🏋 15 LB Dumbbell</span>
                  <span className="text-slate-400 text-[11px] leading-tight block">Heavy cast-iron weight; dash or swing to crush lines of toddlers.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                  <span className="font-bold text-slate-200 block mb-0.5">🚂 Alphabet Train Car</span>
                  <span className="text-slate-400 text-[11px] leading-tight block">Wheeled toy wagon that detonates into shrapnel on heavy wall impacts.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                  <span className="font-bold text-slate-200 block mb-0.5">🥛 Slippery Milk Puddle</span>
                  <span className="text-slate-400 text-[11px] leading-tight block">Frictionless floor slick causing Kongrad and babies to drift & slide.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
