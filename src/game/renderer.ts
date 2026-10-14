import { 
  PlayerState, 
  EnemyEntity, 
  PhysicsProp, 
  Projectile, 
  AerosolParticle, 
  VisualParticle, 
  Utensil 
} from '../types/game';
import { RoomEnvironment } from './physics';

const playerSpriteImg = new Image();
playerSpriteImg.src = '/src/assets/images/player_gorilla_sprite_1792004033798.jpg';
let playerSpriteLoaded = false;
playerSpriteImg.onload = () => {
  playerSpriteLoaded = true;
};

const coughingBabyImg = new Image();
coughingBabyImg.src = '/src/assets/images/single_coughing_baby_1792004400595.jpg';
let coughingBabyLoaded = false;
coughingBabyImg.onload = () => {
  coughingBabyLoaded = true;
};

export class GameRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    player: PlayerState,
    env: RoomEnvironment,
    utensil: Utensil,
    floorTheme: string
  ) {
    ctx.save();

    // 1. Camera Shake Offset
    if (env.cameraShake > 0) {
      const shakeX = (Math.random() - 0.5) * env.cameraShake;
      const shakeY = (Math.random() - 0.5) * env.cameraShake;
      ctx.translate(shakeX, shakeY);
    }

    // 2. Clear & Draw Nursery Playroom Floor
    this.drawArenaFloor(ctx, width, height, floorTheme);

    // 3. Draw Aerosol Cough Clouds (Ground layer)
    this.drawAerosolClouds(ctx, env.aerosolClouds);

    // 4. Draw Props (ABC blocks, rubber ducks, pacifier mines)
    this.drawProps(ctx, env.props);

    // 5. Draw Projectiles (Bouncing rattles, pacifiers)
    this.drawProjectiles(ctx, env.projectiles);

    // 6. Draw Coughing Babies (Enemies)
    this.drawEnemies(ctx, env.enemies);

    // 7. Draw Player (Kongrad the Gorilla + Equipped Utensil)
    this.drawPlayer(ctx, player, utensil);

    // 8. Draw Visual Particles & Floating Damage Texts
    this.drawVisualParticles(ctx, env.visualParticles);

    // 9. Draw Arena Bouncy Borders & Cushions
    this.drawArenaBorders(ctx, width, height);

    ctx.restore();
  }

  // --- ARENA FLOOR & BORDERS ---

  private static drawArenaFloor(ctx: CanvasRenderingContext2D, w: number, h: number, theme: string) {
    // Foam puzzle mat background tiles
    const tileSize = 64;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    const colors = ['#131c31', '#17223b', '#11192c', '#152038'];
    for (let x = 24; x < w - 24; x += tileSize) {
      for (let y = 24; y < h - 24; y += tileSize) {
        const cIdx = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % colors.length;
        ctx.fillStyle = colors[cIdx];
        ctx.fillRect(x, y, tileSize - 2, tileSize - 2);

        // Soft mat stitch pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.strokeRect(x + 2, y + 2, tileSize - 6, tileSize - 6);
      }
    }

    // Floor center ring decal
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 140, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 12]);
    ctx.stroke();
    ctx.restore();
  }

  private static drawArenaBorders(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const pad = 24;
    ctx.save();

    // Padded soft bumper border
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#334155';
    ctx.lineJoin = 'round';
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

    // Inner bright bumper trim
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

    // Corner bumper caps
    const corners = [
      [pad, pad],
      [w - pad, pad],
      [pad, h - pad],
      [w - pad, h - pad],
    ];
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#0284c7';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#e0f2fe';
      ctx.stroke();
    });

    ctx.restore();
  }

  // --- AEROSOL COUGH PARTICLES ---

  private static drawAerosolClouds(ctx: CanvasRenderingContext2D, clouds: AerosolParticle[]) {
    ctx.save();
    clouds.forEach((cloud) => {
      const grad = ctx.createRadialGradient(cloud.x, cloud.y, 4, cloud.x, cloud.y, cloud.radius);
      grad.addColorStop(0, `rgba(74, 222, 128, ${cloud.opacity * 0.9})`);
      grad.addColorStop(0.6, `rgba(34, 197, 94, ${cloud.opacity * 0.5})`);
      grad.addColorStop(1, 'rgba(22, 163, 74, 0)');

      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Small droplet specks inside cloud
      ctx.fillStyle = `rgba(187, 247, 208, ${cloud.opacity * 0.8})`;
      ctx.beginPath();
      ctx.arc(cloud.x + (cloud.vx * 0.05), cloud.y + (cloud.vy * 0.05), 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // --- PROPS ---

  private static drawProps(ctx: CanvasRenderingContext2D, props: PhysicsProp[]) {
    // Draw puddles first on ground layer
    props.filter(p => p.type === 'puddle').forEach(prop => {
      ctx.save();
      ctx.translate(prop.x, prop.y);
      ctx.rotate(prop.rotation);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.45)'; // Milky puree puddle
      ctx.beginPath();
      ctx.ellipse(0, 0, prop.radius * 1.3, prop.radius * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shiny reflection streak
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.ellipse(-prop.radius * 0.3, -prop.radius * 0.2, prop.radius * 0.4, prop.radius * 0.15, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw solid props
    props.filter(p => p.type !== 'puddle').forEach((prop) => {
      ctx.save();
      ctx.translate(prop.x, prop.y);
      ctx.rotate(prop.rotation);

      if (prop.type === 'block') {
        // ABC Wooden Toy Block
        const size = prop.radius * 1.8;
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-size / 2, -size / 2, size, size);

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#d97706';
        ctx.strokeRect(-size / 2, -size / 2, size, size);

        // Letter engraving
        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 18px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(prop.label || 'A', 0, 1);
      } else if (prop.type === 'duck') {
        // Giant Bouncy Rubber Duck
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, prop.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ca8a04';
        ctx.stroke();

        // Duck beak
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(prop.radius * 0.6, 0, prop.radius * 0.35, -0.4, 0.4);
        ctx.lineTo(prop.radius * 1.1, 0);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(prop.radius * 0.3, -prop.radius * 0.3, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (prop.type === 'pin') {
        // Bowling Pin Skittle
        const r = prop.radius;
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();

        // Red neck stripes
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-r * 0.8, -r * 0.3, r * 1.6, r * 0.25);
        ctx.fillRect(-r * 0.8, r * 0.1, r * 1.6, r * 0.25);

        // Center dot
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (prop.type === 'beach_ball') {
        // Multi-colored Beach Ball
        const r = prop.radius;
        const colors = ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#ec4899', '#ffffff'];
        for (let i = 0; i < 6; i++) {
          const a1 = (i / 6) * Math.PI * 2;
          const a2 = ((i + 1) / 6) * Math.PI * 2;
          ctx.fillStyle = colors[i];
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, r, a1, a2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Center cap
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (prop.type === 'jack_box') {
        // Spring-loaded Jack-in-the-Box
        const s = prop.radius * 1.7;
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#be185d';
        ctx.strokeRect(-s / 2, -s / 2, s, s);

        // Harlequin diamonds
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.35);
        ctx.lineTo(s * 0.35, 0);
        ctx.lineTo(0, s * 0.35);
        ctx.lineTo(-s * 0.35, 0);
        ctx.closePath();
        ctx.fill();

        if (prop.isSpringing) {
          // Springing jester head popping out!
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -s * 1.1);
          ctx.stroke();

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(0, -s * 1.2, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#7c2d12';
          ctx.fillText('🎪', 0, -s * 1.15);
        } else {
          // Brass crank handle
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(s / 2, 0);
          ctx.lineTo(s / 2 + 8, -6);
          ctx.stroke();
        }
      } else if (prop.type === 'dumbbell') {
        // Heavy Cast-Iron Toddler Weight
        const w = prop.radius * 1.8;
        const h = prop.radius * 0.9;
        ctx.fillStyle = '#334155';
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#64748b';
        ctx.strokeRect(-w / 2, -h / 2, w, h);

        // Left & right weight plates
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-w / 2 - 6, -h * 0.9, 8, h * 1.8);
        ctx.fillRect(w / 2 - 2, -h * 0.9, 8, h * 1.8);

        // Weight engraving
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('15 LB', 0, 1);
      } else if (prop.type === 'train_car') {
        // Alphabet Toy Train Caboose
        const len = prop.radius * 2.1;
        const ht = prop.radius * 1.3;
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(-len / 2, -ht / 2, len, ht);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1d4ed8';
        ctx.strokeRect(-len / 2, -ht / 2, len, ht);

        // Caboose roof
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-len / 2 - 2, -ht / 2 - 5, len + 4, 6);

        // 4 Wooden wheels
        ctx.fillStyle = '#f59e0b';
        [-len * 0.32, len * 0.32].forEach(wx => {
          ctx.fillRect(wx - 4, -ht / 2 - 4, 8, 4);
          ctx.fillRect(wx - 4, ht / 2, 8, 4);
        });

        // Letter
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(prop.label || 'CHOO', 0, 1);
      } else if (prop.type === 'pacifier_mine') {
        // Electronic Toy Pressure Mine
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, 0, prop.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#94a3b8';
        ctx.stroke();

        // Pulsing LED center
        const pulse = Math.floor(Date.now() / 200) % 2 === 0;
        ctx.fillStyle = pulse ? '#ef4444' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, prop.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  // --- PROJECTILES ---

  private static drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
    projectiles.forEach((proj) => {
      ctx.save();
      ctx.translate(proj.x, proj.y);

      if (proj.type === 'rattle') {
        // Bouncing Baby Rattle Grenade
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
        ctx.fillStyle = proj.isReflected ? '#38bdf8' : '#f43f5e';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Rattle handle
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(0, proj.radius);
        ctx.lineTo(0, proj.radius + 10);
        ctx.stroke();

        // Fuse spark
        if (!proj.isReflected) {
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(0, -proj.radius, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (proj.type === 'pacifier') {
        // Flying Pacifier Bullet
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
        ctx.fill();

        // Ring
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (proj.type === 'plasma_bolt') {
        // Piercing Plasma Bolt
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  // --- ENEMIES (COUGHING BABIES) ---

  private static drawEnemies(ctx: CanvasRenderingContext2D, enemies: EnemyEntity[]) {
    enemies.forEach((enemy) => {
      if (enemy.hp <= 0) return;

      ctx.save();
      ctx.translate(enemy.x, enemy.y);

      // Flash when stunned or charging cough
      if (enemy.isStunned) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
      } else if (enemy.coughChargeTimer > 0) {
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 18;
      }

      // Rotate towards facing angle
      ctx.rotate(enemy.facingAngle);

      if (enemy.type === 'boss_grumpy') {
        // BOSS: The Diaper Duke of Discontent
        // Armored Mech Walker Base
        ctx.fillStyle = '#475569';
        ctx.fillRect(-enemy.radius * 0.9, -enemy.radius * 0.9, enemy.radius * 1.8, enemy.radius * 1.8);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.strokeRect(-enemy.radius * 0.9, -enemy.radius * 0.9, enemy.radius * 1.8, enemy.radius * 1.8);

        // Tread Wheels
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-enemy.radius * 1.1, -enemy.radius * 0.8, 12, enemy.radius * 1.6);
        ctx.fillRect(enemy.radius * 0.85, -enemy.radius * 0.8, 12, enemy.radius * 1.6);

        // Baby Head
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Crown
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(-16, -enemy.radius * 0.55);
        ctx.lineTo(-10, -enemy.radius * 0.85);
        ctx.lineTo(0, -enemy.radius * 0.65);
        ctx.lineTo(10, -enemy.radius * 0.85);
        ctx.lineTo(16, -enemy.radius * 0.55);
        ctx.closePath();
        ctx.fill();

        // Angry Eyebrows
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-12, -6);
        ctx.lineTo(-4, -2);
        ctx.moveTo(12, -6);
        ctx.lineTo(4, -2);
        ctx.stroke();

        // Pouting mouth / pacifier
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(0, 10, 7, 0, Math.PI * 2);
        ctx.fill();
      } else if (coughingBabyLoaded) {
        // High-Fidelity Coughing Baby Enemy Sprite
        ctx.save();
        const bSize = enemy.radius * 2.6;

        // Circular aura backing
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius * 1.05, 0, Math.PI * 2);
        ctx.fillStyle = enemy.coughChargeTimer > 0 
          ? 'rgba(34, 197, 94, 0.45)' 
          : (enemy.isStunned ? 'rgba(56, 189, 248, 0.35)' : 'rgba(15, 23, 42, 0.75)');
        ctx.fill();

        // Clip circular silhouette for game clarity
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius * 1.05, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(coughingBabyImg, -bSize * 0.5, -bSize * 0.5, bSize, bSize);
        ctx.restore();

        // Rim indicator ring
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius * 1.05, 0, Math.PI * 2);
        ctx.strokeStyle = enemy.coughChargeTimer > 0 
          ? '#4ade80' 
          : (enemy.isStunned ? '#38bdf8' : enemy.color);
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Cough charge warning indicator
        if (enemy.coughChargeTimer > 0) {
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(enemy.radius * 0.9, 0, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Fallback Vector Rendering
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(-enemy.radius * 0.35, 0, enemy.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = enemy.coughChargeTimer > 0 ? '#bbf7d0' : '#fed7aa';
        ctx.beginPath();
        ctx.arc(enemy.radius * 0.25, 0, enemy.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (enemy.coughChargeTimer > 0) {
          ctx.fillStyle = '#4ade80';
          ctx.beginPath();
          ctx.arc(enemy.radius * 0.45, -enemy.radius * 0.25, 6, 0, Math.PI * 2);
          ctx.arc(enemy.radius * 0.45, enemy.radius * 0.25, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(enemy.radius * 0.4, -6, 3, 0, Math.PI * 2);
        ctx.arc(enemy.radius * 0.4, 6, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.radius * 0.6, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Enemy Health Bar (Unboxed clean line over head)
      if (enemy.hp < enemy.maxHp) {
        ctx.save();
        const barW = enemy.radius * 2.2;
        const barH = 5;
        const barX = enemy.x - barW / 2;
        const barY = enemy.y - enemy.radius - 14;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(barX, barY, barW, barH);

        const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
        ctx.fillStyle = enemy.type === 'boss_grumpy' ? '#ef4444' : '#38bdf8';
        ctx.fillRect(barX, barY, barW * hpPct, barH);
        ctx.restore();
      }
    });
  }

  // --- PLAYER (GORILLA + FORK) ---

  private static drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, utensil: Utensil) {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Invulnerability blink
    if (player.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Dash trail dust
    if (player.isDashing) {
      ctx.save();
      ctx.rotate(player.facingAngle);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.fillRect(-player.radius * 1.5, -player.radius * 0.8, player.radius * 1.2, player.radius * 1.6);
      ctx.restore();
    }

    // Charged Whirlwind aura
    if (player.isWhirlwinding) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, utensil.reach * 1.3, 0, Math.PI * 2);
      ctx.strokeStyle = utensil.color;
      ctx.lineWidth = 6;
      ctx.shadowColor = utensil.color;
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.restore();
    }

    // Rotate gorilla body towards mouse cursor
    ctx.rotate(player.facingAngle);

    if (playerSpriteLoaded) {
      // High-Fidelity Custom Silverback Gorilla Sprite Model
      ctx.save();
      const spriteSize = player.radius * 3.0;
      // Draw circular backlight aura for crisp separation
      ctx.beginPath();
      ctx.arc(0, 0, player.radius * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = player.isDashing ? 'rgba(56, 189, 248, 0.4)' : 'rgba(15, 23, 42, 0.8)';
      ctx.fill();

      // Rounded clip for player sprite model
      ctx.beginPath();
      ctx.arc(0, 0, player.radius * 1.15, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        playerSpriteImg,
        -spriteSize * 0.5,
        -spriteSize * 0.5,
        spriteSize,
        spriteSize
      );
      ctx.restore();

      // Rim outline ring
      ctx.beginPath();
      ctx.arc(0, 0, player.radius * 1.15, 0, Math.PI * 2);
      ctx.strokeStyle = player.isDashing ? '#38bdf8' : 'rgba(203, 213, 225, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else {
      // 1. Muscular Gorilla Back / Torso Fallback
      ctx.fillStyle = '#1e293b'; // Slate black fur
      ctx.beginPath();
      ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // 2. Silverback Fur Patch on Shoulders
      ctx.fillStyle = '#94a3b8'; // Silver fur
      ctx.beginPath();
      ctx.arc(-player.radius * 0.3, 0, player.radius * 0.7, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.fill();

      // 3. Gorilla Arms & Massive Knuckles
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(player.radius * 0.4, -player.radius * 0.75, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(player.radius * 0.4, player.radius * 0.75, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // 4. Gorilla Head & Red Bandana
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(player.radius * 0.3, 0, player.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(player.radius * 0.1, -player.radius * 0.5, 9, player.radius);

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(player.radius * 0.5, -6, 3, 0, Math.PI * 2);
      ctx.arc(player.radius * 0.5, 6, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. THE UTENSIL (FORK / SPORK / TRIDENT)
    this.drawUtensilWeapon(ctx, player, utensil);

    ctx.restore();
  }

  private static drawUtensilWeapon(ctx: CanvasRenderingContext2D, player: PlayerState, utensil: Utensil) {
    ctx.save();

    // Utensil swing rotation calculation
    let swingAngleOffset = 0;
    if (player.isSwinging) {
      swingAngleOffset = (player.swingProgress - 0.5) * utensil.swingArc;
    } else {
      // Idle ready stance
      swingAngleOffset = 0.2;
    }

    ctx.translate(player.radius * 0.4, player.radius * 0.6);
    ctx.rotate(swingAngleOffset);

    const length = utensil.reach;
    const handleW = 6;

    // Utensil Swing Motion Trail Arc
    if (player.isSwinging) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, length, -utensil.swingArc * 0.5, utensil.swingArc * 0.5);
      ctx.strokeStyle = utensil.metallicGlow;
      ctx.lineWidth = 14;
      ctx.stroke();
      ctx.restore();
    }

    // Shaft / Handle
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, -handleW / 2, length * 0.65, handleW);

    // Tines Head / Blade
    ctx.save();
    ctx.translate(length * 0.65, 0);

    ctx.fillStyle = utensil.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    if (utensil.id === 'chefs_spatula') {
      // Wide spatula paddle
      ctx.fillRect(0, -18, length * 0.35, 36);
      ctx.strokeRect(0, -18, length * 0.35, 36);
      // Grille slots
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(6, -12, 16, 4);
      ctx.fillRect(6, -2, 16, 4);
      ctx.fillRect(6, 8, 16, 4);
    } else if (utensil.id === 'surgical_thermometer') {
      // Piercing needle probe
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(0, -2, length * 0.35, 4);
      // Digital gauge box
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-14, -8, 14, 16);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('103°', -12, 4);
    } else {
      // Standard Fork / Spork / Trident Tines
      const tinesCount = utensil.tines || 4;
      const tinesSpread = 24;
      const tinesLength = length * 0.35;

      // Base neck
      ctx.fillRect(0, -tinesSpread / 2, 8, tinesSpread);

      for (let t = 0; t < tinesCount; t++) {
        const ty = -tinesSpread / 2 + (t / (tinesCount - 1 || 1)) * tinesSpread;
        ctx.beginPath();
        ctx.moveTo(8, ty);
        ctx.lineTo(8 + tinesLength, ty);
        ctx.lineWidth = 3;
        ctx.strokeStyle = utensil.color;
        ctx.stroke();

        // Sharp tine point
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(8 + tinesLength, ty, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
    ctx.restore();
  }

  // --- VISUAL PARTICLES & TEXT ---

  private static drawVisualParticles(ctx: CanvasRenderingContext2D, particles: VisualParticle[]) {
    particles.forEach((part) => {
      ctx.save();
      ctx.globalAlpha = part.alpha;

      if (part.type === 'text') {
        ctx.font = 'bold 15px Outfit, sans-serif';
        ctx.fillStyle = part.color;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(part.text || '', part.x, part.y);
        ctx.fillText(part.text || '', part.x, part.y);
      } else if (part.type === 'ring') {
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size * (1 - part.life / part.maxLife), 0, Math.PI * 2);
        ctx.strokeStyle = part.color;
        ctx.lineWidth = 4;
        ctx.stroke();
      } else if (part.type === 'spark') {
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (part.type === 'puff') {
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size * (1 - part.life / part.maxLife * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }
}
