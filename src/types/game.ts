export type GameState = 
  | 'TITLE_MENU' 
  | 'MAP_SELECT' 
  | 'PLAYING' 
  | 'PERK_CHOICE' 
  | 'ARMORY' 
  | 'HOW_TO_PLAY' 
  | 'GAME_OVER' 
  | 'VICTORY';

export type UtensilId = 
  | 'standard_fork'
  | 'gilded_salad_fork'
  | 'spork_of_destiny'
  | 'acoustic_tuning_fork'
  | 'bbq_pitchfork'
  | 'voltaic_plasma_spork'
  | 'surgical_thermometer'
  | 'chefs_spatula';

export interface Utensil {
  id: UtensilId;
  name: string;
  tagline: string;
  description: string;
  tines: number;
  damage: number;
  reach: number; // in pixels
  swingArc: number; // radians (e.g. Math.PI * 0.75)
  swingSpeed: number; // radians per second
  knockback: number; // physics impulse force
  cooldown: number; // ms
  special: string;
  color: string;
  metallicGlow: string;
  unlockedByDefault: boolean;
  unlockCost: number; // Rattle trophies
  unlockCondition: string;
}

export type EnemyType = 
  | 'crawler' 
  | 'droplet_blaster' 
  | 'crybaby_banshee' 
  | 'rattle_grenadier' 
  | 'pacifier_turret' 
  | 'boss_grumpy';

export interface Vector2D {
  x: number;
  y: number;
}

export interface PhysicsBody {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  restitution: number; // bounciness (0 to 1.5)
  friction: number;
}

export interface PlayerState extends PhysicsBody {
  maxHp: number;
  hp: number;
  stamina: number;
  facingAngle: number;
  isDashing: boolean;
  dashCooldown: number;
  dashTimer: number;
  dashCharge: number;
  invulnerableTimer: number;
  swingProgress: number; // 0 to 1 during swing
  isSwinging: boolean;
  chargeTime: number; // for whirlwind
  isWhirlwinding: boolean;
  whirlwindTimer: number;
  selectedUtensil: UtensilId;
  unlockedUtensils: UtensilId[];
  equippedPerks: Perk[];
  rattlesCurrency: number;
  kills: number;
  highestImpact: number;
}

export interface EnemyEntity extends PhysicsBody {
  type: EnemyType;
  name: string;
  hp: number;
  maxHp: number;
  speed: number;
  attackCooldown: number;
  attackTimer: number;
  stateTimer: number;
  phase?: number;
  facingAngle: number;
  isStunned: boolean;
  stunTimer: number;
  coughChargeTimer: number;
  color: string;
}

export type PropType = 
  | 'block' 
  | 'duck' 
  | 'puddle' 
  | 'pacifier_mine' 
  | 'pin' 
  | 'beach_ball' 
  | 'jack_box' 
  | 'dumbbell' 
  | 'train_car';

export interface PhysicsProp extends PhysicsBody {
  type: PropType;
  rotation: number;
  vRot: number;
  label?: string;
  hp?: number;
  isDestroyed?: boolean;
  jackTimer?: number;
  isSpringing?: boolean;
  isTriggered?: boolean;
}

export interface Projectile extends PhysicsBody {
  source: 'enemy' | 'player';
  type: 'rattle' | 'pacifier' | 'sonic_ring' | 'plasma_bolt';
  damage: number;
  lifetime: number;
  maxLifetime: number;
  isReflected?: boolean;
}

export interface AerosolParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  lifetime: number;
  maxLifetime: number;
  damageTickTimer: number;
}

export interface VisualParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  type?: 'spark' | 'confetti' | 'puff' | 'text' | 'ring';
  text?: string;
}

export type RoomType = 'COMBAT' | 'ELITE' | 'CHEST' | 'SHOP' | 'REST' | 'BOSS';

export interface DungeonNode {
  id: string;
  floor: number;
  row: number; // column in progression
  col: number; // row in tree
  type: RoomType;
  title: string;
  description: string;
  cleared: boolean;
  current: boolean;
  available: boolean;
  connections: string[]; // target node IDs
}

export interface Perk {
  id: string;
  name: string;
  description: string;
  tier: 'COMMON' | 'RARE' | 'LEGENDARY';
  icon: string;
  effect: (player: PlayerState) => void;
}

export interface RunStats {
  floor: number;
  roomCount: number;
  babiesDefeated: number;
  rattlesSwatted: number;
  maxKineticImpact: number;
  damageDealt: number;
  damageTaken: number;
  runDurationSeconds: number;
  victory: boolean;
}
