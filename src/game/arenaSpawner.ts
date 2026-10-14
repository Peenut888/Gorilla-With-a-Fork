import { 
  EnemyEntity, 
  PhysicsProp, 
  RoomType 
} from '../types/game';
import { RoomEnvironment } from './physics';

export function createRoomEnvironment(
  width: number,
  height: number,
  floorNumber: number,
  roomType: RoomType
): RoomEnvironment {
  const props: PhysicsProp[] = [];
  const enemies: EnemyEntity[] = [];

  // Generate rich interactive physics obstacles
  // 1. ABC Wooden Toy Blocks
  const blockLetters = ['K', 'O', 'N', 'G', 'F', 'O', 'R', 'K', 'A', 'B', 'C', '1', '2'];
  const numBlocks = roomType === 'BOSS' ? 2 : (3 + Math.floor(Math.random() * 3));
  for (let i = 0; i < numBlocks; i++) {
    const radius = 22 + Math.random() * 8;
    props.push({
      id: `block_${i}`,
      type: 'block',
      x: 140 + Math.random() * (width - 280),
      y: 120 + Math.random() * (height - 240),
      vx: 0,
      vy: 0,
      radius,
      mass: 1.4,
      restitution: 0.85,
      friction: 0.92,
      rotation: Math.random() * Math.PI,
      vRot: 0,
      label: blockLetters[i % blockLetters.length],
    });
  }

  // 2. Giant Bouncy Rubber Ducks (Bumpers)
  const numDucks = roomType === 'BOSS' ? 2 : (1 + Math.floor(Math.random() * 2));
  for (let i = 0; i < numDucks; i++) {
    props.push({
      id: `duck_${i}`,
      type: 'duck',
      x: 180 + Math.random() * (width - 360),
      y: 140 + Math.random() * (height - 280),
      vx: 0,
      vy: 0,
      radius: 26,
      mass: 2.2,
      restitution: 1.4, // Super elastic bounce
      friction: 0.94,
      rotation: 0,
      vRot: 0,
    });
  }

  // 3. Bowling Pin Skittles (Arranged for Strike combos)
  if (roomType !== 'BOSS') {
    const numPins = 3 + Math.floor(Math.random() * 4);
    const pinStartX = width * 0.45 + (Math.random() - 0.5) * 160;
    const pinStartY = height * 0.35 + (Math.random() - 0.5) * 120;
    for (let p = 0; p < numPins; p++) {
      props.push({
        id: `pin_${p}`,
        type: 'pin',
        x: pinStartX + (p % 3) * 32,
        y: pinStartY + Math.floor(p / 3) * 36,
        vx: 0,
        vy: 0,
        radius: 16,
        mass: 1.0,
        restitution: 0.95,
        friction: 0.92,
        rotation: 0,
        vRot: 0,
      });
    }
  }

  // 4. Ultra-Bouncy Giant Beach Balls
  if (Math.random() < 0.65 || roomType === 'ELITE') {
    props.push({
      id: `beach_ball_${Math.random()}`,
      type: 'beach_ball',
      x: 200 + Math.random() * (width - 400),
      y: 150 + Math.random() * (height - 300),
      vx: (Math.random() - 0.5) * 80,
      vy: (Math.random() - 0.5) * 80,
      radius: 36,
      mass: 0.45,
      restitution: 1.6, // Hyper bounce
      friction: 0.99,
      rotation: Math.random() * Math.PI,
      vRot: (Math.random() - 0.5) * 4,
    });
  }

  // 5. Spring-Loaded Jack-in-the-Box Traps
  if (Math.random() < 0.6 || roomType === 'ELITE') {
    props.push({
      id: `jack_box_${Math.random()}`,
      type: 'jack_box',
      x: 220 + Math.random() * (width - 440),
      y: 160 + Math.random() * (height - 320),
      vx: 0,
      vy: 0,
      radius: 24,
      mass: 2.8,
      restitution: 0.7,
      friction: 0.88,
      rotation: 0,
      vRot: 0,
      jackTimer: 0,
      isSpringing: false,
    });
  }

  // 6. Heavy Toddler Cast-Iron Dumbbells
  if (Math.random() < 0.55 || roomType === 'BOSS') {
    props.push({
      id: `dumbbell_${Math.random()}`,
      type: 'dumbbell',
      x: 200 + Math.random() * (width - 400),
      y: 180 + Math.random() * (height - 360),
      vx: 0,
      vy: 0,
      radius: 27,
      mass: 6.2, // Heavy momentum battering ram
      restitution: 0.35,
      friction: 0.94,
      rotation: Math.random() * Math.PI,
      vRot: 0,
    });
  }

  // 7. Explosive Alphabet Toy Train Cars
  if (Math.random() < 0.5 || roomType === 'ELITE') {
    props.push({
      id: `train_${Math.random()}`,
      type: 'train_car',
      x: 240 + Math.random() * (width - 480),
      y: 200 + Math.random() * (height - 400),
      vx: 0,
      vy: 0,
      radius: 25,
      mass: 1.8,
      restitution: 0.75,
      friction: 0.96,
      rotation: Math.random() * Math.PI,
      vRot: 0,
      label: 'BOOM',
    });
  }

  // 8. Spilled Milk / Puree Puddle (Slippery Slip Zone)
  if (Math.random() < 0.65) {
    props.push({
      id: `puddle_${Math.random()}`,
      type: 'puddle',
      x: 260 + Math.random() * (width - 520),
      y: 180 + Math.random() * (height - 360),
      vx: 0,
      vy: 0,
      radius: 48,
      mass: 999, // Static puddle
      restitution: 0,
      friction: 1.0,
      rotation: Math.random() * Math.PI,
      vRot: 0,
    });
  }

  // 9. Pacifier Pressure Mines
  if (roomType === 'ELITE' || roomType === 'BOSS' || Math.random() < 0.45) {
    const numMines = roomType === 'BOSS' ? 2 : 1;
    for (let m = 0; m < numMines; m++) {
      props.push({
        id: `mine_${m}`,
        type: 'pacifier_mine',
        x: 200 + Math.random() * (width - 400),
        y: 160 + Math.random() * (height - 320),
        vx: 0,
        vy: 0,
        radius: 17,
        mass: 3.0,
        restitution: 0.6,
        friction: 0.92,
        rotation: 0,
        vRot: 0,
        isTriggered: false,
      });
    }
  }

  // Populate Enemies based on Room Type & Floor
  if (roomType === 'BOSS') {
    // The Diaper Duke of Discontent!
    enemies.push({
      id: 'boss_baby_grumpy',
      type: 'boss_grumpy',
      name: 'Baby Grumpy (Diaper Duke)',
      x: width * 0.72,
      y: height * 0.5,
      vx: 0,
      vy: 0,
      radius: 48,
      mass: 8.5,
      restitution: 0.6,
      friction: 0.92,
      hp: 380 + (floorNumber - 1) * 80,
      maxHp: 380 + (floorNumber - 1) * 80,
      speed: 120,
      attackCooldown: 2.5,
      attackTimer: 1.0,
      stateTimer: 0,
      facingAngle: Math.PI,
      isStunned: false,
      stunTimer: 0,
      coughChargeTimer: 0,
      color: '#ef4444',
    });

    // 2 Support diaper crawlers
    for (let i = 0; i < 2; i++) {
      enemies.push({
        id: `boss_minion_${i}`,
        type: 'crawler',
        name: 'Royal Diaper Guard',
        x: width * 0.65,
        y: height * 0.3 + i * height * 0.4,
        vx: 0,
        vy: 0,
        radius: 19,
        mass: 1.0,
        restitution: 0.8,
        friction: 0.9,
        hp: 55,
        maxHp: 55,
        speed: 150,
        attackCooldown: 2.0,
        attackTimer: 1.5,
        stateTimer: 0,
        facingAngle: Math.PI,
        isStunned: false,
        stunTimer: 0,
        coughChargeTimer: 0,
        color: '#f43f5e',
      });
    }
  } else if (roomType === 'ELITE') {
    // Elite Room: Tougher baby variants
    const eliteCount = 3 + floorNumber;
    for (let i = 0; i < eliteCount; i++) {
      const isBanshee = i % 2 === 0;
      enemies.push({
        id: `elite_${i}`,
        type: isBanshee ? 'crybaby_banshee' : 'rattle_grenadier',
        name: isBanshee ? 'Screeching Banshee Baby' : 'Volatile Rattle Hurler',
        x: width * 0.6 + (Math.random() - 0.5) * 220,
        y: height * 0.3 + (i / eliteCount) * height * 0.45,
        vx: 0,
        vy: 0,
        radius: 22,
        mass: 1.4,
        restitution: 0.85,
        friction: 0.9,
        hp: 95,
        maxHp: 95,
        speed: 165,
        attackCooldown: 2.2,
        attackTimer: Math.random() * 1.5,
        stateTimer: 0,
        facingAngle: Math.PI,
        isStunned: false,
        stunTimer: 0,
        coughChargeTimer: 0,
        color: isBanshee ? '#a855f7' : '#f97316',
      });
    }
  } else if (roomType === 'COMBAT') {
    // Standard Combat Room
    const enemyCount = 3 + floorNumber * 2;
    for (let i = 0; i < enemyCount; i++) {
      const rand = Math.random();
      let type: EnemyEntity['type'] = 'crawler';
      let hp = 45;
      let color = '#38bdf8';
      let speed = 140;

      if (rand < 0.35) {
        type = 'crawler';
        hp = 40 + floorNumber * 8;
        color = '#38bdf8';
        speed = 170;
      } else if (rand < 0.65) {
        type = 'droplet_blaster';
        hp = 55 + floorNumber * 10;
        color = '#22c55e';
        speed = 130;
      } else if (rand < 0.85) {
        type = 'rattle_grenadier';
        hp = 50 + floorNumber * 9;
        color = '#f97316';
        speed = 145;
      } else {
        type = 'pacifier_turret';
        hp = 70 + floorNumber * 12;
        color = '#06b6d4';
        speed = 80;
      }

      enemies.push({
        id: `enemy_${i}`,
        type,
        name: type.replace('_', ' ').toUpperCase(),
        x: width * 0.55 + Math.random() * (width * 0.35),
        y: 100 + Math.random() * (height - 200),
        vx: 0,
        vy: 0,
        radius: 20,
        mass: 1.1,
        restitution: 0.8,
        friction: 0.91,
        hp,
        maxHp: hp,
        speed,
        attackCooldown: 2.0,
        attackTimer: 0.5 + Math.random() * 2.0,
        stateTimer: 0,
        facingAngle: Math.PI,
        isStunned: false,
        stunTimer: 0,
        coughChargeTimer: 0,
        color,
      });
    }
  }

  return {
    width,
    height,
    props,
    enemies,
    projectiles: [],
    aerosolClouds: [],
    visualParticles: [],
    cameraShake: 0,
    roomCleared: enemies.length === 0,
    isBossRoom: roomType === 'BOSS',
  };
}
