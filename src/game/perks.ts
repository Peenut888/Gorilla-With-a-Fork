import { Perk, PlayerState } from '../types/game';

export const ALL_PERKS: Perk[] = [
  {
    id: 'silverback_biceps',
    name: 'Silverback Biceps',
    description: '+35% Utensil knockback impulse and +20% swing speed.',
    tier: 'COMMON',
    icon: 'ArmFlex',
    effect: (player: PlayerState) => {
      // Applied in damage/knockback calculation
    },
  },
  {
    id: 'aerosol_immunity',
    name: 'Primate Lung Filter',
    description: '-60% damage taken from green cough aerosol clouds and gain +25% move speed while standing inside them.',
    tier: 'COMMON',
    icon: 'Shield',
    effect: (player: PlayerState) => {
      // Applied in damage resistance
    },
  },
  {
    id: 'billiard_physics',
    name: 'Nursery Billiard Master',
    description: 'Enemies take +120% bonus kinetic impact damage when slammed into walls, wooden blocks, or other babies.',
    tier: 'COMMON',
    icon: 'Zap',
    effect: (player: PlayerState) => {
      // Applied in collision damage
    },
  },
  {
    id: 'potassium_rush',
    name: 'Pure Potassium Rush',
    description: 'Picking up bananas increases maximum HP by 15 and triggers 6 seconds of frenzy attack speed.',
    tier: 'RARE',
    icon: 'Sparkles',
    effect: (player: PlayerState) => {
      player.maxHp += 15;
      player.hp = Math.min(player.maxHp, player.hp + 20);
    },
  },
  {
    id: 'cyclone_spin',
    name: 'Vortex Whirlwind',
    description: 'Charged Whirlwind spins for 2 additional full rotations, drawing in dropped rattles and knocking babies skyward.',
    tier: 'RARE',
    icon: 'Flame',
    effect: (player: PlayerState) => {
      // Applied in whirlwind logic
    },
  },
  {
    id: 'rubber_rebound',
    name: 'Super-Elastic Rubber Duckies',
    description: 'Bouncing off walls or duck obstacles launches Kongrad in a high-speed knuckle dash with invulnerability.',
    tier: 'RARE',
    icon: 'Target',
    effect: (player: PlayerState) => {
      // Applied in dash/physics logic
    },
  },
  {
    id: 'titan_silverware',
    name: 'Titanium Tine Core',
    description: '+45% Utensil damage and enlarged swing arc (+30 degrees of coverage).',
    tier: 'RARE',
    icon: 'Sword',
    effect: (player: PlayerState) => {
      // Applied in swing calculation
    },
  },
  {
    id: 'adrenaline_diaper_clash',
    name: 'Second Wind Nap',
    description: 'Upon taking fatal damage, instantly revive with 50% HP and trigger an enormous 360° ground-slam shockwave (once per run).',
    tier: 'LEGENDARY',
    icon: 'HeartPulse',
    effect: (player: PlayerState) => {
      // Applied in player damage logic
    },
  },
  {
    id: 'deflection_shrapnel',
    name: 'Tine Deflection Shrapnel',
    description: 'Swatting flying rattles causes them to explode into 4 mini fork-tipped shrapnel shards that seek enemies.',
    tier: 'LEGENDARY',
    icon: 'ShieldAlert',
    effect: (player: PlayerState) => {
      // Applied in deflection
    },
  },
  {
    id: 'seismic_knuckles',
    name: 'Seismic Knuckle Cracker',
    description: 'Your Knuckle Dash creates a trailing shockwave fissure that stuns coughing babies for 2.5 seconds.',
    tier: 'LEGENDARY',
    icon: 'Activity',
    effect: (player: PlayerState) => {
      // Applied on dash
    },
  },
];

export function getRandomPerks(count: number, excludedIds: string[]): Perk[] {
  let available = ALL_PERKS.filter(p => !excludedIds.includes(p.id));
  if (available.length < count) {
    available = [...ALL_PERKS];
  }
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
