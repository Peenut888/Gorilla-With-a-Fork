import { 
  PlayerState, 
  EnemyEntity, 
  PhysicsProp, 
  Projectile, 
  AerosolParticle, 
  VisualParticle, 
  Utensil, 
  Perk,
  Vector2D 
} from '../types/game';
import { soundEngine } from './audio';

export interface RoomEnvironment {
  width: number;
  height: number;
  props: PhysicsProp[];
  enemies: EnemyEntity[];
  projectiles: Projectile[];
  aerosolClouds: AerosolParticle[];
  visualParticles: VisualParticle[];
  cameraShake: number;
  roomCleared: boolean;
  isBossRoom: boolean;
}

export class PhysicsEngine {
  public static update(
    dt: number,
    player: PlayerState,
    env: RoomEnvironment,
    utensil: Utensil,
    inputDir: Vector2D,
    mousePos: Vector2D,
    isSwingingInput: boolean,
    isChargingInput: boolean,
    onEnemyKilled?: (enemy: EnemyEntity, scoreReward: number) => void,
    onPlayerHit?: (damage: number) => void
  ) {
    // 1. Player facing angle points toward mouse cursor
    const dx = mousePos.x - player.x;
    const dy = mousePos.y - player.y;
    player.facingAngle = Math.atan2(dy, dx);

    // Check perks
    const hasBiceps = player.equippedPerks.some(p => p.id === 'silverback_biceps');
    const hasTitan = player.equippedPerks.some(p => p.id === 'titan_silverware');
    const hasBilliard = player.equippedPerks.some(p => p.id === 'billiard_physics');
    const hasLung = player.equippedPerks.some(p => p.id === 'aerosol_immunity');
    const hasRubber = player.equippedPerks.some(p => p.id === 'rubber_rebound');
    const hasSeismic = player.equippedPerks.some(p => p.id === 'seismic_knuckles');
    const hasCyclone = player.equippedPerks.some(p => p.id === 'cyclone_spin');

    // 2. Player Movement Physics
    const baseMoveSpeed = 380;
    const moveMult = (hasLung && this.isPlayerInCloud(player, env.aerosolClouds)) ? 1.25 : 1.0;
    const targetVx = inputDir.x * baseMoveSpeed * moveMult;
    const targetVy = inputDir.y * baseMoveSpeed * moveMult;

    // Smooth acceleration / friction
    const accelRate = 14;
    player.vx += (targetVx - player.vx) * Math.min(1, accelRate * dt);
    player.vy += (targetVy - player.vy) * Math.min(1, accelRate * dt);

    // Apply Dash
    if (player.isDashing) {
      player.dashTimer -= dt;
      if (player.dashTimer <= 0) {
        player.isDashing = false;
      }
    } else {
      if (player.dashCooldown > 0) {
        player.dashCooldown -= dt;
      }
    }

    if (player.invulnerableTimer > 0) {
      player.invulnerableTimer -= dt;
    }

    // Move player
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Player boundary bounce
    this.clampToArena(player, env.width, env.height, (impactSpd) => {
      if (hasRubber && impactSpd > 250) {
        player.isDashing = true;
        player.dashTimer = 0.35;
        player.invulnerableTimer = 0.4;
        soundEngine.playKnuckleDash();
      }
    });

    // 3. Charging Whirlwind / Swing Logic
    const swingSpeedBonus = hasBiceps ? 1.25 : 1.0;
    const reachBonus = hasTitan ? 1.25 : 1.0;
    const effectiveReach = utensil.reach * reachBonus;
    const effectiveArc = utensil.swingArc * (hasTitan ? 1.3 : 1.0);

    if (isChargingInput && !player.isSwinging && !player.isWhirlwinding) {
      player.chargeTime += dt;
      if (player.chargeTime > 0.6) {
        // Charge particles
        if (Math.random() < 0.4) {
          env.visualParticles.push({
            x: player.x + (Math.random() - 0.5) * 40,
            y: player.y + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 60,
            vy: -40 - Math.random() * 50,
            color: utensil.color,
            size: 4,
            alpha: 1,
            life: 0.3,
            maxLife: 0.3,
            type: 'spark',
          });
        }
      }
    } else if (!isChargingInput && player.chargeTime > 0.6 && !player.isWhirlwinding) {
      // RELEASE CHARGED CYCLONE!
      player.isWhirlwinding = true;
      player.whirlwindTimer = hasCyclone ? 1.2 : 0.7;
      player.chargeTime = 0;
      soundEngine.playSwing(0.7);
      env.cameraShake = Math.max(env.cameraShake, 10);
      this.spawnShockwaveRing(env, player.x, player.y, effectiveReach * 1.5, utensil.color);
    } else {
      // If not charging, ensure charge time resets
      if (!isChargingInput) {
        player.chargeTime = 0;
      }
    }

    // Whirlwind active spin
    if (player.isWhirlwinding) {
      player.whirlwindTimer = Math.max(0, player.whirlwindTimer - dt);
      player.facingAngle = (player.facingAngle + 20 * dt) % (Math.PI * 2);
      this.checkWhirlwindHits(player, env, utensil, onEnemyKilled);
      if (player.whirlwindTimer <= 0) {
        player.isWhirlwinding = false;
        player.chargeTime = 0;
      }
    }

    // Standard Attack Swing
    if (isSwingingInput && !player.isSwinging && !player.isWhirlwinding) {
      player.isSwinging = true;
      player.swingProgress = 0;
      soundEngine.playSwing(1.0);
    }

    if (player.isSwinging) {
      player.swingProgress += dt * utensil.swingSpeed * swingSpeedBonus;
      // Utensil swing collision checks during active forward swing
      if (player.swingProgress >= 0.2 && player.swingProgress <= 0.8) {
        this.checkUtensilSwingCollision(player, env, utensil, effectiveReach, effectiveArc, onEnemyKilled);
      }
      if (player.swingProgress >= 1.0) {
        player.isSwinging = false;
        player.swingProgress = 0;
      }
    }

    // 4. Props Physics & Collisions
    for (let pIdx = env.props.length - 1; pIdx >= 0; pIdx--) {
      const prop = env.props[pIdx];

      // Handle puddles (stationary ground friction hazard)
      if (prop.type === 'puddle') {
        const dP = Math.hypot(player.x - prop.x, player.y - prop.y);
        if (dP < prop.radius + player.radius) {
          // Player slips & drifts with reduced friction!
          player.vx *= 1.02;
          player.vy *= 1.02;
        }
        continue;
      }

      // Handle Jack-in-the-Box spring detonation
      if (prop.type === 'jack_box' && prop.isSpringing) {
        prop.jackTimer = (prop.jackTimer || 0.18) - dt;
        if (prop.jackTimer <= 0) {
          prop.isSpringing = false;
          soundEngine.playExplosion();
          env.cameraShake = Math.max(env.cameraShake, 11);
          this.spawnShockwaveRing(env, prop.x, prop.y, 160, '#ec4899');
          this.spawnDamageText(env, prop.x, prop.y - 15, 'BOING! 🎪 -45', '#f43f5e');

          // Blast nearby enemies
          env.enemies.forEach(e => {
            if (e.hp <= 0) return;
            const de = Math.hypot(e.x - prop.x, e.y - prop.y);
            if (de < 170) {
              const a = Math.atan2(e.y - prop.y, e.x - prop.x);
              e.hp -= 45;
              e.vx += Math.cos(a) * 580;
              e.vy += Math.sin(a) * 580;
              e.isStunned = true;
              e.stunTimer = 0.8;
              if (e.hp <= 0 && onEnemyKilled) onEnemyKilled(e, 40);
            }
          });

          // Knock player back slightly
          const dp = Math.hypot(player.x - prop.x, player.y - prop.y);
          if (dp < 140) {
            const ap = Math.atan2(player.y - prop.y, player.x - prop.x);
            player.vx += Math.cos(ap) * 420;
            player.vy += Math.sin(ap) * 420;
          }
        }
      }

      // Handle Pacifier Mine detonation
      if (prop.type === 'pacifier_mine' && !prop.isTriggered) {
        const dPlayer = Math.hypot(player.x - prop.x, player.y - prop.y);
        const nearEnemy = env.enemies.some(e => e.hp > 0 && Math.hypot(e.x - prop.x, e.y - prop.y) < prop.radius + e.radius);
        if (dPlayer < prop.radius + player.radius || nearEnemy) {
          prop.isTriggered = true;
          soundEngine.playExplosion();
          env.cameraShake = Math.max(env.cameraShake, 12);
          this.spawnShockwaveRing(env, prop.x, prop.y, 180, '#ef4444');
          this.spawnExplosionPuff(env, prop.x, prop.y, '#f97316');
          this.spawnDamageText(env, prop.x, prop.y - 15, 'MINE BLAST! 💥 -40', '#ef4444');

          // Damage nearby entities
          env.enemies.forEach(e => {
            if (e.hp <= 0) return;
            const de = Math.hypot(e.x - prop.x, e.y - prop.y);
            if (de < 160) {
              const a = Math.atan2(e.y - prop.y, e.x - prop.x);
              e.hp -= 40;
              e.vx += Math.cos(a) * 520;
              e.vy += Math.sin(a) * 520;
              if (e.hp <= 0 && onEnemyKilled) onEnemyKilled(e, 40);
            }
          });

          if (dPlayer < 140 && player.invulnerableTimer <= 0) {
            player.hp -= 20;
            player.invulnerableTimer = 0.6;
            if (onPlayerHit) onPlayerHit(20);
          }

          env.props.splice(pIdx, 1);
          continue;
        }
      }

      // Move prop
      prop.x += prop.vx * dt;
      prop.y += prop.vy * dt;
      prop.rotation += prop.vRot * dt;

      // Friction customized per obstacle
      let fric = 0.88;
      if (prop.type === 'beach_ball') fric = 0.985;
      else if (prop.type === 'train_car') fric = 0.96;
      else if (prop.type === 'dumbbell') fric = 0.94;
      else if (prop.type === 'pin') fric = 0.92;

      prop.vx *= Math.pow(fric, dt * 60);
      prop.vy *= Math.pow(fric, dt * 60);
      prop.vRot *= Math.pow(0.9, dt * 60);

      // Arena walls
      this.clampToArena(prop, env.width, env.height, (impactSpeed) => {
        // Train car explodes on heavy wall collision
        if (prop.type === 'train_car' && impactSpeed > 220) {
          soundEngine.playExplosion();
          env.cameraShake = Math.max(env.cameraShake, 10);
          this.spawnExplosionPuff(env, prop.x, prop.y, '#3b82f6');
          this.spawnDamageText(env, prop.x, prop.y, 'TRAIN SMASH! 🚂💥', '#38bdf8');
          env.enemies.forEach(e => {
            if (e.hp <= 0) return;
            const de = Math.hypot(e.x - prop.x, e.y - prop.y);
            if (de < 150) {
              e.hp -= 50;
              if (e.hp <= 0 && onEnemyKilled) onEnemyKilled(e, 50);
            }
          });
        }
      });

      // Prop vs Player
      const distPlayer = Math.hypot(player.x - prop.x, player.y - prop.y);
      const minPlayerDist = player.radius + prop.radius;
      if (distPlayer < minPlayerDist && distPlayer > 0.001) {
        const nx = (player.x - prop.x) / distPlayer;
        const ny = (player.y - prop.y) / distPlayer;
        // Separate
        const overlap = minPlayerDist - distPlayer;
        player.x += nx * overlap * 0.4;
        player.y += ny * overlap * 0.4;
        prop.x -= nx * overlap * 0.6;
        prop.y -= ny * overlap * 0.6;

        // Trigger jack-in-the-box when touched
        if (prop.type === 'jack_box' && !prop.isSpringing) {
          prop.isSpringing = true;
          prop.jackTimer = 0.18;
        }

        // Impulse from dash
        if (player.isDashing) {
          const dashImpulse = 460 / prop.mass;
          prop.vx -= nx * dashImpulse;
          prop.vy -= ny * dashImpulse;
          prop.vRot += (Math.random() - 0.5) * 18;
          soundEngine.playMetalClang(false);
          env.cameraShake = Math.max(env.cameraShake, 6);
        }
      }

      // Prop vs Prop
      for (let j = pIdx - 1; j >= 0; j--) {
        const other = env.props[j];
        if (other && other.type !== 'puddle') {
          this.resolveCircleCollision(prop, other);
        }
      }
    }

    // 5. Enemies Physics & AI
    env.enemies.forEach((enemy) => {
      if (enemy.hp <= 0) return;

      // Stun recovery
      if (enemy.isStunned) {
        enemy.stunTimer -= dt;
        if (enemy.stunTimer <= 0) {
          enemy.isStunned = false;
        }
      }

      // Movement & AI when not stunned
      const toPlayerX = player.x - enemy.x;
      const toPlayerY = player.y - enemy.y;
      const distToPlayer = Math.hypot(toPlayerX, toPlayerY);
      enemy.facingAngle = Math.atan2(toPlayerY, toPlayerX);

      if (!enemy.isStunned) {
        this.updateEnemyAI(dt, enemy, player, env, distToPlayer, toPlayerX, toPlayerY);
      }

      // Integrate velocity
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;

      // Friction
      const enemyFric = enemy.type === 'boss_grumpy' ? 0.94 : 0.88;
      enemy.vx *= Math.pow(enemyFric, dt * 60);
      enemy.vy *= Math.pow(enemyFric, dt * 60);

      // Arena Bounce & Wall Impact Damage!
      this.clampToArena(enemy, env.width, env.height, (impactSpeed) => {
        if (impactSpeed > 180) {
          const wallMult = hasBilliard ? 2.2 : 1.0;
          const wallDmg = Math.round((impactSpeed * 0.12) * wallMult);
          enemy.hp -= wallDmg;
          soundEngine.playMetalClang(false);
          env.cameraShake = Math.max(env.cameraShake, 4);

          // Pop text
          this.spawnDamageText(env, enemy.x, enemy.y, `WALL SMASH! -${wallDmg}`, '#f43f5e');

          if (enemy.hp <= 0 && onEnemyKilled) {
            onEnemyKilled(enemy, 50);
          }
        }
      });

      // Enemy vs Player collision (touch damage)
      if (distToPlayer < player.radius + enemy.radius) {
        if (player.isDashing) {
          // Player slams into enemy with massive knuckle impact!
          const nx = toPlayerX / (distToPlayer || 1);
          const ny = toPlayerY / (distToPlayer || 1);
          const slamDmg = 45;
          enemy.hp -= slamDmg;
          enemy.vx -= nx * 400;
          enemy.vy -= ny * 400;
          enemy.isStunned = true;
          enemy.stunTimer = 0.6;
          soundEngine.playKnuckleDash();
          env.cameraShake = Math.max(env.cameraShake, 7);
          this.spawnDamageText(env, enemy.x, enemy.y, `SLAM! -${slamDmg}`, '#38bdf8');

          if (enemy.hp <= 0 && onEnemyKilled) {
            onEnemyKilled(enemy, 40);
          }
        } else if (player.invulnerableTimer <= 0) {
          // Baby touches gorilla
          const touchDmg = enemy.type === 'boss_grumpy' ? 22 : 12;
          player.hp -= touchDmg;
          player.invulnerableTimer = 0.8;
          soundEngine.playCough();
          env.cameraShake = Math.max(env.cameraShake, 8);
          if (onPlayerHit) onPlayerHit(touchDmg);
        }
      }

      // Enemy vs Props (Billiard kinetic impact)
      env.props.forEach((prop) => {
        if (prop.type === 'puddle') {
          // Puddle slip acceleration
          const pDist = Math.hypot(enemy.x - prop.x, enemy.y - prop.y);
          if (pDist < prop.radius + enemy.radius) {
            enemy.vx *= 1.025;
            enemy.vy *= 1.025;
          }
          return;
        }

        const pDist = Math.hypot(enemy.x - prop.x, enemy.y - prop.y);
        const minDist = enemy.radius + prop.radius;
        if (pDist < minDist && pDist > 0.001) {
          const nx = (enemy.x - prop.x) / pDist;
          const ny = (enemy.y - prop.y) / pDist;
          // Kinetic damage if prop was hit fast
          const relSpeed = Math.hypot(prop.vx - enemy.vx, prop.vy - enemy.vy);
          if (relSpeed > 130) {
            let dmgMult = 0.16;
            let textLabel = 'BLOCK HIT!';
            let textColor = '#eab308';

            if (prop.type === 'pin') {
              dmgMult = 0.25;
              textLabel = 'STRIKE! 🎳';
              textColor = '#ef4444';
            } else if (prop.type === 'beach_ball') {
              dmgMult = 0.2;
              textLabel = 'SPIKE! 🏐';
              textColor = '#38bdf8';
            } else if (prop.type === 'dumbbell') {
              dmgMult = 0.32;
              textLabel = 'HEAVY CRUSH! 🏋';
              textColor = '#a855f7';
            } else if (prop.type === 'jack_box') {
              if (!prop.isSpringing) {
                prop.isSpringing = true;
                prop.jackTimer = 0.15;
              }
            }

            const kineticDmg = Math.round(relSpeed * dmgMult * (hasBilliard ? 2.2 : 1.0));
            enemy.hp -= kineticDmg;
            this.spawnDamageText(env, enemy.x, enemy.y, `${textLabel} -${kineticDmg}`, textColor);
            soundEngine.playMetalClang(true);

            if (enemy.hp <= 0 && onEnemyKilled) {
              onEnemyKilled(enemy, 45);
            }
          }
          this.resolveCircleCollision(enemy, prop);
        }
      });
    });

    // Enemy vs Enemy collisions (chain domino knocks)
    for (let i = 0; i < env.enemies.length; i++) {
      for (let j = i + 1; j < env.enemies.length; j++) {
        const e1 = env.enemies[i];
        const e2 = env.enemies[j];
        if (e1.hp > 0 && e2.hp > 0) {
          const dist = Math.hypot(e1.x - e2.x, e1.y - e2.y);
          if (dist < e1.radius + e2.radius) {
            this.resolveCircleCollision(e1, e2);
          }
        }
      }
    }

    // 6. Projectiles Physics (Rattles, Pacifiers, Sonic rings)
    for (let pIdx = env.projectiles.length - 1; pIdx >= 0; pIdx--) {
      const proj = env.projectiles[pIdx];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.lifetime -= dt;

      // Friction
      proj.vx *= Math.pow(0.96, dt * 60);
      proj.vy *= Math.pow(0.96, dt * 60);

      // Bounce on arena borders
      if (proj.x - proj.radius < 20 || proj.x + proj.radius > env.width - 20) {
        proj.vx *= -proj.restitution;
        proj.x = Math.max(20 + proj.radius, Math.min(env.width - 20 - proj.radius, proj.x));
      }
      if (proj.y - proj.radius < 20 || proj.y + proj.radius > env.height - 20) {
        proj.vy *= -proj.restitution;
        proj.y = Math.max(20 + proj.radius, Math.min(env.height - 20 - proj.radius, proj.y));
      }

      // Check hit with player
      if (proj.source === 'enemy') {
        const distP = Math.hypot(proj.x - player.x, proj.y - player.y);
        if (distP < proj.radius + player.radius) {
          if (player.invulnerableTimer <= 0) {
            player.hp -= proj.damage;
            player.invulnerableTimer = 0.7;
            soundEngine.playExplosion();
            env.cameraShake = Math.max(env.cameraShake, 9);
            if (onPlayerHit) onPlayerHit(proj.damage);
            this.spawnExplosionPuff(env, proj.x, proj.y, '#f87171');
          }
          env.projectiles.splice(pIdx, 1);
          continue;
        }
      } else if (proj.source === 'player') {
        // Reflected projectile hitting enemies
        for (const enemy of env.enemies) {
          if (enemy.hp <= 0) continue;
          const distE = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
          if (distE < proj.radius + enemy.radius) {
            enemy.hp -= proj.damage;
            enemy.vx += proj.vx * 0.4;
            enemy.vy += proj.vy * 0.4;
            soundEngine.playExplosion();
            this.spawnDamageText(env, enemy.x, enemy.y, `REFLECT! -${proj.damage}`, '#a855f7');
            this.spawnExplosionPuff(env, proj.x, proj.y, '#c084fc');
            if (enemy.hp <= 0 && onEnemyKilled) {
              onEnemyKilled(enemy, 60);
            }
            env.projectiles.splice(pIdx, 1);
            break;
          }
        }
      }

      if (proj.lifetime <= 0) {
        // Detonate rattle grenade
        if (proj.type === 'rattle') {
          soundEngine.playExplosion();
          this.spawnExplosionPuff(env, proj.x, proj.y, '#fb923c');
        }
        env.projectiles.splice(pIdx, 1);
      }
    }

    // 7. Aerosol Cough Cloud Physics & Swatting
    for (let cIdx = env.aerosolClouds.length - 1; cIdx >= 0; cIdx--) {
      const cloud = env.aerosolClouds[cIdx];
      cloud.x += cloud.vx * dt;
      cloud.y += cloud.vy * dt;
      cloud.lifetime -= dt;
      cloud.radius = Math.min(cloud.maxRadius, cloud.radius + dt * 24);
      cloud.opacity = Math.max(0, (cloud.lifetime / cloud.maxLifetime) * 0.55);

      // Slow drift friction
      cloud.vx *= Math.pow(0.92, dt * 60);
      cloud.vy *= Math.pow(0.92, dt * 60);

      // Check player damage tick inside aerosol cloud
      const distToPlayer = Math.hypot(cloud.x - player.x, cloud.y - player.y);
      if (distToPlayer < cloud.radius + player.radius) {
        cloud.damageTickTimer -= dt;
        if (cloud.damageTickTimer <= 0) {
          cloud.damageTickTimer = 0.5; // Tick every half second
          const cloudDmg = hasLung ? 2 : 6;
          player.hp -= cloudDmg;
          soundEngine.playCough();
          this.spawnDamageText(env, player.x, player.y - 20, `COUGH! -${cloudDmg}`, '#4ade80');
          if (onPlayerHit) onPlayerHit(cloudDmg);
        }
      }

      if (cloud.lifetime <= 0) {
        env.aerosolClouds.splice(cIdx, 1);
      }
    }

    // 8. Visual Particles Update
    for (let p = env.visualParticles.length - 1; p >= 0; p--) {
      const part = env.visualParticles[p];
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.life -= dt;
      part.alpha = Math.max(0, part.life / part.maxLife);

      if (part.type === 'text') {
        part.vy -= 25 * dt; // Float text upward
      }

      if (part.life <= 0) {
        env.visualParticles.splice(p, 1);
      }
    }

    // Camera shake damping
    if (env.cameraShake > 0) {
      env.cameraShake = Math.max(0, env.cameraShake - dt * 25);
    }

    // Check room cleared
    const livingEnemies = env.enemies.filter(e => e.hp > 0);
    if (livingEnemies.length === 0 && !env.roomCleared) {
      env.roomCleared = true;
      soundEngine.playVictoryFanfare();
    }
  }

  // --- UTENSIL COLLISION SWEEPS ---

  private static checkUtensilSwingCollision(
    player: PlayerState,
    env: RoomEnvironment,
    utensil: Utensil,
    reach: number,
    arc: number,
    onEnemyKilled?: (enemy: EnemyEntity, scoreReward: number) => void
  ) {
    const hasBiceps = player.equippedPerks.some(p => p.id === 'silverback_biceps');
    const hasTitan = player.equippedPerks.some(p => p.id === 'titan_silverware');
    const hasDeflectShrapnel = player.equippedPerks.some(p => p.id === 'deflection_shrapnel');

    const swingAngle = player.facingAngle + (player.swingProgress - 0.5) * arc;
    const tineTipX = player.x + Math.cos(swingAngle) * reach;
    const tineTipY = player.y + Math.sin(swingAngle) * reach;

    // 1. Deflect incoming projectiles!
    for (let pIdx = env.projectiles.length - 1; pIdx >= 0; pIdx--) {
      const proj = env.projectiles[pIdx];
      if (proj.source === 'enemy') {
        const dTip = Math.hypot(proj.x - tineTipX, proj.y - tineTipY);
        if (dTip < proj.radius + 35) {
          // DEFLECT!
          proj.source = 'player';
          proj.isReflected = true;
          const reflectSpeed = utensil.id === 'chefs_spatula' ? 650 : 450;
          proj.vx = Math.cos(swingAngle) * reflectSpeed;
          proj.vy = Math.sin(swingAngle) * reflectSpeed;
          proj.damage *= (utensil.id === 'chefs_spatula' ? 3.0 : 1.8);
          soundEngine.playDeflect();
          this.spawnDamageText(env, proj.x, proj.y, 'SWAT DEFLECT!', '#38bdf8');

          if (hasDeflectShrapnel) {
            // Spawn 4 seeking shrapnel fork tines
            for (let s = 0; s < 4; s++) {
              const sAngle = swingAngle + (s - 1.5) * 0.4;
              env.projectiles.push({
                id: `shrapnel_${Math.random()}`,
                x: proj.x,
                y: proj.y,
                vx: Math.cos(sAngle) * 550,
                vy: Math.sin(sAngle) * 550,
                radius: 6,
                mass: 0.2,
                restitution: 0.8,
                friction: 0.99,
                source: 'player',
                type: 'plasma_bolt',
                damage: 30,
                lifetime: 1.5,
                maxLifetime: 1.5,
              });
            }
          }
        }
      }
    }

    // 2. Disperse cough aerosol clouds if hit by utensil
    for (let cIdx = env.aerosolClouds.length - 1; cIdx >= 0; cIdx--) {
      const cloud = env.aerosolClouds[cIdx];
      const dCloud = Math.hypot(cloud.x - tineTipX, cloud.y - tineTipY);
      if (dCloud < cloud.radius + 30) {
        if (utensil.id === 'acoustic_tuning_fork') {
          // Acoustic resonance immediately vaporizes clouds in wide area
          env.aerosolClouds.splice(cIdx, 1);
          soundEngine.playMetalClang(false);
          this.spawnExplosionPuff(env, cloud.x, cloud.y, '#c084fc');
        } else {
          // Wind displacement blows aerosol away
          cloud.vx += Math.cos(swingAngle) * 350;
          cloud.vy += Math.sin(swingAngle) * 350;
          cloud.opacity *= 0.6;
        }
      }
    }

    // 3. Hit Enemies with the Fork
    env.enemies.forEach((enemy) => {
      if (enemy.hp <= 0) return;

      const dEnemy = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (dEnemy <= reach + enemy.radius) {
        // Check angle inside swing wedge
        const angleToEnemy = Math.atan2(enemy.y - player.y, enemy.x - player.x);
        let angleDiff = angleToEnemy - swingAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) < 0.65) {
          // HIT!
          let dmg = utensil.damage;
          if (hasTitan) dmg = Math.round(dmg * 1.45);

          // Utensil specific special interactions
          if (utensil.id === 'surgical_thermometer' && enemy.coughChargeTimer > 0) {
            dmg = Math.round(dmg * 2.5); // Critical puncture mid-cough!
            this.spawnDamageText(env, enemy.x, enemy.y, `CRITICAL FEVER! -${dmg}`, '#ef4444');
          } else {
            this.spawnDamageText(env, enemy.x, enemy.y, `-${dmg}`, utensil.color);
          }

          enemy.hp -= dmg;
          soundEngine.playMetalClang(utensil.id === 'bbq_pitchfork');

          // Physics Knockback Impulse
          const knockbackImpulse = utensil.knockback * (hasBiceps ? 1.4 : 1.0) * 28;
          const kAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
          enemy.vx += Math.cos(kAngle) * (knockbackImpulse / enemy.mass);
          enemy.vy += Math.sin(kAngle) * (knockbackImpulse / enemy.mass);

          // Track highest impact for stats
          const currentImpact = Math.round(knockbackImpulse);
          if (currentImpact > player.highestImpact) {
            player.highestImpact = currentImpact;
          }

          // Spork trajectory flip
          if (utensil.id === 'spork_of_destiny') {
            enemy.vx *= 1.35;
            enemy.vy *= 1.35;
            enemy.isStunned = true;
            enemy.stunTimer = 0.5;
          }

          // Sparks
          this.spawnHitSparks(env, tineTipX, tineTipY, utensil.color);
          env.cameraShake = Math.max(env.cameraShake, 6);

          if (enemy.hp <= 0 && onEnemyKilled) {
            onEnemyKilled(enemy, 50);
          }
        }
      }
    });

    // 4. Swat Physics Props with the Utensil!
    env.props.forEach((prop) => {
      if (prop.type === 'puddle') return;
      const dProp = Math.hypot(prop.x - player.x, prop.y - player.y);
      if (dProp <= reach + prop.radius) {
        const angleToProp = Math.atan2(prop.y - player.y, prop.x - player.x);
        let angleDiff = angleToProp - swingAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) < 0.75) {
          const impulse = (utensil.knockback * 46 / prop.mass) * (hasBiceps ? 1.4 : 1.0);
          prop.vx += Math.cos(swingAngle) * impulse;
          prop.vy += Math.sin(swingAngle) * impulse;
          prop.vRot += (Math.random() - 0.5) * 25;
          soundEngine.playMetalClang(false);

          if (prop.type === 'jack_box' && !prop.isSpringing) {
            prop.isSpringing = true;
            prop.jackTimer = 0.15;
          }
        }
      }
    });
  }

  private static checkWhirlwindHits(
    player: PlayerState,
    env: RoomEnvironment,
    utensil: Utensil,
    onEnemyKilled?: (enemy: EnemyEntity, scoreReward: number) => void
  ) {
    const radius = utensil.reach * 1.4;
    env.enemies.forEach((enemy) => {
      if (enemy.hp <= 0) return;
      const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (dist < radius + enemy.radius) {
        const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
        const whirlDmg = 28;
        enemy.hp -= whirlDmg;
        enemy.vx = Math.cos(angle) * 450;
        enemy.vy = Math.sin(angle) * 450;
        this.spawnDamageText(env, enemy.x, enemy.y, `CYCLONE! -${whirlDmg}`, '#f59e0b');
        soundEngine.playMetalClang(false);

        if (enemy.hp <= 0 && onEnemyKilled) {
          onEnemyKilled(enemy, 60);
        }
      }
    });

    // Whirlwind flings physics obstacles outward
    env.props.forEach((prop) => {
      if (prop.type === 'puddle') return;
      const dist = Math.hypot(prop.x - player.x, prop.y - player.y);
      if (dist < radius + prop.radius) {
        const angle = Math.atan2(prop.y - player.y, prop.x - player.x);
        prop.vx = Math.cos(angle) * (520 / prop.mass);
        prop.vy = Math.sin(angle) * (520 / prop.mass);
        prop.vRot += (Math.random() - 0.5) * 20;
      }
    });
  }

  // --- ENEMY AI BEHAVIORS ---

  private static updateEnemyAI(
    dt: number,
    enemy: EnemyEntity,
    player: PlayerState,
    env: RoomEnvironment,
    distToPlayer: number,
    toPlayerX: number,
    toPlayerY: number
  ) {
    enemy.attackTimer -= dt;

    switch (enemy.type) {
      case 'crawler': {
        // Scuttles relentlessly toward gorilla, coughing small puffs
        const targetSpeed = enemy.speed;
        const nx = toPlayerX / (distToPlayer || 1);
        const ny = toPlayerY / (distToPlayer || 1);
        enemy.vx += nx * targetSpeed * 2.5 * dt;
        enemy.vy += ny * targetSpeed * 2.5 * dt;

        if (enemy.attackTimer <= 0 && distToPlayer < 120) {
          enemy.attackTimer = 1.8;
          soundEngine.playCough();
          this.spawnCoughAerosol(env, enemy.x, enemy.y, nx * 140, ny * 140);
        }
        break;
      }

      case 'droplet_blaster': {
        // Keeps medium distance, charges up huge aerosol spray
        if (distToPlayer < 220) {
          // Back up slightly
          enemy.vx -= (toPlayerX / distToPlayer) * enemy.speed * dt * 2;
          enemy.vy -= (toPlayerY / distToPlayer) * enemy.speed * dt * 2;
        } else if (distToPlayer > 360) {
          enemy.vx += (toPlayerX / distToPlayer) * enemy.speed * dt * 2;
          enemy.vy += (toPlayerY / distToPlayer) * enemy.speed * dt * 2;
        }

        if (enemy.attackTimer <= 0) {
          enemy.coughChargeTimer += dt;
          if (enemy.coughChargeTimer > 0.8) {
            enemy.coughChargeTimer = 0;
            enemy.attackTimer = 2.4;
            soundEngine.playCough();
            const angle = Math.atan2(toPlayerY, toPlayerX);
            // Unleash 3 spray clouds
            for (let i = -1; i <= 1; i++) {
              const a = angle + i * 0.3;
              this.spawnCoughAerosol(env, enemy.x, enemy.y, Math.cos(a) * 200, Math.sin(a) * 200);
            }
          }
        }
        break;
      }

      case 'crybaby_banshee': {
        // Circling AI, unleashes ultrasonic shockwave scream
        const circleAngle = Math.atan2(toPlayerY, toPlayerX) + Math.PI * 0.5;
        enemy.vx += Math.cos(circleAngle) * enemy.speed * dt * 2;
        enemy.vy += Math.sin(circleAngle) * enemy.speed * dt * 2;

        if (enemy.attackTimer <= 0) {
          enemy.attackTimer = 3.2;
          soundEngine.playSwing(1.8);
          // Radial sonic scream pushes gorilla and objects
          this.spawnShockwaveRing(env, enemy.x, enemy.y, 160, '#a855f7');
          if (distToPlayer < 180) {
            player.vx += (toPlayerX / distToPlayer) * 380;
            player.vy += (toPlayerY / distToPlayer) * 380;
            player.hp -= 10;
          }
        }
        break;
      }

      case 'rattle_grenadier': {
        // Stays back and flings bouncing explosive rattles
        if (distToPlayer < 280) {
          enemy.vx -= (toPlayerX / distToPlayer) * enemy.speed * dt * 2;
          enemy.vy -= (toPlayerY / distToPlayer) * enemy.speed * dt * 2;
        }

        if (enemy.attackTimer <= 0) {
          enemy.attackTimer = 2.6;
          soundEngine.playSwing(1.4);
          const angle = Math.atan2(toPlayerY, toPlayerX);
          env.projectiles.push({
            id: `rattle_${Math.random()}`,
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * 320,
            vy: Math.sin(angle) * 320,
            radius: 12,
            mass: 0.6,
            restitution: 0.85,
            friction: 0.98,
            source: 'enemy',
            type: 'rattle',
            damage: 24,
            lifetime: 2.8,
            maxLifetime: 2.8,
          });
        }
        break;
      }

      case 'pacifier_turret': {
        // Stationary or slow booster seat turret firing spread shot
        if (enemy.attackTimer <= 0) {
          enemy.attackTimer = 1.9;
          soundEngine.playSwing(2.0);
          const baseAngle = Math.atan2(toPlayerY, toPlayerX);
          [-0.25, 0, 0.25].forEach(offset => {
            const a = baseAngle + offset;
            env.projectiles.push({
              id: `pacifier_${Math.random()}`,
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(a) * 360,
              vy: Math.sin(a) * 360,
              radius: 9,
              mass: 0.4,
              restitution: 0.7,
              friction: 0.99,
              source: 'enemy',
              type: 'pacifier',
              damage: 15,
              lifetime: 3.0,
              maxLifetime: 3.0,
            });
          });
        }
        break;
      }

      case 'boss_grumpy': {
        // Multi-phase mechanized baby titan boss
        enemy.stateTimer += dt;
        const phase = enemy.hp < enemy.maxHp * 0.4 ? 3 : (enemy.hp < enemy.maxHp * 0.7 ? 2 : 1);
        enemy.phase = phase;

        if (enemy.stateTimer > 4.0) {
          enemy.stateTimer = 0;
          // Phase attack trigger
          if (phase === 1) {
            // High chair ground tantrum
            soundEngine.playExplosion();
            env.cameraShake = 14;
            this.spawnShockwaveRing(env, enemy.x, enemy.y, 240, '#ef4444');
            if (distToPlayer < 240) {
              player.hp -= 20;
              player.vx += (toPlayerX / distToPlayer) * 500;
              player.vy += (toPlayerY / distToPlayer) * 500;
            }
          } else if (phase === 2) {
            // Rocket charge across the room!
            const chargeAngle = Math.atan2(toPlayerY, toPlayerX);
            enemy.vx = Math.cos(chargeAngle) * 620;
            enemy.vy = Math.sin(chargeAngle) * 620;
            soundEngine.playKnuckleDash();
          } else if (phase === 3) {
            // Tantrum apocalypse aerosol storm!
            soundEngine.playCough();
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2;
              this.spawnCoughAerosol(env, enemy.x, enemy.y, Math.cos(a) * 180, Math.sin(a) * 180);
            }
          }
        } else {
          // Slow purposeful boss stalking
          const nx = toPlayerX / (distToPlayer || 1);
          const ny = toPlayerY / (distToPlayer || 1);
          enemy.vx += nx * enemy.speed * dt * 1.5;
          enemy.vy += ny * enemy.speed * dt * 1.5;
        }
        break;
      }
    }
  }

  // --- COLLISION RESOLUTION UTILS ---

  private static clampToArena(
    body: { x: number; y: number; vx: number; vy: number; radius: number; restitution: number },
    w: number,
    h: number,
    onImpact?: (impactSpeed: number) => void
  ) {
    const pad = body.radius + 24;
    let bounced = false;
    let maxSpeed = 0;

    if (body.x < pad) {
      body.x = pad;
      maxSpeed = Math.max(maxSpeed, Math.abs(body.vx));
      body.vx = -body.vx * body.restitution;
      bounced = true;
    } else if (body.x > w - pad) {
      body.x = w - pad;
      maxSpeed = Math.max(maxSpeed, Math.abs(body.vx));
      body.vx = -body.vx * body.restitution;
      bounced = true;
    }

    if (body.y < pad) {
      body.y = pad;
      maxSpeed = Math.max(maxSpeed, Math.abs(body.vy));
      body.vy = -body.vy * body.restitution;
      bounced = true;
    } else if (body.y > h - pad) {
      body.y = h - pad;
      maxSpeed = Math.max(maxSpeed, Math.abs(body.vy));
      body.vy = -body.vy * body.restitution;
      bounced = true;
    }

    if (bounced && onImpact && maxSpeed > 50) {
      onImpact(maxSpeed);
    }
  }

  private static resolveCircleCollision(
    b1: { x: number; y: number; vx: number; vy: number; radius: number; mass: number; restitution: number },
    b2: { x: number; y: number; vx: number; vy: number; radius: number; mass: number; restitution: number }
  ) {
    const dx = b2.x - b1.x;
    const dy = b2.y - b1.y;
    const dist = Math.hypot(dx, dy);
    const minDist = b1.radius + b2.radius;

    if (dist < minDist && dist > 0.0001) {
      const nx = dx / dist;
      const ny = dy / dist;

      // Positional separation
      const overlap = minDist - dist;
      const totalMass = b1.mass + b2.mass;
      const m1Ratio = b2.mass / totalMass;
      const m2Ratio = b1.mass / totalMass;

      b1.x -= nx * overlap * m1Ratio;
      b1.y -= ny * overlap * m1Ratio;
      b2.x += nx * overlap * m2Ratio;
      b2.y += ny * overlap * m2Ratio;

      // Elastic impulse
      const kx = b1.vx - b2.vx;
      const ky = b1.vy - b2.vy;
      const p = 2 * (nx * kx + ny * ky) / totalMass;

      const rest = Math.max(b1.restitution, b2.restitution);
      b1.vx -= p * b2.mass * nx * rest;
      b1.vy -= p * b2.mass * ny * rest;
      b2.vx += p * b1.mass * nx * rest;
      b2.vy += p * b1.mass * ny * rest;
    }
  }

  private static isPlayerInCloud(player: PlayerState, clouds: AerosolParticle[]): boolean {
    return clouds.some(c => Math.hypot(c.x - player.x, c.y - player.y) < c.radius + player.radius);
  }

  // --- PARTICLE EMITTERS ---

  public static spawnCoughAerosol(env: RoomEnvironment, x: number, y: number, vx: number, vy: number) {
    for (let i = 0; i < 4; i++) {
      env.aerosolClouds.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: vx + (Math.random() - 0.5) * 80,
        vy: vy + (Math.random() - 0.5) * 80,
        radius: 18,
        maxRadius: 65 + Math.random() * 25,
        opacity: 0.6,
        lifetime: 3.5,
        maxLifetime: 3.5,
        damageTickTimer: 0.2,
      });
    }
  }

  public static spawnHitSparks(env: RoomEnvironment, x: number, y: number, color: string) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 120 + Math.random() * 200;
      env.visualParticles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size: 3 + Math.random() * 4,
        alpha: 1,
        life: 0.25,
        maxLife: 0.25,
        type: 'spark',
      });
    }
  }

  public static spawnShockwaveRing(env: RoomEnvironment, x: number, y: number, maxRadius: number, color: string) {
    env.visualParticles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color,
      size: maxRadius,
      alpha: 1,
      life: 0.4,
      maxLife: 0.4,
      type: 'ring',
    });
  }

  public static spawnExplosionPuff(env: RoomEnvironment, x: number, y: number, color: string) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 120;
      env.visualParticles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size: 8 + Math.random() * 10,
        alpha: 0.9,
        life: 0.45,
        maxLife: 0.45,
        type: 'puff',
      });
    }
  }

  public static spawnDamageText(env: RoomEnvironment, x: number, y: number, text: string, color: string) {
    env.visualParticles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 30,
      vy: -55 - Math.random() * 20,
      color,
      size: 14,
      alpha: 1,
      life: 0.8,
      maxLife: 0.8,
      type: 'text',
      text,
    });
  }
}
