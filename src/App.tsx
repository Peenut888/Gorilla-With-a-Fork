import React, { useState, useEffect, useCallback } from 'react';
import { 
  GameState, 
  PlayerState, 
  UtensilId, 
  Utensil, 
  DungeonNode, 
  Perk, 
  EnemyEntity, 
  RunStats 
} from './types/game';
import { UTENSILS_CATALOG } from './game/utensils';
import { getRandomPerks, ALL_PERKS } from './game/perks';
import { generateFloorMap, FloorData } from './game/dungeon';
import { createRoomEnvironment } from './game/arenaSpawner';
import { RoomEnvironment } from './game/physics';
import { soundEngine } from './game/audio';
import { TopBar } from './components/TopBar';
import { TitleScreen } from './components/TitleScreen';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { MapModal } from './components/MapModal';
import { PerkModal } from './components/PerkModal';
import { UtensilArmoryModal } from './components/UtensilArmoryModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { GameOverModal } from './components/GameOverModal';

const INITIAL_PLAYER: PlayerState = {
  id: 'player_kongrad',
  x: 250,
  y: 340,
  vx: 0,
  vy: 0,
  radius: 26,
  mass: 3.2,
  restitution: 0.5,
  friction: 0.9,
  maxHp: 100,
  hp: 100,
  stamina: 100,
  facingAngle: 0,
  isDashing: false,
  dashCooldown: 0,
  dashTimer: 0,
  dashCharge: 0,
  invulnerableTimer: 0,
  swingProgress: 0,
  isSwinging: false,
  chargeTime: 0,
  isWhirlwinding: false,
  whirlwindTimer: 0,
  selectedUtensil: 'standard_fork',
  unlockedUtensils: ['standard_fork', 'gilded_salad_fork'],
  equippedPerks: [],
  rattlesCurrency: 15,
  kills: 0,
  highestImpact: 0,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [player, setPlayer] = useState<PlayerState>(() => {
    // Load persisted unlocks from localStorage if available
    try {
      const saved = localStorage.getItem('gorilla_fork_save');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_PLAYER,
          unlockedUtensils: parsed.unlockedUtensils || INITIAL_PLAYER.unlockedUtensils,
          selectedUtensil: parsed.selectedUtensil || INITIAL_PLAYER.selectedUtensil,
          rattlesCurrency: parsed.rattlesCurrency ?? 15,
        };
      }
    } catch {
      // ignore
    }
    return INITIAL_PLAYER;
  });

  const [floorData, setFloorData] = useState<FloorData>(() => generateFloorMap(1));
  const [currentNodeId, setCurrentNodeId] = useState<string>('f1_0_0');
  const [env, setEnv] = useState<RoomEnvironment>(() =>
    createRoomEnvironment(1024, 680, 1, 'COMBAT')
  );

  const [availablePerks, setAvailablePerks] = useState<Perk[]>([]);
  const [showArmory, setShowArmory] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);

  const [runStats, setRunStats] = useState<RunStats>({
    floor: 1,
    roomCount: 0,
    babiesDefeated: 0,
    rattlesSwatted: 0,
    maxKineticImpact: 0,
    damageDealt: 0,
    damageTaken: 0,
    runDurationSeconds: 0,
    victory: false,
  });

  // Save progression to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        'gorilla_fork_save',
        JSON.stringify({
          unlockedUtensils: player.unlockedUtensils,
          selectedUtensil: player.selectedUtensil,
          rattlesCurrency: player.rattlesCurrency,
        })
      );
    } catch {
      // ignore
    }
  }, [player.unlockedUtensils, player.selectedUtensil, player.rattlesCurrency]);

  const equippedUtensil = UTENSILS_CATALOG[player.selectedUtensil] || UTENSILS_CATALOG.standard_fork;

  // Toggle Sound & Music
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.setSoundEnabled(next);
  };

  const handleToggleMusic = () => {
    const next = !musicEnabled;
    setMusicEnabled(next);
    soundEngine.setMusicEnabled(next);
  };

  // Start Brand New Run
  const startNewRun = useCallback(() => {
    const fData = generateFloorMap(1);
    setFloorData(fData);
    setCurrentNodeId(fData.startNodeId);

    const initialRoom = createRoomEnvironment(1024, 680, 1, 'COMBAT');
    setEnv(initialRoom);

    setPlayer(prev => ({
      ...prev,
      x: 250,
      y: 340,
      vx: 0,
      vy: 0,
      hp: prev.maxHp,
      equippedPerks: [],
      kills: 0,
      highestImpact: 0,
      isDashing: false,
      dashCooldown: 0,
      isSwinging: false,
      isWhirlwinding: false,
    }));

    setRunStats({
      floor: 1,
      roomCount: 1,
      babiesDefeated: 0,
      rattlesSwatted: 0,
      maxKineticImpact: 0,
      damageDealt: 0,
      damageTaken: 0,
      runDurationSeconds: 0,
      victory: false,
    });

    setGameState('PLAYING');
    if (musicEnabled) {
      soundEngine.startMusic();
    }
  }, [musicEnabled]);

  // Handle enemy killed in physics engine
  const handleEnemyKilled = useCallback((enemy: EnemyEntity, scoreReward: number) => {
    const bonusRattles = enemy.type === 'boss_grumpy' ? 25 : (enemy.type === 'crybaby_banshee' ? 5 : 2);
    setPlayer(prev => ({
      ...prev,
      kills: prev.kills + 1,
      rattlesCurrency: prev.rattlesCurrency + bonusRattles,
    }));

    setRunStats(prev => ({
      ...prev,
      babiesDefeated: prev.babiesDefeated + 1,
      maxKineticImpact: Math.max(prev.maxKineticImpact, player.highestImpact),
    }));

    soundEngine.playCoin();
  }, [player.highestImpact]);

  // Handle player taking damage
  const handlePlayerHit = useCallback((damage: number) => {
    setRunStats(prev => ({
      ...prev,
      damageTaken: prev.damageTaken + damage,
    }));
  }, []);

  // Handle room cleared event
  const handleRoomCleared = useCallback(() => {
    const currentNode = floorData.nodes.find(n => n.id === currentNodeId);
    if (currentNode) {
      currentNode.cleared = true;
    }

    if (currentNode?.type === 'BOSS') {
      if (floorData.floorNumber >= 4) {
        // Run completed!
        setRunStats(prev => ({ ...prev, victory: true }));
        setGameState('VICTORY');
        soundEngine.playVictoryFanfare();
        return;
      } else {
        // Advance to next floor!
        const nextFloorNum = floorData.floorNumber + 1;
        const nextFloor = generateFloorMap(nextFloorNum);
        setFloorData(nextFloor);
        setCurrentNodeId(nextFloor.startNodeId);
        setRunStats(prev => ({ ...prev, floor: nextFloorNum }));
        soundEngine.playVictoryFanfare();
      }
    }

    // Trigger perk choice if combat or elite
    if (currentNode?.type === 'COMBAT' || currentNode?.type === 'ELITE' || currentNode?.type === 'BOSS') {
      const excluded = player.equippedPerks.map(p => p.id);
      const perkOptions = getRandomPerks(3, excluded);
      setAvailablePerks(perkOptions);
      setGameState('PERK_CHOICE');
    } else {
      setGameState('MAP_SELECT');
    }
  }, [floorData, currentNodeId, player.equippedPerks]);

  // Handle Player Death
  const handlePlayerDeath = useCallback(() => {
    // Check if player has "Second Wind Nap"
    const hasNap = player.equippedPerks.some(p => p.id === 'adrenaline_diaper_clash');
    if (hasNap) {
      // Consume perk and revive!
      setPlayer(prev => ({
        ...prev,
        hp: Math.round(prev.maxHp * 0.5),
        invulnerableTimer: 2.0,
        equippedPerks: prev.equippedPerks.filter(p => p.id !== 'adrenaline_diaper_clash'),
      }));
      soundEngine.playExplosion();
      setEnv(prev => ({ ...prev, cameraShake: 18 }));
      return;
    }

    soundEngine.playGameOver();
    setRunStats(prev => ({ ...prev, victory: false }));
    setGameState('GAME_OVER');
  }, [player.equippedPerks]);

  // Handle selecting a perk
  const handleSelectPerk = (perk: Perk) => {
    perk.effect(player);
    setPlayer(prev => ({
      ...prev,
      isWhirlwinding: false,
      chargeTime: 0,
      isSwinging: false,
      isDashing: false,
      vx: 0,
      vy: 0,
      equippedPerks: [...prev.equippedPerks, perk],
    }));
    soundEngine.playDeflect();
    setGameState('MAP_SELECT');
  };

  // Handle selecting next node on map
  const handleSelectNode = (node: DungeonNode) => {
    setCurrentNodeId(node.id);

    if (node.type === 'REST') {
      // Rest crib power nap
      setPlayer(prev => ({
        ...prev,
        hp: Math.min(prev.maxHp, prev.hp + 45),
      }));
      node.cleared = true;
      soundEngine.playCoin();
      setGameState('MAP_SELECT');
      return;
    }

    if (node.type === 'CHEST') {
      // Stash of rattle trophies
      setPlayer(prev => ({
        ...prev,
        rattlesCurrency: prev.rattlesCurrency + 30,
      }));
      node.cleared = true;
      soundEngine.playCoin();
      // Also grant a perk!
      const excluded = player.equippedPerks.map(p => p.id);
      setAvailablePerks(getRandomPerks(3, excluded));
      setGameState('PERK_CHOICE');
      return;
    }

    if (node.type === 'SHOP') {
      // Open armory to spend currency
      node.cleared = true;
      setShowArmory(true);
      return;
    }

    // Spawn Room Environment for Combat/Elite/Boss
    const newRoom = createRoomEnvironment(1024, 680, floorData.floorNumber, node.type);
    setEnv(newRoom);
    setPlayer(prev => ({
      ...prev,
      x: 160,
      y: 340,
      vx: 0,
      vy: 0,
    }));

    setRunStats(prev => ({ ...prev, roomCount: prev.roomCount + 1 }));
    setGameState('PLAYING');
  };

  // Utensil Unlocking & Equipping
  const handleSelectUtensil = (id: UtensilId) => {
    setPlayer(prev => ({ ...prev, selectedUtensil: id }));
    soundEngine.playMetalClang(false);
  };

  const handleUnlockUtensil = (id: UtensilId, cost: number) => {
    if (player.rattlesCurrency >= cost && !player.unlockedUtensils.includes(id)) {
      setPlayer(prev => ({
        ...prev,
        rattlesCurrency: prev.rattlesCurrency - cost,
        unlockedUtensils: [...prev.unlockedUtensils, id],
        selectedUtensil: id,
      }));
      soundEngine.playCoin();
    }
  };

  const currentNode = floorData.nodes.find(n => n.id === currentNodeId);

  return (
    <div className="relative w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* Top Bar (Follows Top Bar Contract) */}
      <TopBar
        gameState={gameState}
        onNavigate={(target) => {
          if (target === 'ARMORY') setShowArmory(true);
          else if (target === 'HOW_TO_PLAY') setShowHowToPlay(true);
          else if (target === 'MAP_SELECT') setGameState('MAP_SELECT');
          else setGameState(target);
        }}
        onStartNewRun={startNewRun}
        soundEnabled={soundEnabled}
        musicEnabled={musicEnabled}
        onToggleSound={handleToggleSound}
        onToggleMusic={handleToggleMusic}
      />

      {/* Main View Area */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {gameState === 'TITLE_MENU' && (
          <TitleScreen
            onStartGame={startNewRun}
            onOpenArmory={() => setShowArmory(true)}
            onOpenHowToPlay={() => setShowHowToPlay(true)}
            rattlesCurrency={player.rattlesCurrency}
            equippedUtensil={equippedUtensil}
          />
        )}

        {(gameState === 'PLAYING' || gameState === 'PERK_CHOICE' || gameState === 'MAP_SELECT') && (
          <div className="relative w-full h-full flex items-center justify-center">
            <GameCanvas
              player={player}
              env={env}
              utensil={equippedUtensil}
              floorTheme={floorData.theme}
              isPaused={gameState !== 'PLAYING'}
              onEnemyKilled={handleEnemyKilled}
              onPlayerHit={handlePlayerHit}
              onRoomCleared={handleRoomCleared}
              onPlayerDeath={handlePlayerDeath}
            />

            <HUD
              player={player}
              utensil={equippedUtensil}
              floorNumber={floorData.floorNumber}
              floorName={floorData.name}
              roomTitle={currentNode?.title || 'Arena'}
              roomCleared={env.roomCleared}
              onOpenMap={() => setGameState('MAP_SELECT')}
              onOpenArmory={() => setShowArmory(true)}
            />
          </div>
        )}
      </main>

      {/* Modals & Overlays */}
      {gameState === 'MAP_SELECT' && (
        <MapModal
          floorNumber={floorData.floorNumber}
          floorName={floorData.name}
          floorDescription={floorData.description}
          nodes={floorData.nodes}
          currentNodeId={currentNodeId}
          onSelectNode={handleSelectNode}
          onClose={() => setGameState('PLAYING')}
          canClose={env.roomCleared}
        />
      )}

      {gameState === 'PERK_CHOICE' && (
        <PerkModal
          perks={availablePerks}
          onSelectPerk={handleSelectPerk}
          onSkip={() => setGameState('MAP_SELECT')}
        />
      )}

      {showArmory && (
        <UtensilArmoryModal
          currentUtensilId={player.selectedUtensil}
          unlockedUtensilIds={player.unlockedUtensils}
          rattlesCurrency={player.rattlesCurrency}
          onSelectUtensil={handleSelectUtensil}
          onUnlockUtensil={handleUnlockUtensil}
          onClose={() => setShowArmory(false)}
        />
      )}

      {showHowToPlay && (
        <HowToPlayModal
          onClose={() => setShowHowToPlay(false)}
        />
      )}

      {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && (
        <GameOverModal
          stats={runStats}
          rattlesCurrency={player.rattlesCurrency}
          onPlayAgain={startNewRun}
          onOpenArmory={() => {
            setShowArmory(true);
            setGameState('TITLE_MENU');
          }}
        />
      )}
    </div>
  );
}
