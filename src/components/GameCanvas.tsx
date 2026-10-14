import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  PlayerState, 
  EnemyEntity, 
  Utensil, 
  Vector2D, 
  DungeonNode 
} from '../types/game';
import { PhysicsEngine, RoomEnvironment } from '../game/physics';
import { GameRenderer } from '../game/renderer';
import { soundEngine } from '../game/audio';

interface GameCanvasProps {
  player: PlayerState;
  env: RoomEnvironment;
  utensil: Utensil;
  floorTheme: string;
  isPaused?: boolean;
  onEnemyKilled: (enemy: EnemyEntity, scoreReward: number) => void;
  onPlayerHit: (damage: number) => void;
  onRoomCleared: () => void;
  onPlayerDeath: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  player,
  env,
  utensil,
  floorTheme,
  isPaused = false,
  onEnemyKilled,
  onPlayerHit,
  onRoomCleared,
  onPlayerDeath,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const roomClearedReported = useRef<boolean>(false);

  // Input states
  const keysDown = useRef<Record<string, boolean>>({});
  const mousePos = useRef<Vector2D>({ x: 500, y: 350 });
  const isSwingingInput = useRef<boolean>(false);
  const isChargingInput = useRef<boolean>(false);

  // Virtual touch controls state
  const joystickCenter = useRef<Vector2D | null>(null);
  const joystickTouchId = useRef<number | null>(null);
  const touchInputDir = useRef<Vector2D>({ x: 0, y: 0 });

  // Handle Knuckle Dash trigger
  const triggerDash = useCallback(() => {
    if (player.dashCooldown <= 0 && !player.isDashing) {
      player.isDashing = true;
      player.dashTimer = 0.32;
      player.dashCooldown = 1.1;
      player.invulnerableTimer = 0.45;
      soundEngine.playKnuckleDash();

      // Dash impulse
      const dashSpeed = 820;
      player.vx = Math.cos(player.facingAngle) * dashSpeed;
      player.vy = Math.sin(player.facingAngle) * dashSpeed;
    }
  }, [player]);

  useEffect(() => {
    roomClearedReported.current = false;
  }, [env]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animFrameId: number;
    let lastTime = performance.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      keysDown.current[e.key.toLowerCase()] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        triggerDash();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isPaused) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mousePos.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (isPaused) return;
      if (e.button === 0) {
        // Left click
        isSwingingInput.current = true;
        isChargingInput.current = true;
      } else if (e.button === 2) {
        // Right click dash
        e.preventDefault();
        triggerDash();
      }
    };

    const handleMouseUp = () => {
      isChargingInput.current = false;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleWindowBlur = () => {
      keysDown.current = {};
      isChargingInput.current = false;
      isSwingingInput.current = false;
      player.isWhirlwinding = false;
      player.chargeTime = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('blur', handleWindowBlur);
    canvas.addEventListener('contextmenu', handleContextMenu);

    // Main Game Simulation Loop
    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      if (!isPaused) {
        // Calculate keyboard movement vector
        let moveX = 0;
        let moveY = 0;
        const k = keysDown.current;
        if (k['w'] || k['arrowup']) moveY -= 1;
        if (k['s'] || k['arrowdown']) moveY += 1;
        if (k['a'] || k['arrowleft']) moveX -= 1;
        if (k['d'] || k['arrowright']) moveX += 1;

        // Combine with touch controls if active
        if (touchInputDir.current.x !== 0 || touchInputDir.current.y !== 0) {
          moveX = touchInputDir.current.x;
          moveY = touchInputDir.current.y;
        }

        const len = Math.hypot(moveX, moveY);
        const inputDir: Vector2D = len > 0.01 
          ? { x: moveX / len, y: moveY / len } 
          : { x: 0, y: 0 };

        // Update Physics
        PhysicsEngine.update(
          dt,
          player,
          env,
          utensil,
          inputDir,
          mousePos.current,
          isSwingingInput.current,
          isChargingInput.current,
          onEnemyKilled,
          (dmg) => {
            onPlayerHit(dmg);
            if (player.hp <= 0) {
              onPlayerDeath();
            }
          }
        );

        // Reset one-frame swing trigger
        isSwingingInput.current = false;

        // Check if room was cleared this frame (fire ONCE)
        if (env.roomCleared && !roomClearedReported.current) {
          roomClearedReported.current = true;
          // Cleanly halt player spin / charge
          player.isWhirlwinding = false;
          player.chargeTime = 0;
          player.isSwinging = false;
          player.isDashing = false;
          player.vx = 0;
          player.vy = 0;
          isChargingInput.current = false;
          isSwingingInput.current = false;
          onRoomCleared();
        }
      } else {
        // When paused, ensure player is not stuck spinning
        player.isWhirlwinding = false;
        player.chargeTime = 0;
        player.isSwinging = false;
        player.isDashing = false;
        player.vx = 0;
        player.vy = 0;
        isChargingInput.current = false;
        isSwingingInput.current = false;
      }

      // Render Frame
      const ctx = canvas.getContext('2d');
      if (ctx) {
        GameRenderer.render(
          ctx,
          canvas.width,
          canvas.height,
          player,
          env,
          utensil,
          floorTheme
        );
      }

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('blur', handleWindowBlur);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [player, env, utensil, floorTheme, isPaused, triggerDash, onEnemyKilled, onPlayerHit, onRoomCleared, onPlayerDeath]);

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.clientX < window.innerWidth * 0.4 && joystickTouchId.current === null) {
        joystickTouchId.current = touch.identifier;
        joystickCenter.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current && joystickCenter.current) {
        const dx = touch.clientX - joystickCenter.current.x;
        const dy = touch.clientY - joystickCenter.current.y;
        const dist = Math.hypot(dx, dy);
        const maxDist = 50;
        const normDist = Math.min(dist, maxDist) / maxDist;
        const angle = Math.atan2(dy, dx);
        touchInputDir.current = {
          x: Math.cos(angle) * normDist,
          y: Math.sin(angle) * normDist,
        };
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current) {
        joystickTouchId.current = null;
        joystickCenter.current = null;
        touchInputDir.current = { x: 0, y: 0 };
      }
    }
  };

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        width={1024}
        height={680}
        className="w-full h-full max-w-[1280px] max-h-[820px] object-contain shadow-2xl cursor-crosshair rounded-xl border border-slate-800"
      />

      {/* On-Screen Mobile Action Buttons */}
      <div className="md:hidden absolute bottom-5 right-5 flex items-center gap-3 z-30 pointer-events-auto">
        <button
          onTouchStart={() => {
            isSwingingInput.current = true;
            isChargingInput.current = true;
          }}
          onTouchEnd={() => {
            isChargingInput.current = false;
          }}
          className="w-16 h-16 rounded-full bg-sky-500/80 active:bg-sky-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg border-2 border-white/40"
        >
          SWING
        </button>
        <button
          onTouchStart={triggerDash}
          className="w-14 h-14 rounded-full bg-amber-500/80 active:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg border-2 border-white/40"
        >
          DASH
        </button>
      </div>
    </div>
  );
};
