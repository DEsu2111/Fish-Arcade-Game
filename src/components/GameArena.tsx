/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useMemo } from "react";
import { Player, Fish, Bullet, GameParticle, WeaponType, DatabaseState, AuditLog } from "../types";
import { Coins, Flame, Shield, Zap, Sparkles, MessageSquare, Volume2, VolumeX } from "lucide-react";

interface GameArenaProps {
  config: DatabaseState;
  updateConfig: (updater: (prev: DatabaseState) => DatabaseState) => void;
  addLog: (category: AuditLog["category"], message: string, severity: AuditLog["severity"]) => void;
  incrementFishCaptured: (name: string, payout: number) => void;
  userBalance: number;
  setUserBalance: (updater: number | ((prev: number) => number)) => void;
}

export default function GameArena({
  config,
  updateConfig,
  addLog,
  incrementFishCaptured,
  userBalance,
  setUserBalance,
}: GameArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Immersive physical 3D Cabinet Simulator mode matching uploaded photo
  const [isCabinetMode, setIsCabinetMode] = useState(true);

  // Visual button flash states for the cabinet mockup
  const [cabinetButtonFlashes, setCabinetButtonFlashes] = useState<{ [key: string]: boolean }>({});

  // Coin drop animation visual feedback state
  const [coinDropFeedback, setCoinDropFeedback] = useState(false);

  // Freeze Screen state
  const [freezeTimer, setFreezeTimer] = useState(0);

  // Wave Rush event state
  const [waveRushTimer, setWaveRushTimer] = useState(0);

  // Round system states
  const [currentRound, setCurrentRound] = useState(1);
  const [roundTimeLeft, setRoundTimeLeft] = useState(45);
  const [bestRoundScore, setBestRoundScore] = useState(8500);
  const [roundHistory, setRoundHistory] = useState<{ round: number; winnerName: string; winnerGain: number; color?: string }[]>([]);
  const [roundStartCoins, setRoundStartCoins] = useState<number[]>([userBalance, 4500, 12000, 8500, 6000, 9500]);
  const [roundWinnerAnnouncement, setRoundWinnerAnnouncement] = useState<{
    round: number;
    winnerName: string;
    winnerGain: number;
    show: boolean;
  } | null>(null);

  // Refs for high performance loop thread synchronization
  const currentRoundRef = useRef(1);
  const roundTimeLeftRef = useRef(45);
  const bestRoundScoreRef = useRef(8500);
  const roundWinnerAnnouncementRef = useRef<{
    round: number;
    winnerName: string;
    winnerGain: number;
    show: boolean;
    timer: number;
  } | null>(null);
  const roundStartCoinsRef = useRef<number[]>([userBalance, 4500, 12000, 8500, 6000, 9500]);

  // Active weapon type for user
  const [activeWeapon, setActiveWeapon] = useState<WeaponType>(WeaponType.STANDARD);

  // Cannon levels for active slots
  const [playerBet, setPlayerBet] = useState(10); // user bet level

  // Local game states to keep loop performance high
  const playersRef = useRef<Player[]>([
    {
      id: "user",
      name: "Player 1 (You)",
      coins: userBalance,
      netWorth: userBalance,
      level: 12,
      gunLevel: 10,
      weaponType: WeaponType.STANDARD,
      isBot: false,
      ping: 28,
      connected: true,
      score: 0,
      shootsCount: 0,
      hitCount: 0,
      color: "#10b981", // Emerald
      angle: -Math.PI / 2,
    },
    {
      id: "bot_1",
      name: "MegaHunter_Bot",
      coins: 4500,
      netWorth: 4500,
      level: 25,
      gunLevel: 15,
      weaponType: WeaponType.STANDARD,
      isBot: true,
      ping: 45,
      connected: true,
      score: 0,
      shootsCount: 0,
      hitCount: 0,
      color: "#3b82f6", // Blue
      angle: -Math.PI / 4,
    },
    {
      id: "bot_2",
      name: "Cabinet_Seat_3",
      coins: 12000,
      netWorth: 12000,
      level: 42,
      gunLevel: 30,
      weaponType: WeaponType.STANDARD,
      isBot: true,
      ping: 12,
      connected: true,
      score: 0,
      shootsCount: 0,
      hitCount: 0,
      color: "#eab308", // Yellow
      angle: Math.PI / 4,
    },
    {
      id: "bot_3",
      name: "VIP_OceanLord",
      coins: 8500,
      netWorth: 8500,
      level: 18,
      gunLevel: 12,
      weaponType: WeaponType.STANDARD,
      isBot: true,
      ping: 68,
      connected: true,
      score: 0,
      shootsCount: 0,
      hitCount: 0,
      color: "#a855f7", // Purple
      angle: Math.PI / 2,
    },
    {
      id: "bot_4",
      name: "NeonSlayer",
      coins: 6000,
      netWorth: 6000,
      level: 33,
      gunLevel: 20,
      weaponType: WeaponType.STANDARD,
      isBot: true,
      ping: 36,
      connected: true,
      score: 0,
      shootsCount: 0,
      hitCount: 0,
      color: "#ec4899", // Rose Pink
      angle: -3 * Math.PI / 4,
    },
    {
      id: "bot_5",
      name: "Apex_Predator",
      coins: 9500,
      netWorth: 9500,
      level: 50,
      gunLevel: 45,
      weaponType: WeaponType.STANDARD,
      isBot: true,
      ping: 24,
      connected: true,
      score: 0,
      shootsCount: 0,
      hitCount: 0,
      color: "#06b6d4", // Cyan
      angle: Math.PI / 2,
    },
  ]);

  const bulletsRef = useRef<Bullet[]>([]);
  const fishRef = useRef<Fish[]>([]);
  const particlesRef = useRef<GameParticle[]>([]);
  const botTargetsRef = useRef<{ [key: string]: string }>({});

  // Track target endpoints to draw laser guides or assist locking
  const [mousePos, setMousePos] = useState({ x: 400, y: 300 });

  // Sync React state for User's local HUD from playersRef
  const [hudStats, setHudStats] = useState({
    coins: userBalance,
    score: 0,
    shoots: 0,
    hits: 0,
    botCoins: [4500, 12000, 8500, 6000, 9500],
    botNames: ["MegaHunter_Bot", "Cabinet_Seat_3", "VIP_OceanLord", "NeonSlayer", "Apex_Predator"],
    botEmotes: ["", "", "", "", ""],
  });

  // Emotes list for quick triggering
  const EMOTES = ["🔥", "💰", "💥", "🎯", "👑", "🍀", "GG"];

  const triggerUserEmote = (emote: string) => {
    playersRef.current[0].lastEmote = emote;
    playersRef.current[0].emoteTimer = 90; // stay on screen for 90 frames (3 seconds)
    addLog("SYSTEM", `Player 1 sent reaction emote: ${emote}`, "info");

    // Randomize a bot responding
    setTimeout(() => {
      const responderIdx = Math.floor(Math.random() * 5) + 1;
      const botEmotes = ["💥", "👑", "🔥", "🤑", "🎯"];
      const botEmote = botEmotes[Math.floor(Math.random() * botEmotes.length)];
      if (playersRef.current[responderIdx]) {
        playersRef.current[responderIdx].lastEmote = botEmote;
        playersRef.current[responderIdx].emoteTimer = 90;
      }
    }, 1200);
  };

  // Helper to trigger synth sound effects using Web Audio API
  const playSynthSound = (type: "shoot" | "hit" | "capture" | "boss" | "freeze" | "explosion" | "coin_drop") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "shoot") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "coin_drop") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
        osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.15); // D6
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "hit") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === "capture") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.08);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "boss") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === "freeze") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === "explosion") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // AudioContext failed
    }
  };

  // Sync userBalance with React prop updates
  useEffect(() => {
    playersRef.current[0].coins = userBalance;
  }, [userBalance]);

  // Handle active weapons / skins
  const handleWeaponChange = (type: WeaponType) => {
    setActiveWeapon(type);
    playersRef.current[0].weaponType = type;
    addLog("SYSTEM", `Player 1 calibrated cannon to: ${type} technology.`, "info");
  };

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let spawnTimer = 0;
    let frameCount = 0;
    let shakeTimer = 0;
    let shakeIntensity = 0;

    // Snapshot starting coins of players on mount
    const startCoinsSnapshot = playersRef.current.map((p) => p.coins);
    roundStartCoinsRef.current = startCoinsSnapshot;
    setRoundStartCoins(startCoinsSnapshot);

    function triggerRoundEnd() {
      const currentCoins = playersRef.current.map((p) => p.coins);
      const gains = currentCoins.map((coins, i) => {
        const startCoins = roundStartCoinsRef.current[i] || 0;
        return Math.max(0, coins - startCoins);
      });

      // Find winner with highest gain
      let winnerIdx = 0;
      let maxGain = 0;
      for (let i = 0; i < gains.length; i++) {
        if (gains[i] > maxGain) {
          maxGain = gains[i];
          winnerIdx = i;
        }
      }

      const winnerPlayer = playersRef.current[winnerIdx];
      const winnerName = winnerPlayer ? winnerPlayer.name : "Player 1 (You)";
      const finalWinnerGain = maxGain > 0 ? maxGain : Math.floor(Math.random() * 1500 + 500);

      const completedRound = currentRoundRef.current;

      if (finalWinnerGain > bestRoundScoreRef.current) {
        bestRoundScoreRef.current = finalWinnerGain;
        setBestRoundScore(finalWinnerGain);
        addLog("SYSTEM", `🎉 NEW ALL-TIME RECORD: ${winnerName} won $${finalWinnerGain.toLocaleString()} in Round ${completedRound}!`, "warning");
      } else {
        addLog("SYSTEM", `Round ${completedRound} Complete. Champion: ${winnerName} with $${finalWinnerGain.toLocaleString()} earnings.`, "info");
      }

      playSynthSound("capture");

      const announcement = {
        round: completedRound,
        winnerName: winnerName,
        winnerGain: finalWinnerGain,
        show: true,
        timer: 180, // 3 seconds at 60fps
      };
      roundWinnerAnnouncementRef.current = announcement;
      setRoundWinnerAnnouncement(announcement);

      setRoundHistory((prev) => [
        ...prev,
        { 
          round: completedRound, 
          winnerName: winnerName, 
          winnerGain: finalWinnerGain,
          color: winnerPlayer ? winnerPlayer.color : "#10b981"
        },
      ]);

      fishRef.current = [];
    }

    const triggerShake = (intensity: number, duration: number) => {
      shakeIntensity = intensity;
      shakeTimer = duration;
    };

    // Handle initial sizing
    const handleResize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      canvas.width = rect?.width || 800;
      canvas.height = rect?.height || 500;
    };
    handleResize();

    const resizeObserver = new ResizeObserver(() => handleResize());
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    // Initial spawn
    for (let i = 0; i < 8; i++) {
      spawnFish(canvas.width, canvas.height, false);
    }

    // Spawn fish logic
    function spawnFish(width: number, height: number, forceBoss = false) {
      const types = [
        { type: "clownfish", name: "Vibrant Coral Clownfish", size: 48, hp: 8, value: 2, speed: 1.3, color: "#f97316" }, // Orange-White banded
        { type: "goldfish", name: "Glittering Amber Goldfish", size: 38, hp: 6, value: 3, speed: 1.8, color: "#f59e0b" }, // Golden Gradient
        { type: "tang", name: "Royal Sapphire Tang", size: 52, hp: 15, value: 8, speed: 1.6, color: "#2563eb" }, // Blue-Yellow Sapphire
        { type: "firefish", name: "Vibrant Neon Ruby Firefish", size: 56, hp: 20, value: 12, speed: 2.1, color: "#db2777" }, // Deep Hot Pink/Red
        { type: "jellyfish", name: "Luminous Nebula Jellyfish", size: 64, hp: 30, value: 15, speed: 0.7, color: "#a855f7" }, // Pulsing Violet/Indigo
        { type: "puffer", name: "Neon Glowing Emerald Puffer", size: 58, hp: 25, value: 10, speed: 0.9, color: "#10b981" }, // Spiky Neon Green
        { type: "swordfish", name: "Razor Neon Swordfish", size: 84, hp: 50, value: 30, speed: 2.4, color: "#06b6d4" }, // Metallic Cyan-Silver
        { type: "shark", name: "Cybersteel Overlord Shark", size: 115, hp: 140, value: 80, speed: 1.1, color: "#475569" }, // Sleek Slate-Azure
        { type: "toad", name: "Golden Mythical Fortune Toad", size: 130, hp: 300, value: 200, speed: 0.9, color: "#fbbf24" }, // Golden Amber with coin
        { type: "sunfish", name: "Cosmic Rainbow Sunfish", size: 150, hp: 450, value: 350, speed: 0.5, color: "#ec4899" }, // Rainbow horizontal gradient
      ];

      const bossTypes = [
        { type: "kraken", name: "DEEP SEA KRAKEN BOSS [x500]", size: 240, hp: 1200, value: 500, speed: 0.4, color: "#f43f5e" }, // Hot Rose Red
        { type: "dragon", name: "GOLDEN DRAGON KING BOSS [x1000]", size: 310, hp: 2500, value: 1000, speed: 0.35, color: "#fbbf24" }, // Pure Gold Serpentine
      ];

      const isBoss = forceBoss || (Math.random() < 0.015 && fishRef.current.filter((f) => f.isBoss).length === 0);
      const chosen = isBoss 
        ? bossTypes[Math.floor(Math.random() * bossTypes.length)] 
        : types[Math.floor(Math.random() * types.length)];

      const spawnFromLeft = Math.random() < 0.5;
      const startX = spawnFromLeft ? -chosen.size : width + chosen.size;
      const startY = Math.random() * (height - 150) + 75;

      const patterns: ("straight" | "sinewave" | "coswave" | "circle" | "spiral" | "zigzag")[] = [
        "straight", "sinewave", "coswave"
      ];
      if (!isBoss) {
        patterns.push("circle", "zigzag");
      }

      const fish: Fish = {
        id: `f_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type: chosen.type,
        name: chosen.name,
        x: startX,
        y: startY,
        vx: (spawnFromLeft ? 1 : -1) * chosen.speed,
        vy: (Math.random() - 0.5) * 0.5,
        width: chosen.size,
        height: chosen.size * 0.6,
        speed: chosen.speed,
        hp: chosen.hp,
        maxHp: chosen.hp,
        scoreValue: chosen.value,
        pattern: patterns[Math.floor(Math.random() * patterns.length)],
        angle: 0,
        pathTime: Math.random() * 100,
        shieldActive: isBoss && Math.random() < 0.4,
        isBoss: isBoss,
        scale: isBoss ? 1.4 : 1.0,
        color: chosen.color,
        isDying: false,
        deathProgress: 0,
        specialTrigger: Math.random() < 0.08 ? (Math.random() < 0.5 ? "freeze" : "bomb") : undefined,
      };

      fishRef.current.push(fish);

      if (isBoss) {
        playSynthSound("boss");
        addLog("SPAWNER", `ALERT: Legendary Boss [${chosen.name}] has entered the battlefield! Mult: ${chosen.value}x.`, "critical");
      }
    }

    // Bot Auto Shooters
    function runBotsLogic(width: number, height: number) {
      playersRef.current.forEach((player, idx) => {
        if (!player.isBot) return;

        // Decrease bot emotes timers
        if (player.emoteTimer && player.emoteTimer > 0) {
          player.emoteTimer--;
          if (player.emoteTimer === 0) player.lastEmote = "";
        }

        // Check if bot wallet is empty, recharge
        if (player.coins < 100) {
          player.coins += 2500;
          addLog("ECONOMY", `Regulating Bot liquidity: [${player.name}] wallet automatically replenished +2500 coins.`, "info");
        }

        // Randomly send emotes
        if (Math.random() < 0.001 && !player.lastEmote) {
          const emotes = ["🔥", "👑", "🎯", "🍀", "GG", "💎", "💪"];
          player.lastEmote = emotes[Math.floor(Math.random() * emotes.length)];
          player.emoteTimer = 90;
        }

        // Rotate Cannon towards some active fish
        if (fishRef.current.length > 0) {
          let target: Fish | undefined;

          // Intelligently select target based on Bot personality index:
          if (idx === 1) {
            // Bot 1: "Boss Hunter" - Targets highest HP / highest value
            const bosses = fishRef.current.filter((f) => f.isBoss && !f.isDying);
            if (bosses.length > 0) {
              target = bosses[0];
            } else {
              // target highest score value fish
              target = fishRef.current.reduce((max, current) => 
                (!current.isDying && current.scoreValue > max.scoreValue) ? current : max
              , fishRef.current[0]);
            }
            // Higher bet level for boss hunter
            player.gunLevel = bosses.length > 0 ? 100 : 50;
            player.weaponType = bosses.length > 0 ? WeaponType.LASER : WeaponType.STANDARD;
          } 
          else if (idx === 2) {
            // Bot 2: "Kill Stealer" - Targets the active fish with the lowest HP
            const activeFish = fishRef.current.filter((f) => !f.isDying);
            if (activeFish.length > 0) {
              target = activeFish.reduce((min, current) => 
                (current.hp < min.hp) ? current : min
              , activeFish[0]);
            }
            player.gunLevel = 20;
            player.weaponType = WeaponType.DRILL;
          } 
          else if (idx === 4) {
            // Bot 4: "Quick Fire" - Targets any closest active fish and spams rapidly
            target = fishRef.current.find((f) => !f.isDying);
            player.gunLevel = 10;
            player.weaponType = WeaponType.STANDARD;
          }
          else if (idx === 5) {
            // Bot 5: "Heavy Cannoneer" - Targets highest HP fish, slow but extremely heavy laser
            const heavyFish = fishRef.current.filter((f) => f.hp > 60 && !f.isDying);
            if (heavyFish.length > 0) {
              target = heavyFish[0];
            } else {
              target = fishRef.current.find((f) => !f.isDying);
            }
            player.gunLevel = 150;
            player.weaponType = WeaponType.LASER;
          }
          else {
            // Bot 3: "VIP Ocean Lord / Tactician" - Targets special freeze/bomb, or closest fish
            const specials = fishRef.current.filter((f) => f.specialTrigger && !f.isDying);
            if (specials.length > 0) {
              target = specials[0];
            } else {
              target = fishRef.current.find((f) => !f.isDying);
            }
            player.gunLevel = 30;
            player.weaponType = WeaponType.STANDARD;
          }

          // Clear target if dying
          if (target && target.isDying) {
            target = undefined;
          }

          if (target) {
            // Store target ID for the laser sight line render
            botTargetsRef.current[player.id] = target.id;

            let canonX = 0;
            let canonY = 0;

            // Anchor locations for all 6 seats:
            if (idx === 0) { // Bottom-Middle
              canonX = width / 2;
              canonY = height - 20;
            } else if (idx === 1) { // Bottom-Right
              canonX = width - 150;
              canonY = height - 20;
            } else if (idx === 2) { // Top-Left
              canonX = 150;
              canonY = 20;
            } else if (idx === 3) { // Top-Right
              canonX = width - 150;
              canonY = 20;
            } else if (idx === 4) { // Bottom-Left
              canonX = 150;
              canonY = height - 20;
            } else if (idx === 5) { // Top-Middle
              canonX = width / 2;
              canonY = 20;
            }

            const dx = target.x - canonX;
            const dy = target.y - canonY;
            const targetAngle = Math.atan2(dy, dx);

            // Interpolate rotation smoothly (faster for kill-stealer)
            const rotSpeed = idx === 2 ? 0.25 : 0.15;
            player.angle += (targetAngle - player.angle) * rotSpeed;

            // Fire bullet with random chance
            let fireChance = 0.08;
            if (idx === 4) fireChance = 0.16; // Quick Fire fires twice as fast!
            if (idx === 5) fireChance = 0.04; // Heavy Cannoneer fires slower but heavier!
            if (target.isBoss) fireChance = Math.min(0.24, fireChance * 1.8); // fire faster at bosses!
            if (idx === 2 && target.hp < 25) fireChance = 0.22; // spam fires if close to stealing kill!

            if (Math.random() < fireChance) {
              const bId = `b_bot_${idx}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
              const bSpeed = 8;
              const vx = Math.cos(player.angle) * bSpeed;
              const vy = Math.sin(player.angle) * bSpeed;

              // Deduct coin
              player.coins -= player.gunLevel;
              player.shootsCount++;

              // Increment Server Turnover
              updateConfig((prev) => ({
                ...prev,
                totalIncome: prev.totalIncome + player.gunLevel,
                jackpotPool: prev.jackpotPool + player.gunLevel * 0.04,
              }));

              const bullet: Bullet = {
                id: bId,
                playerId: player.id,
                x: canonX + Math.cos(player.angle) * 35,
                y: canonY + Math.sin(player.angle) * 35,
                vx: vx,
                vy: vy,
                angle: player.angle,
                damage: player.gunLevel,
                level: player.gunLevel,
                type: player.weaponType,
                color: player.color,
                bounces: 0,
              };

              bulletsRef.current.push(bullet);
              if (soundEnabled && idx === 1 && Math.random() < 0.2) {
                playSynthSound("shoot");
              }
            }
          } else {
            botTargetsRef.current[player.id] = "";
          }
        } else {
          botTargetsRef.current[player.id] = "";
        }
      });
    }

    // Particle Burst spawner
    function createParticles(
      x: number,
      y: number,
      color: string,
      count: number,
      type: GameParticle["type"],
      text?: string,
      targetX?: number,
      targetY?: number
    ) {
      if (type === "text" && text) {
        particlesRef.current.push({
          id: `p_txt_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          x: x,
          y: y - 10,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -1.6, // float up speed
          color: color,
          size: 14,
          life: 0,
          maxLife: 60,
          type: "text",
          text: text,
        });
        return;
      }

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        particlesRef.current.push({
          id: `p_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (type === "coin" ? 1.5 : 0), // coins float up slightly
          color: color,
          size: type === "coin" ? Math.random() * 4 + 4 : Math.random() * 3 + 2,
          life: 0,
          maxLife: type === "coin" ? 65 : Math.random() * 20 + 20,
          type: type,
          targetX: targetX,
          targetY: targetY,
        });
      }
    }

    let lastSecondTime = Date.now();

    // Main Engine Tick & Drawing
    const tick = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Handle active round transitions
      if (roundWinnerAnnouncementRef.current && roundWinnerAnnouncementRef.current.show) {
        roundWinnerAnnouncementRef.current.timer--;
        if (roundWinnerAnnouncementRef.current.timer <= 0) {
          const nextRound = currentRoundRef.current + 1;
          currentRoundRef.current = nextRound;
          setCurrentRound(nextRound);
          
          roundTimeLeftRef.current = 45;
          setRoundTimeLeft(45);
          
          roundWinnerAnnouncementRef.current = null;
          setRoundWinnerAnnouncement(null);

          const snapshot = playersRef.current.map((p) => p.coins);
          roundStartCoinsRef.current = snapshot;
          setRoundStartCoins(snapshot);

          addLog("SYSTEM", `🚀 Round ${nextRound} begins! Spawning new deep sea migration streams!`, "info");
          playSynthSound("boss");
        }
      }

      // Check for second transition
      const now = Date.now();
      if (now - lastSecondTime >= 1000) {
        lastSecondTime = now;
        
        // Count down round timer if we are not currently transitioning
        if (!roundWinnerAnnouncementRef.current || !roundWinnerAnnouncementRef.current.show) {
          if (roundTimeLeftRef.current > 0) {
            roundTimeLeftRef.current--;
            setRoundTimeLeft(roundTimeLeftRef.current);
            
            if (roundTimeLeftRef.current <= 5 && roundTimeLeftRef.current > 0) {
              playSynthSound("hit"); // slight tick beep
            }

            if (roundTimeLeftRef.current === 0) {
              triggerRoundEnd();
            }
          }
        }
      }

      // Calculate screen-shake offsets
      let shakeX = 0;
      let shakeY = 0;
      if (shakeTimer > 0) {
        shakeTimer--;
        shakeX = (Math.random() - 0.5) * shakeIntensity;
        shakeY = (Math.random() - 0.5) * shakeIntensity;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // 1. Draw Deep Sea Ambient Background
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#082f49"); // Deep Slate Blue
      grad.addColorStop(1, "#020617"); // Dark Midnight Blue
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Undersea Shimmering God Rays (Light Rays)
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 4; i++) {
        const angle = Math.sin(frameCount * 0.007 + i * 1.6) * 0.12;
        const rayWidth = 95 + Math.sin(frameCount * 0.015 + i) * 25;
        const startX = (canvas.width / 5) * (i + 1) + Math.cos(frameCount * 0.008 + i) * 50;

        const rayGrad = ctx.createLinearGradient(startX, 0, startX + Math.sin(angle) * canvas.height, canvas.height);
        rayGrad.addColorStop(0, "rgba(56, 189, 248, 0.12)"); // sky blue neon tint
        rayGrad.addColorStop(0.5, "rgba(16, 185, 129, 0.04)"); // subtle emerald tint
        rayGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(startX - rayWidth / 2, 0);
        ctx.lineTo(startX + rayWidth / 2, 0);
        ctx.lineTo(startX + Math.sin(angle) * canvas.height + rayWidth, canvas.height);
        ctx.lineTo(startX + Math.sin(angle) * canvas.height - rayWidth, canvas.height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Background decorative ripples or grids
      ctx.strokeStyle = "rgba(16, 185, 129, 0.03)";
      ctx.lineWidth = 1;
      const gridSize = 80;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 2. Manage Timers
      if (freezeTimer > 0) {
        setFreezeTimer((prev) => Math.max(0, prev - 1));
      }

      // Spawner interval management
      if (!roundWinnerAnnouncementRef.current || !roundWinnerAnnouncementRef.current.show) {
        spawnTimer += 1 * config.spawnRateModifier;
        if (spawnTimer >= 100) {
          spawnTimer = 0;
          if (fishRef.current.length < 24) {
            spawnFish(canvas.width, canvas.height);
          }
        }
      }

      // Decrement User's Emote Timer
      if (playersRef.current[0].emoteTimer && playersRef.current[0].emoteTimer > 0) {
        playersRef.current[0].emoteTimer--;
        if (playersRef.current[0].emoteTimer === 0) playersRef.current[0].lastEmote = "";
      }

      // 3. Update & Draw Fish
      fishRef.current.forEach((fish) => {
        if (fish.isDying) {
          fish.deathProgress += 0.05;
          ctx.save();
          ctx.translate(fish.x, fish.y);
          ctx.rotate(fish.angle);
          ctx.scale(fish.scale * (1 + fish.deathProgress * 0.5), fish.scale * (1 + fish.deathProgress * 0.5));
          ctx.fillStyle = fish.color;
          ctx.globalAlpha = 1 - fish.deathProgress;

          // Render dying bubble outline
          ctx.beginPath();
          ctx.arc(0, 0, fish.width * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
          return;
        }

        // Apply path math if not frozen
        if (freezeTimer === 0) {
          fish.pathTime += 0.01 * fish.speed;

          // Parametric Splines & Trigonometry equations
          if (fish.pattern === "sinewave") {
            fish.y += Math.sin(fish.pathTime * 3) * 1.5;
          } else if (fish.pattern === "coswave") {
            fish.y += Math.cos(fish.pathTime * 2) * 2.0;
          } else if (fish.pattern === "circle") {
            fish.x += Math.cos(fish.pathTime) * fish.speed;
            fish.y += Math.sin(fish.pathTime) * fish.speed;
          } else if (fish.pattern === "zigzag") {
            if (Math.floor(fish.pathTime * 10) % 20 === 0) {
              fish.vy = -fish.vy;
            }
          }

          fish.x += fish.vx;
          fish.y += fish.vy;

          // Keep orientation angle pointing forward
          fish.angle = Math.atan2(fish.vy, fish.vx);
        }

        // Draw Fish Sprite (Procedural High Fidelity Canvas)
        ctx.save();
        ctx.translate(fish.x, fish.y);
        ctx.rotate(fish.angle);
        ctx.scale(fish.scale, fish.scale);

        // Body Shadow
        ctx.shadowBlur = 12;
        ctx.shadowColor = fish.color;

        // Custom designs per species
        if (fish.type === "clownfish") {
          // 1. Clownfish: Bright orange with distinctive vertical white/black stripes
          ctx.fillStyle = fish.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, fish.width * 0.5, fish.height * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Draw White stripes with black borders
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.5;

          // Stripe 1 (Middle)
          ctx.beginPath();
          ctx.ellipse(-fish.width * 0.05, 0, fish.width * 0.08, fish.height * 0.48, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Stripe 2 (Rear)
          ctx.beginPath();
          ctx.ellipse(-fish.width * 0.25, 0, fish.width * 0.06, fish.height * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Waving Tail Fin
          ctx.save();
          const tailWave = Math.sin(fish.pathTime * 8) * 0.12;
          ctx.rotate(tailWave);
          ctx.beginPath();
          ctx.moveTo(-fish.width * 0.45, 0);
          ctx.lineTo(-fish.width * 0.75, -fish.height * 0.35);
          ctx.quadraticCurveTo(-fish.width * 0.6, 0, -fish.width * 0.75, fish.height * 0.35);
          ctx.closePath();
          ctx.fillStyle = fish.color;
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();

          // Fins on top/bottom
          ctx.fillStyle = fish.color;
          ctx.beginPath();
          ctx.ellipse(0, -fish.height * 0.45, fish.width * 0.15, fish.height * 0.12, Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Big Cute Eye
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(fish.width * 0.25, -fish.height * 0.12, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#000000";
          ctx.beginPath();
          ctx.arc(fish.width * 0.28, -fish.height * 0.12, 2.5, 0, Math.PI * 2);
          ctx.fill();

        } else if (fish.type === "goldfish") {
          // 2. Goldfish: Shimmering amber golden gradient, double flowing tail
          const grad = ctx.createLinearGradient(-fish.width * 0.5, 0, fish.width * 0.5, 0);
          grad.addColorStop(0, "#fb923c"); // Orange-light
          grad.addColorStop(0.5, "#f59e0b"); // Golden
          grad.addColorStop(1, "#fbbf24"); // Yellow gold
          ctx.fillStyle = grad;

          ctx.beginPath();
          ctx.ellipse(0, 0, fish.width * 0.5, fish.height * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();

          // Waving flowing double-tail
          ctx.save();
          const tWave1 = Math.sin(fish.pathTime * 6) * 12;
          const tWave2 = Math.cos(fish.pathTime * 6) * 10;
          ctx.fillStyle = "rgba(251, 146, 60, 0.65)";
          
          // Tail 1
          ctx.beginPath();
          ctx.moveTo(-fish.width * 0.45, -5);
          ctx.quadraticCurveTo(-fish.width * 0.7, -fish.height * 0.6 + tWave1, -fish.width * 0.9, -fish.height * 0.5 + tWave1);
          ctx.quadraticCurveTo(-fish.width * 0.75, tWave1, -fish.width * 0.45, 0);
          ctx.closePath();
          ctx.fill();

          // Tail 2
          ctx.beginPath();
          ctx.moveTo(-fish.width * 0.45, 5);
          ctx.quadraticCurveTo(-fish.width * 0.7, fish.height * 0.6 + tWave2, -fish.width * 0.9, fish.height * 0.5 + tWave2);
          ctx.quadraticCurveTo(-fish.width * 0.75, tWave2, -fish.width * 0.45, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Big bubbly eye
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(fish.width * 0.24, -fish.height * 0.15, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#1e293b";
          ctx.beginPath();
          ctx.arc(fish.width * 0.26, -fish.height * 0.15, 3.5, 0, Math.PI * 2);
          ctx.fill();

        } else if (fish.type === "tang") {
          // 3. Royal Sapphire Tang: Deep royal blue, brilliant yellow markings & tail
          ctx.fillStyle = "#2563eb"; // Blue body
          ctx.beginPath();
          ctx.ellipse(0, 0, fish.width * 0.5, fish.height * 0.52, 0, 0, Math.PI * 2);
          ctx.fill();

          // Black wave tribal stripe on side
          ctx.strokeStyle = "#1e293b";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(fish.width * 0.15, -fish.height * 0.2);
          ctx.bezierCurveTo(-fish.width * 0.1, -fish.height * 0.4, -fish.width * 0.3, -fish.height * 0.1, -fish.width * 0.4, -fish.height * 0.2);
          ctx.stroke();

          // Yellow tail fin
          ctx.save();
          const tailAngle = Math.sin(fish.pathTime * 7) * 0.1;
          ctx.rotate(tailAngle);
          ctx.fillStyle = "#fbbf24"; // Bright yellow
          ctx.beginPath();
          ctx.moveTo(-fish.width * 0.45, 0);
          ctx.lineTo(-fish.width * 0.8, -fish.height * 0.4);
          ctx.lineTo(-fish.width * 0.65, 0);
          ctx.lineTo(-fish.width * 0.8, fish.height * 0.4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Yellow dorsal fin highlight
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.ellipse(-fish.width * 0.15, -fish.height * 0.48, fish.width * 0.2, fish.height * 0.1, Math.PI / 8, 0, Math.PI * 2);
          ctx.fill();

          // Eye
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(fish.width * 0.25, -fish.height * 0.15, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#000000";
          ctx.beginPath();
          ctx.arc(fish.width * 0.28, -fish.height * 0.15, 2.2, 0, Math.PI * 2);
          ctx.fill();

        } else if (fish.type === "firefish") {
          // 4. Neon Firefish: Magenta-to-orange gradient body, long dorsal filament fin
          const fGrad = ctx.createLinearGradient(-fish.width * 0.5, 0, fish.width * 0.5, 0);
          fGrad.addColorStop(0, "#fb7185"); // Light pink
          fGrad.addColorStop(0.4, "#ec4899"); // Magenta pink
          fGrad.addColorStop(1, "#e11d48"); // Deep ruby red
          ctx.fillStyle = fGrad;

          ctx.beginPath();
          ctx.ellipse(0, 0, fish.width * 0.5, fish.height * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();

          // Long flowing filament dorsal fin (Unique firefish trademark)
          ctx.save();
          const dWave = Math.sin(fish.pathTime * 5) * 8;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(fish.width * 0.1, -fish.height * 0.35);
          ctx.quadraticCurveTo(-fish.width * 0.2 + dWave, -fish.height * 1.5, -fish.width * 0.5 + dWave, -fish.height * 1.2);
          ctx.stroke();
          ctx.restore();

          // Wavy red-orange tail fin
          ctx.save();
          const fWave = Math.sin(fish.pathTime * 8) * 0.15;
          ctx.rotate(fWave);
          ctx.fillStyle = "#f43f5e";
          ctx.beginPath();
          ctx.moveTo(-fish.width * 0.45, 0);
          ctx.lineTo(-fish.width * 0.82, -fish.height * 0.45);
          ctx.lineTo(-fish.width * 0.68, 0);
          ctx.lineTo(-fish.width * 0.82, fish.height * 0.45);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Glow spot
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(fish.width * 0.28, -fish.height * 0.12, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#0f172a";
          ctx.beginPath();
          ctx.arc(fish.width * 0.3, -fish.height * 0.12, 1.8, 0, Math.PI * 2);
          ctx.fill();

        } else if (fish.type === "jellyfish") {
          // 5. Nebula Jellyfish: Pulsing translucent cap, long waving tentacles
          const pulse = 1 + Math.sin(fish.pathTime * 4) * 0.12;
          const capW = fish.width * 0.4 * pulse;
          const capH = fish.height * 0.45 * pulse;

          // Tentacles waving using sine waves
          ctx.save();
          ctx.strokeStyle = "rgba(168, 85, 247, 0.45)"; // Translucent purple
          ctx.lineWidth = 2;
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            const yOffset = -capH * 0.3 + (i * capH * 0.2);
            ctx.moveTo(-capW * 0.5, yOffset);
            
            // Draw custom waving path for tentacle
            let lastX = -capW * 0.5;
            let lastY = yOffset;
            const segs = 6;
            const length = fish.width * 0.65;
            for (let j = 0; j <= segs; j++) {
              const x = -capW * 0.5 - (j * (length / segs));
              const y = yOffset + Math.sin(fish.pathTime * 4 + j * 0.8 + i) * 12;
              ctx.quadraticCurveTo(lastX, lastY, (lastX + x)/2, (lastY + y)/2);
              lastX = x;
              lastY = y;
            }
            ctx.stroke();
          }
          ctx.restore();

          // Drawing glowing translucent jelly cap
          const capGrad = ctx.createRadialGradient(-capW * 0.2, -capH * 0.2, 2, 0, 0, capW * 0.9);
          capGrad.addColorStop(0, "#ffffff");
          capGrad.addColorStop(0.3, "#c084fc"); // Lilac
          capGrad.addColorStop(1, "rgba(168, 85, 247, 0.2)");
          ctx.fillStyle = capGrad;

          ctx.beginPath();
          // Arc for the half dome
          ctx.arc(0, 0, capW, -Math.PI / 2, Math.PI / 2, false);
          ctx.closePath();
          ctx.fill();

          // Cap rim dots
          ctx.fillStyle = "#ffffff";
          for (let i = -3; i <= 3; i++) {
            const angle = (i * Math.PI) / 8;
            ctx.beginPath();
            ctx.arc(capW * Math.cos(angle), capW * Math.sin(angle), 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

        } else if (fish.type === "puffer") {
          // 6. Emerald Puffer: Round, spike-textured spiky emerald green body
          ctx.fillStyle = "#10b981"; // Emerald
          ctx.beginPath();
          ctx.arc(0, 0, fish.width * 0.42, 0, Math.PI * 2);
          ctx.fill();

          // Draw neon spikes pointing outward
          ctx.strokeStyle = "#34d399";
          ctx.lineWidth = 2.5;
          const spikeCount = 12;
          const outerR = fish.width * 0.52;
          const innerR = fish.width * 0.42;
          for (let i = 0; i < spikeCount; i++) {
            const angle = (i * Math.PI * 2) / spikeCount;
            ctx.beginPath();
            ctx.moveTo(innerR * Math.cos(angle), innerR * Math.sin(angle));
            ctx.lineTo(outerR * Math.cos(angle), outerR * Math.sin(angle));
            ctx.stroke();
          }

          // Small cute flapping fins
          ctx.fillStyle = "#34d399";
          ctx.beginPath();
          ctx.ellipse(-fish.width * 0.2, -fish.height * 0.3, fish.width * 0.12, fish.height * 0.08, -Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();

          // Big cute cartoon eyes
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(fish.width * 0.18, -fish.height * 0.14, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#1e293b";
          ctx.beginPath();
          ctx.arc(fish.width * 0.22, -fish.height * 0.14, 3, 0, Math.PI * 2);
          ctx.fill();

        } else if (fish.type === "swordfish") {
          // 7. Razor Neon Swordfish: Streamlined metallic cyan, huge sailfin, long sword beak
          const sGrad = ctx.createLinearGradient(-fish.width * 0.5, 0, fish.width * 0.5, 0);
          sGrad.addColorStop(0, "#0891b2"); // Dark Cyan
          sGrad.addColorStop(0.6, "#22d3ee"); // Neon Cyan
          sGrad.addColorStop(1, "#e2e8f0"); // Metallic silver tip
          ctx.fillStyle = sGrad;

          ctx.beginPath();
          ctx.ellipse(0, 0, fish.width * 0.5, fish.height * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();

          // Long sharp sword spear
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(fish.width * 0.48, -fish.height * 0.05);
          ctx.lineTo(fish.width * 0.95, -fish.height * 0.08); // Sword pointing forward
          ctx.stroke();

          // High-contrast large sail dorsal fin on back
          ctx.fillStyle = "#0284c7"; // Sky Blue
          ctx.beginPath();
          ctx.moveTo(-fish.width * 0.2, -fish.height * 0.38);
          ctx.quadraticCurveTo(-fish.width * 0.05, -fish.height * 1.1, fish.width * 0.2, -fish.height * 0.3);
          ctx.lineTo(-fish.width * 0.05, -fish.height * 0.3);
          ctx.closePath();
          ctx.fill();

          // Waving swordfish tail
          ctx.save();
          const sWave = Math.sin(fish.pathTime * 9) * 0.18;
          ctx.rotate(sWave);
          ctx.fillStyle = "#0369a1";
          ctx.beginPath();
          ctx.moveTo(-fish.width * 0.45, 0);
          ctx.lineTo(-fish.width * 0.78, -fish.height * 0.55);
          ctx.lineTo(-fish.width * 0.62, 0);
          ctx.lineTo(-fish.width * 0.78, fish.height * 0.55);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Eye
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(fish.width * 0.25, -fish.height * 0.12, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#000000";
          ctx.beginPath();
          ctx.arc(fish.width * 0.27, -fish.height * 0.12, 1.8, 0, Math.PI * 2);
          ctx.fill();

        } else if (fish.type === "shark") {
          // 8. Cybersteel Overlord Shark: Huge steel gray/blue, neon blue patterns, sharp teeth
          ctx.fillStyle = "#475569"; // Slate gray body
          ctx.beginPath();
          ctx.ellipse(0, 0, fish.width * 0.5, fish.height * 0.46, 0, 0, Math.PI * 2);
          ctx.fill();

          // White belly
          ctx.fillStyle = "#cbd5e1"; // light slate
          ctx.beginPath();
          ctx.ellipse(0, fish.height * 0.18, fish.width * 0.4, fish.height * 0.24, 0, 0, Math.PI * 2);
          ctx.fill();

          // Neon blue bioluminescent tech stripes
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-fish.width * 0.1, -fish.height * 0.25);
          ctx.lineTo(fish.width * 0.05, -fish.height * 0.1);
          ctx.moveTo(-fish.width * 0.22, -fish.height * 0.2);
          ctx.lineTo(-fish.width * 0.08, -fish.height * 0.05);
          ctx.stroke();

          // Large sharp shark dorsal fin
          ctx.fillStyle = "#334155";
          ctx.beginPath();
          ctx.moveTo(-fish.width * 0.15, -fish.height * 0.4);
          ctx.quadraticCurveTo(-fish.width * 0.05, -fish.height * 1.05, fish.width * 0.12, -fish.height * 0.35);
          ctx.closePath();
          ctx.fill();

          // Powerful shark tail swishing
          ctx.save();
          const shWave = Math.sin(fish.pathTime * 5) * 0.12;
          ctx.rotate(shWave);
          ctx.fillStyle = "#334155";
          ctx.beginPath();
          ctx.moveTo(-fish.width * 0.48, 0);
          ctx.lineTo(-fish.width * 0.8, -fish.height * 0.6);
          ctx.lineTo(-fish.width * 0.65, 0);
          ctx.lineTo(-fish.width * 0.8, fish.height * 0.6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Angry shark eye
          ctx.fillStyle = "#ef4444"; // Red eye
          ctx.beginPath();
          ctx.moveTo(fish.width * 0.22, -fish.height * 0.18);
          ctx.lineTo(fish.width * 0.32, -fish.height * 0.12);
          ctx.lineTo(fish.width * 0.22, -fish.height * 0.08);
          ctx.closePath();
          ctx.fill();

          // Razor teeth lines
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(fish.width * 0.25, fish.height * 0.08);
          ctx.lineTo(fish.width * 0.35, fish.height * 0.06);
          ctx.lineTo(fish.width * 0.28, fish.height * 0.12);
          ctx.stroke();

        } else if (fish.type === "toad") {
          // 9. Fortune Toad: Golden-amber body, huge red gemstone eyes, hovering rotating golden coin
          ctx.fillStyle = "#fbbf24"; // Rich gold
          ctx.beginPath();
          ctx.ellipse(0, 0, fish.width * 0.5, fish.height * 0.65, 0, 0, Math.PI * 2);
          ctx.fill();

          // Green/red bumpy spots
          ctx.fillStyle = "#f59e0b";
          ctx.beginPath();
          ctx.arc(-fish.width * 0.15, -fish.height * 0.25, 4, 0, Math.PI * 2);
          ctx.arc(fish.width * 0.02, -fish.height * 0.3, 5, 0, Math.PI * 2);
          ctx.arc(-fish.width * 0.28, -fish.height * 0.1, 4, 0, Math.PI * 2);
          ctx.fill();

          // Huge red glowing eyes
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(fish.width * 0.26, -fish.height * 0.22, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#000000";
          ctx.beginPath();
          ctx.arc(fish.width * 0.28, -fish.height * 0.22, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Hovering golden Chinese cash coin rotating slightly
          ctx.save();
          const coinRotate = fish.pathTime * 2;
          ctx.translate(-fish.width * 0.05, -fish.height * 0.3);
          ctx.rotate(coinRotate);
          
          ctx.fillStyle = "#fbbf24";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Square center hole of coin
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(-4, -4, 8, 8);
          ctx.restore();

        } else if (fish.type === "sunfish") {
          // 10. Cosmic Rainbow Sunfish: Huge tall disc, glowing shifting rainbow spectrum gradient
          const rGrad = ctx.createLinearGradient(-fish.width * 0.5, 0, fish.width * 0.5, 0);
          rGrad.addColorStop(0, "#f43f5e"); // Rose Red
          rGrad.addColorStop(0.2, "#f59e0b"); // Yellow Gold
          rGrad.addColorStop(0.4, "#10b981"); // Emerald Green
          rGrad.addColorStop(0.6, "#06b6d4"); // Cyan Blue
          rGrad.addColorStop(0.8, "#6366f1"); // Indigo
          rGrad.addColorStop(1, "#ec4899"); // Magenta
          ctx.fillStyle = rGrad;

          ctx.beginPath();
          // Extremely tall oval body (typical sunfish profile)
          ctx.ellipse(0, 0, fish.width * 0.5, fish.height * 0.72, 0, 0, Math.PI * 2);
          ctx.fill();

          // High top and bottom fins waggling
          ctx.save();
          const finWag = Math.sin(fish.pathTime * 3) * 0.2;
          
          // Dorsal fin
          ctx.fillStyle = "#6366f1";
          ctx.beginPath();
          ctx.moveTo(-fish.width * 0.15, -fish.height * 0.6);
          ctx.quadraticCurveTo(-fish.width * 0.2 + finWag * 15, -fish.height * 1.3, fish.width * 0.05, -fish.height * 0.6);
          ctx.closePath();
          ctx.fill();

          // Ventral fin
          ctx.fillStyle = "#ec4899";
          ctx.beginPath();
          ctx.moveTo(-fish.width * 0.15, fish.height * 0.6);
          ctx.quadraticCurveTo(-fish.width * 0.2 + finWag * 15, fish.height * 1.3, fish.width * 0.05, fish.height * 0.6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Scalloped rear rudder margin
          ctx.fillStyle = "#cbd5e1";
          ctx.beginPath();
          ctx.ellipse(-fish.width * 0.45, 0, fish.width * 0.12, fish.height * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();

          // Giant fish eye
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(fish.width * 0.25, -fish.height * 0.15, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#0f172a";
          ctx.beginPath();
          ctx.arc(fish.width * 0.27, -fish.height * 0.15, 3, 0, Math.PI * 2);
          ctx.fill();

        } else if (fish.type === "kraken" && fish.isBoss) {
          // 11. DEEP SEA KRAKEN BOSS: Huge rose-pink head, piercing yellow eyes, 6 dynamic sinewave tentacles
          ctx.fillStyle = "#f43f5e"; // Rose Pink
          ctx.beginPath();
          // Massive oval head bulbous
          ctx.ellipse(0, 0, fish.width * 0.42, fish.height * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();

          // Two big piercing yellow glowing eyes with slit pupils
          ctx.fillStyle = "#fbbf24"; // yellow glow
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#eab308";
          ctx.beginPath();
          ctx.arc(fish.width * 0.14, -fish.height * 0.14, 10, 0, Math.PI * 2);
          ctx.arc(fish.width * 0.14, fish.height * 0.14, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset shadow

          ctx.fillStyle = "#000000"; // slit pupil
          ctx.fillRect(fish.width * 0.12, -fish.height * 0.18, 3.5, 9);
          ctx.fillRect(fish.width * 0.12, fish.height * 0.10, 3.5, 9);

          // 6 active, procedural tentacles that wave around trailing behind
          ctx.save();
          ctx.strokeStyle = "#e11d48"; // deeper rose red
          ctx.lineWidth = 6;
          for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            const yOffset = -fish.height * 0.3 + (i * fish.height * 0.12);
            ctx.moveTo(-fish.width * 0.22, yOffset);
            
            let lastX = -fish.width * 0.22;
            let lastY = yOffset;
            const segments = 8;
            const tLength = fish.width * 0.65;
            for (let j = 0; j <= segments; j++) {
              const x = -fish.width * 0.22 - (j * (tLength / segments));
              const y = yOffset + Math.sin(fish.pathTime * 3 + j * 0.7 + i * 1.5) * 35;
              ctx.lineTo(x, y);
              
              // Draw small white suction cup dots periodically on tentacles
              if (j > 1 && j % 2 === 0) {
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(x, y + 4, 3, 0, Math.PI * 2);
                ctx.fill();
              }
              lastX = x;
              lastY = y;
            }
            ctx.stroke();
          }
          ctx.restore();

        } else if (fish.type === "dragon" && fish.isBoss) {
          // 12. GOLDEN DRAGON KING BOSS: Segmented serpentine body waving in beautiful sinewaves
          ctx.save();
          const segments = 6;
          const diameter = fish.width * 0.18;
          ctx.fillStyle = "#fbbf24"; // Bright gold segments

          // Render waving trailing segmented dragon scales
          for (let i = segments; i >= 1; i--) {
            const scaleFactor = 1 - (i * 0.08);
            const lagTime = i * 0.4;
            const segmentX = -i * (fish.width * 0.13);
            const segmentY = Math.sin(fish.pathTime * 3.5 - lagTime) * 38;
            
            // Draw overlapping scale circle
            ctx.beginPath();
            ctx.arc(segmentX, segmentY, diameter * scaleFactor, 0, Math.PI * 2);
            ctx.fill();

            // Draw orange flame-scale accents
            ctx.fillStyle = "#f97316";
            ctx.beginPath();
            ctx.arc(segmentX - 4, segmentY - 4, (diameter * scaleFactor) * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fbbf24"; // revert
          }
          ctx.restore();

          // Majestic Dragon Head
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          // Draw head ellipse
          ctx.ellipse(0, 0, fish.width * 0.22, fish.height * 0.38, 0, 0, Math.PI * 2);
          ctx.fill();

          // Long golden whiskers
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(fish.width * 0.15, 0);
          ctx.bezierCurveTo(fish.width * 0.35, -fish.height * 0.3, fish.width * 0.42, fish.height * 0.2, fish.width * 0.55, -fish.height * 0.1);
          ctx.stroke();

          // Dragon horn spikes
          ctx.fillStyle = "#f97316";
          ctx.beginPath();
          ctx.moveTo(-fish.width * 0.1, -fish.height * 0.25);
          ctx.lineTo(-fish.width * 0.25, -fish.height * 0.55);
          ctx.lineTo(0, -fish.height * 0.3);
          ctx.closePath();
          ctx.fill();

          // Glowing neon crimson dragon eyes
          ctx.fillStyle = "#ef4444";
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#ef4444";
          ctx.beginPath();
          ctx.arc(fish.width * 0.08, -fish.height * 0.15, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset

        } else {
          // Fallback Standard fish rendering
          ctx.fillStyle = fish.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, fish.width * 0.5, fish.height * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Tail Fin
          ctx.beginPath();
          ctx.moveTo(-fish.width * 0.45, 0);
          ctx.lineTo(-fish.width * 0.75, -fish.height * 0.4);
          ctx.lineTo(-fish.width * 0.65, 0);
          ctx.lineTo(-fish.width * 0.75, fish.height * 0.4);
          ctx.closePath();
          ctx.fillStyle = fish.color;
          ctx.fill();

          // Eye
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(fish.width * 0.25, -fish.height * 0.15, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#000000";
          ctx.beginPath();
          ctx.arc(fish.width * 0.28, -fish.height * 0.15, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Active Shield Indicator
        if (fish.shieldActive) {
          ctx.strokeStyle = "rgba(56, 189, 248, 0.8)";
          ctx.lineWidth = 2;
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(0, 0, fish.width * 0.55, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw special bonus markers on back (Freeze or Bomb indicators)
        if (fish.specialTrigger) {
          ctx.fillStyle = fish.specialTrigger === "freeze" ? "#06b6d4" : "#ef4444";
          ctx.shadowColor = fish.specialTrigger === "freeze" ? "#06b6d4" : "#ef4444";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(-5, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 8px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(fish.specialTrigger === "freeze" ? "F" : "B", -5, 0);
        }

        ctx.restore();

        // Draw Near-Miss HP Bars for bosses or heavy items (psychology integration)
        if (fish.hp < fish.maxHp && fish.hp > 0) {
          const barW = fish.width;
          const barH = 4;
          const barX = fish.x - barW / 2;
          const barY = fish.y - fish.height / 2 - 12;

          ctx.fillStyle = "rgba(2, 6, 23, 0.6)";
          ctx.fillRect(barX, barY, barW, barH);

          const hpRatio = Math.max(0, fish.hp / fish.maxHp);
          ctx.fillStyle = hpRatio > 0.5 ? "#10b981" : hpRatio > 0.2 ? "#eab308" : "#ef4444";
          ctx.fillRect(barX, barY, barW * hpRatio, barH);
        }
      });

      // Filter out off-screen or dead fish
      fishRef.current = fishRef.current.filter((fish) => {
        if (fish.isDying && fish.deathProgress >= 1) return false;
        if (!fish.isDying) {
          const margin = fish.width * 2;
          if (fish.x < -margin || fish.x > canvas.width + margin || fish.y < -margin || fish.y > canvas.height + margin) {
            return false;
          }
        }
        return true;
      });

      // 4. Update & Draw Bullets
      bulletsRef.current.forEach((bullet) => {
        // Increment coordinate values
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // Bouncing logic off margins (Arcade King style)
        if (bullet.x <= 10 || bullet.x >= canvas.width - 10) {
          bullet.vx = -bullet.vx;
          bullet.bounces++;
          bullet.angle = Math.atan2(bullet.vy, bullet.vx);
        }
        if (bullet.y <= 10 || bullet.y >= canvas.height - 10) {
          bullet.vy = -bullet.vy;
          bullet.bounces++;
          bullet.angle = Math.atan2(bullet.vy, bullet.vx);
        }

        // Draw Bullet Skin depending on active power level
        ctx.save();
        ctx.translate(bullet.x, bullet.y);
        ctx.rotate(bullet.angle);

        ctx.shadowBlur = 8;
        ctx.shadowColor = bullet.color;

        // Specialized bullet styles
        if (bullet.type === WeaponType.LASER) {
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(-12, -2, 24, 4);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(-6, -1, 12, 2);
        } else if (bullet.type === WeaponType.DRILL) {
          ctx.fillStyle = "#eab308";
          ctx.beginPath();
          ctx.moveTo(10, 0);
          ctx.lineTo(-8, -5);
          ctx.lineTo(-8, 5);
          ctx.closePath();
          ctx.fill();
        } else if (bullet.type === WeaponType.BOMB) {
          ctx.fillStyle = "#a855f7";
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();
        } else {
          // Standard plasma bullet
          ctx.fillStyle = bullet.color;
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(1, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // Filter out highly-bounced bullets
      bulletsRef.current = bulletsRef.current.filter((b) => b.bounces < 4);

      // 5. Bot behaviors
      if (!roundWinnerAnnouncementRef.current || !roundWinnerAnnouncementRef.current.show) {
        runBotsLogic(canvas.width, canvas.height);
      }

      // 6. Collision Matrix & Reward Algorithm (O(N) grid-based evaluation)
      bulletsRef.current.forEach((bullet) => {
        fishRef.current.forEach((fish) => {
          if (fish.isDying) return;

          // Simple circular distance collision
          const dx = bullet.x - fish.x;
          const dy = bullet.y - fish.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const colRadius = (fish.width + fish.height) * 0.35;

          if (dist < colRadius + 6) {
            // Bullet Collided! Remove bullet immediately
            bullet.bounces = 99; // marks for removal

            // Hit effects
            createParticles(bullet.x, bullet.y, bullet.color, 4, "hit");
            if (Math.random() < 0.2) playSynthSound("hit");

            // Evaluate HP damage
            let damage = bullet.damage;
            if (bullet.type === WeaponType.LASER) damage *= 1.3; // extra damage skin
            if (bullet.type === WeaponType.DRILL) damage *= 1.5;

            fish.hp -= damage;

            // Update stats
            const shooter = playersRef.current.find((p) => p.id === bullet.playerId);
            if (shooter) {
              shooter.hitCount++;
            }

            if (fish.hp <= 0) {
              // Capture Achieved!
              fish.isDying = true;
              playSynthSound("capture");

              // Trigger screen-shake based on captured fish severity
              if (fish.isBoss) {
                triggerShake(8, 25);
              } else if (fish.scoreValue >= 50) {
                triggerShake(4, 12);
              } else {
                triggerShake(1.5, 6);
              }

              // Calculate shooter's physical console coordinates to guide flying coins
              let targetX = canvas.width / 2;
              let targetY = canvas.height - 20;
              if (shooter) {
                const sIdx = playersRef.current.indexOf(shooter);
                if (sIdx === 0) { // Bottom-Middle
                  targetX = canvas.width / 2;
                  targetY = canvas.height - 20;
                } else if (sIdx === 1) { // Bottom-Right
                  targetX = canvas.width - 150;
                  targetY = canvas.height - 20;
                } else if (sIdx === 2) { // Top-Left
                  targetX = 150;
                  targetY = 20;
                } else if (sIdx === 3) { // Top-Right
                  targetX = canvas.width - 150;
                  targetY = 20;
                } else if (sIdx === 4) { // Bottom-Left
                  targetX = 150;
                  targetY = canvas.height - 20;
                } else if (sIdx === 5) { // Top-Middle
                  targetX = canvas.width / 2;
                  targetY = 20;
                }
              }

              // Trigger special visual effect explosion
              createParticles(fish.x, fish.y, fish.color, fish.isBoss ? 40 : 15, "coin", undefined, targetX, targetY);

              const rewardCoins = fish.scoreValue * bullet.level;

              // Generate floating text particle showing the score value
              createParticles(fish.x, fish.y, "#fbbf24", 1, "text", `+$${rewardCoins.toLocaleString()}`);

              // Apply capturing reward to correct wallet
              if (shooter) {
                shooter.coins += rewardCoins;
                shooter.score += rewardCoins;

                if (shooter.id === "user") {
                  setUserBalance((prev) => prev + rewardCoins);
                  incrementFishCaptured(fish.name, rewardCoins);
                  addLog(
                    "ECONOMY",
                    `CAPTURE SUCCESS: Player 1 captured [${fish.name}] using Level ${bullet.level} Cannon. Credited +${rewardCoins} coins!`,
                    fish.isBoss ? "critical" : "info"
                  );
                } else {
                  // Bot captured it
                  incrementFishCaptured(fish.name, rewardCoins);
                  addLog(
                    "ECONOMY",
                    `CAPTURE SINK: Bot [${shooter.name}] captured [${fish.name}] (Value: ${fish.scoreValue}x) using Level ${bullet.level} Cannon. Credited +${rewardCoins} coins.`,
                    fish.isBoss ? "warning" : "info"
                  );
                }
              }

              // Update Total Server Payouts
              updateConfig((prev) => ({
                ...prev,
                totalPayout: prev.totalPayout + rewardCoins,
              }));

              // Handle Special Fish Powerup Triggers
              if (fish.specialTrigger === "freeze") {
                playSynthSound("freeze");
                setFreezeTimer(180); // 180 frames = 6 seconds freeze
                addLog("SYSTEM", "POWERUP TRIGGERED: Ice Jellyfish captured! Deep ocean completely FROZEN for 6 seconds.", "warning");
              } else if (fish.specialTrigger === "bomb") {
                playSynthSound("explosion");
                addLog("SYSTEM", "POWERUP TRIGGERED: Plasma Toad captured! Sweeping blast cleared nearby quadrants.", "warning");

                // Sweep and damage ALL other fish on screen
                fishRef.current.forEach((otherFish) => {
                  if (otherFish.id !== fish.id && !otherFish.isDying) {
                    otherFish.hp -= 80;
                    createParticles(otherFish.x, otherFish.y, "#ef4444", 6, "hit");
                  }
                });
              }
            }
          }
        });
      });

      // Filter out bullets flagged as bounced out or collided
      bulletsRef.current = bulletsRef.current.filter((b) => b.bounces < 90);

      // 7. Update & Draw Particles
      particlesRef.current.forEach((p) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        // Gravity/float effect or target attraction logic for coins
        if (p.type === "coin") {
          if (p.targetX !== undefined && p.targetY !== undefined) {
            if (p.life > 12) {
              // Gracefully accelerate towards player console anchor points!
              const dx = p.targetX - p.x;
              const dy = p.targetY - p.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 12) {
                const speed = Math.min(22, 1.5 + (p.life - 12) * 0.55);
                p.vx = (dx / dist) * speed;
                p.vy = (dy / dist) * speed;
              } else {
                p.life = p.maxLife; // reached station, disappear
              }
            } else {
              p.vy += 0.04; // initial gravity drift
            }
          } else {
            p.vy += 0.05; // slight falling gravity
          }
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.globalAlpha = 1 - p.life / p.maxLife;

        ctx.shadowBlur = p.type === "coin" ? 10 : 0;
        ctx.shadowColor = p.color;

        ctx.fillStyle = p.color;

        if (p.type === "coin") {
          // Coin Circle drawing with inner dollar border
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (p.type === "bubble") {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.type === "text" && p.text) {
          ctx.font = "bold 13px 'Space Grotesk', 'Inter', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.strokeStyle = "#020617";
          ctx.lineWidth = 3.5;
          ctx.strokeText(p.text, 0, 0);
          ctx.fillStyle = p.color;
          ctx.fillText(p.text, 0, 0);
        } else {
          // Spark or Hit marker
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // Filter dead particles
      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);

      // Ambient background bubble triggers
      if (Math.random() < 0.06) {
        particlesRef.current.push({
          id: `b_${Date.now()}`,
          x: Math.random() * canvas.width,
          y: canvas.height + 10,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -Math.random() * 1.5 - 0.5,
          color: "rgba(255, 255, 255, 0.1)",
          size: Math.random() * 3 + 3,
          life: 0,
          maxLife: 200,
          type: "bubble",
        });
      }

      // 7.5 Active Laser Sights & Lock-On Crosshair Reticles
      playersRef.current.forEach((player, idx) => {
        if (!player.connected) return;
        
        let anchorX = 0;
        let anchorY = 0;
        if (idx === 0) { // Bottom-Middle
          anchorX = canvas.width / 2;
          anchorY = canvas.height - 20;
        } else if (idx === 1) { // Bottom-Right
          anchorX = canvas.width - 150;
          anchorY = canvas.height - 20;
        } else if (idx === 2) { // Top-Left
          anchorX = 150;
          anchorY = 20;
        } else if (idx === 3) { // Top-Right
          anchorX = canvas.width - 150;
          anchorY = 20;
        } else if (idx === 4) { // Bottom-Left
          anchorX = 150;
          anchorY = canvas.height - 20;
        } else if (idx === 5) { // Top-Middle
          anchorX = canvas.width / 2;
          anchorY = 20;
        }

        let targetX = 0;
        let targetY = 0;
        let hasTarget = false;

        if (player.isBot) {
          const targetId = botTargetsRef.current[player.id];
          const targetFish = fishRef.current.find((f) => f.id === targetId && !f.isDying);
          if (targetFish) {
            targetX = targetFish.x;
            targetY = targetFish.y;
            hasTarget = true;
          }
        } else {
          // For the human player, show an elegant target line from the cannon to their cursor
          targetX = mousePos.x;
          targetY = mousePos.y;
          hasTarget = true;
        }

        if (hasTarget) {
          ctx.save();
          // Draw a beautiful thin glowing laser guide
          ctx.strokeStyle = player.color;
          ctx.globalAlpha = player.isBot ? 0.25 : 0.45;
          ctx.lineWidth = player.isBot ? 1 : 1.5;
          ctx.setLineDash([4, 6]);
          
          ctx.beginPath();
          ctx.moveTo(anchorX, anchorY);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();

          // Draw a small high-tech locking reticle at the target
          ctx.setLineDash([]);
          ctx.globalAlpha = player.isBot ? 0.45 : 0.85;
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = player.color;
          ctx.shadowBlur = player.isBot ? 4 : 8;
          ctx.shadowColor = player.color;
          
          ctx.beginPath();
          ctx.arc(targetX, targetY, player.isBot ? 18 : 22, 0, Math.PI * 2);
          ctx.stroke();

          // Draw reticle crosshair ticks
          ctx.beginPath();
          // Top tick
          ctx.moveTo(targetX, targetY - (player.isBot ? 24 : 28));
          ctx.lineTo(targetX, targetY - (player.isBot ? 12 : 14));
          // Bottom tick
          ctx.moveTo(targetX, targetY + (player.isBot ? 24 : 28));
          ctx.lineTo(targetX, targetY + (player.isBot ? 12 : 14));
          // Left tick
          ctx.moveTo(targetX - (player.isBot ? 24 : 28), targetY);
          ctx.lineTo(targetX - (player.isBot ? 12 : 14), targetY);
          // Right tick
          ctx.moveTo(targetX + (player.isBot ? 24 : 28), targetY);
          ctx.lineTo(targetX + (player.isBot ? 12 : 14), targetY);
          ctx.stroke();

          ctx.restore();
        }
      });

      // 8. Draw Player Cannons & HUD tags (Anchored around borders)
      playersRef.current.forEach((player, idx) => {
        let anchorX = 0;
        let anchorY = 0;

        // Seat layout:
        // Seat 0 (You): Bottom-Middle (width / 2, height - 20)
        // Seat 1: Bottom-Right (width - 150, height - 20)
        // Seat 2: Top-Left (150, 20)
        // Seat 3: Top-Right (width - 150, 20)
        // Seat 4: Bottom-Left (150, height - 20)
        // Seat 5: Top-Middle (width / 2, 20)
        if (idx === 0) {
          anchorX = canvas.width / 2;
          anchorY = canvas.height - 20;
        } else if (idx === 1) {
          anchorX = canvas.width - 150;
          anchorY = canvas.height - 20;
        } else if (idx === 2) {
          anchorX = 150;
          anchorY = 20;
        } else if (idx === 3) {
          anchorX = canvas.width - 150;
          anchorY = 20;
        } else if (idx === 4) {
          anchorX = 150;
          anchorY = canvas.height - 20;
        } else if (idx === 5) {
          anchorX = canvas.width / 2;
          anchorY = 20;
        }

        const isTop = idx === 2 || idx === 3 || idx === 5;

        // Draw HUD panel background card in Canvas
        ctx.save();
        ctx.translate(anchorX, anchorY);

        // Name & Balance Tag
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.strokeStyle = player.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-55, isTop ? 45 : -75, 110, 25, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          `${player.name}`,
          0,
          isTop ? 52 : -68
        );
        ctx.fillStyle = "#eab308";
        ctx.fillText(
          `$${player.coins.toLocaleString()}`,
          0,
          isTop ? 62 : -58
        );

        // Draw Cannon Base Rotator
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = player.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw Rotating Cannon Barrel
        ctx.save();
        ctx.rotate(player.angle);
        ctx.fillStyle = player.color;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;

        // Multi-barrel skin visual depending on Level/Skin
        if (player.id === "user" && activeWeapon !== WeaponType.STANDARD) {
          // Double glowing barrel skin for Special guns
          ctx.fillRect(0, -9, 32, 6);
          ctx.fillRect(0, 3, 32, 6);
          ctx.strokeRect(0, -9, 32, 6);
          ctx.strokeRect(0, 3, 32, 6);
        } else {
          // Standard single barrel
          ctx.fillRect(0, -6, 32, 12);
          ctx.strokeRect(0, -6, 32, 12);
        }
        ctx.restore();

        // Draw Reaction Emote if active
        if (player.lastEmote) {
          ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
          ctx.strokeStyle = "#eab308";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, isTop ? 90 : -100, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = "14px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(player.lastEmote, 0, isTop ? 90 : -100);
        }

        ctx.restore();
      });

      // 9. Overlay frozen screen tint (Ice particle filter)
      if (freezeTimer > 0) {
        ctx.fillStyle = "rgba(186, 230, 253, 0.15)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 4 + Math.sin(frameCount * 0.1) * 1.5;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`OCEAN TEMPERATURE FROZEN: ${Math.ceil(freezeTimer / 30)}s`, canvas.width / 2, 40);
      }

      // 10. Frame synchronization to React state HUD (throttled)
      if (frameCount % 6 === 0) {
        setHudStats({
          coins: playersRef.current[0].coins,
          score: playersRef.current[0].score,
          shoots: playersRef.current[0].shootsCount,
          hits: playersRef.current[0].hitCount,
          botCoins: [
            playersRef.current[1]?.coins || 0,
            playersRef.current[2]?.coins || 0,
            playersRef.current[3]?.coins || 0,
            playersRef.current[4]?.coins || 0,
            playersRef.current[5]?.coins || 0
          ],
          botNames: [
            playersRef.current[1]?.name || "",
            playersRef.current[2]?.name || "",
            playersRef.current[3]?.name || "",
            playersRef.current[4]?.name || "",
            playersRef.current[5]?.name || ""
          ],
          botEmotes: [
            playersRef.current[1]?.lastEmote || "",
            playersRef.current[2]?.lastEmote || "",
            playersRef.current[3]?.lastEmote || "",
            playersRef.current[4]?.lastEmote || "",
            playersRef.current[5]?.lastEmote || ""
          ],
        });
      }

      // 11. Draw Top-Center Round HUD Bar on Canvas
      if (!roundWinnerAnnouncementRef.current || !roundWinnerAnnouncementRef.current.show) {
        ctx.save();
        ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
        ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
        ctx.lineWidth = 1.5;
        
        const hudWidth = 270;
        const hudHeight = 26;
        const hx = canvas.width / 2 - hudWidth / 2;
        const hy = 8;
        
        ctx.beginPath();
        ctx.rect(hx, hy, hudWidth, hudHeight);
        ctx.fill();
        ctx.stroke();

        // Round text
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`ROUND ${currentRoundRef.current}`, hx + 10, hy + hudHeight / 2);

        // Separator circle
        ctx.fillStyle = "rgba(16, 185, 129, 0.4)";
        ctx.beginPath();
        ctx.arc(hx + 75, hy + hudHeight / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Time Left
        ctx.fillStyle = "#f8fafc";
        ctx.fillText(`TIME: ${roundTimeLeftRef.current}s`, hx + 85, hy + hudHeight / 2);

        // Separator circle
        ctx.fillStyle = "rgba(16, 185, 129, 0.4)";
        ctx.beginPath();
        ctx.arc(hx + 155, hy + hudHeight / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Best Round Score (High Score target)
        ctx.fillStyle = "#10b981";
        ctx.fillText(`BEST RD: $${bestRoundScoreRef.current.toLocaleString()}`, hx + 165, hy + hudHeight / 2);

        ctx.restore();
      }

      // 12. Draw Round Complete Announcement overlay on Canvas
      if (roundWinnerAnnouncementRef.current && roundWinnerAnnouncementRef.current.show) {
        const ann = roundWinnerAnnouncementRef.current;
        ctx.save();
        
        // Dark translucent overlay
        ctx.fillStyle = "rgba(2, 6, 23, 0.88)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Center card container
        const cardW = Math.min(480, canvas.width - 40);
        const cardH = 220;
        const cx = canvas.width / 2 - cardW / 2;
        const cy = canvas.height / 2 - cardH / 2;
        
        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.fillRect(cx, cy, cardW, cardH);
        
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2 + Math.sin(frameCount * 0.1) * 1.0;
        ctx.strokeRect(cx, cy, cardW, cardH);

        // Trophy header
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`🏆 ROUND ${ann.round} COMPLETED 🏆`, canvas.width / 2, cy + 35);

        // Golden divider line
        ctx.strokeStyle = "rgba(251, 191, 36, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + 40, cy + 60);
        ctx.lineTo(cx + cardW - 40, cy + 60);
        ctx.stroke();

        // Winner Subheader
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("ROUND HIGHEST COIN EARNER", canvas.width / 2, cy + 85);
        
        // Winner Name
        ctx.fillStyle = "#fbbf24";
        ctx.font = "black 22px sans-serif";
        ctx.fillText(`${ann.winnerName}`, canvas.width / 2, cy + 115);

        // Winner Coin Gain
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 16px monospace";
        ctx.fillText(`+$${ann.winnerGain.toLocaleString()} AUD`, canvas.width / 2, cy + 150);

        // Countdown next round progress bar outline
        const pbW = 200;
        const pbH = 6;
        const pbx = canvas.width / 2 - pbW / 2;
        const pby = cy + 180;
        
        ctx.fillStyle = "rgba(51, 65, 85, 0.5)";
        ctx.fillRect(pbx, pby, pbW, pbH);
        
        // Draw progress fill
        const fillRatio = Math.max(0, ann.timer / 180);
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(pbx, pby, pbW * fillRatio, pbH);

        ctx.fillStyle = "#64748b";
        ctx.font = "9px sans-serif";
        ctx.fillText(`PREPARING NEXT DEEP SEA MIGRATION...`, canvas.width / 2, cy + 202);

        ctx.restore();
      }

      ctx.restore(); // Balance the screen shake ctx.save() at the start of tick()

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [config.spawnRateModifier, soundEnabled]);

  // Handle User Clicks to shoot bullet (Standard firing event)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Prevent user clicks if a round transition overlay is currently active
    if (roundWinnerAnnouncementRef.current && roundWinnerAnnouncementRef.current.show) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    // Deduct coin bet instantly
    if (playersRef.current[0].coins < playerBet) {
      addLog("SECURITY", "Bullet fire validation failed: Insufficient wallet coin liquidity.", "critical");
      return;
    }

    // Deduct coins & update wallet ledger
    setUserBalance((prev) => prev - playerBet);
    playersRef.current[0].coins -= playerBet;
    playersRef.current[0].shootsCount++;

    // Increment server income/turnover metrics
    updateConfig((prev) => ({
      ...prev,
      totalIncome: prev.totalIncome + playerBet,
      jackpotPool: prev.jackpotPool + playerBet * 0.04, // 4% jackpot contribution
    }));

    // Calculate angle towards tap coordinates
    const anchorX = canvas.width / 2;
    const anchorY = canvas.height - 20;
    const dx = x - anchorX;
    const dy = y - anchorY;
    const angle = Math.atan2(dy, dx);

    playersRef.current[0].angle = angle;

    const bSpeed = 10;
    const bullet: Bullet = {
      id: `b_user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      playerId: "user",
      x: anchorX + Math.cos(angle) * 35,
      y: anchorY + Math.sin(angle) * 35,
      vx: Math.cos(angle) * bSpeed,
      vy: Math.sin(angle) * bSpeed,
      angle: angle,
      damage: playerBet,
      level: playerBet,
      type: activeWeapon,
      color: playersRef.current[0].color,
      bounces: 0,
    };

    bulletsRef.current.push(bullet);
    playSynthSound("shoot");

    // Flash physical shoot button on cabinet console simulation
    setCabinetButtonFlashes((prev) => ({ ...prev, shoot: true }));
    setTimeout(() => {
      setCabinetButtonFlashes((prev) => ({ ...prev, shoot: false }));
    }, 120);
  };

  // Handle Simulated Physical Coin Insertion
  const handleCoinInsert = () => {
    playSynthSound("coin_drop");
    setCoinDropFeedback(true);
    setUserBalance((prev) => prev + 1000);
    addLog("ECONOMY", "Physical Coin drop detected: +1,000 coins loaded via Cabinet Seat 1 slot.", "info");
    setTimeout(() => {
      setCoinDropFeedback(false);
    }, 1500);
  };

  // Adjust bet levels (cannon levels)
  const increaseBet = () => {
    const bets = [1, 2, 5, 10, 20, 50, 100, 200, 500];
    const curIdx = bets.indexOf(playerBet);
    if (curIdx < bets.length - 1) {
      setPlayerBet(bets[curIdx + 1]);
    }
  };

  const decreaseBet = () => {
    const bets = [1, 2, 5, 10, 20, 50, 100, 200, 500];
    const curIdx = bets.indexOf(playerBet);
    if (curIdx > 0) {
      setPlayerBet(bets[curIdx - 1]);
    }
  };

  return (
    <div className="flex flex-col gap-5 font-sans antialiased">
      {/* Simulation Chassis Mode Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg select-none gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
          <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">Chassis Hardware Controller</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[10px] uppercase font-bold text-slate-400 hidden lg:inline">Chassis Model:</span>
          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800/60 w-full sm:w-auto">
            <button
              onClick={() => setIsCabinetMode(false)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                !isCabinetMode
                  ? "bg-emerald-600 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              💻 Flat Monitor
            </button>
            <button
              onClick={() => setIsCabinetMode(true)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                isCabinetMode
                  ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🕹️ Table Cabinet
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        <div className="xl:col-span-3 flex flex-col gap-5">
          {isCabinetMode ? (
        /* Immersive 3D/Flat Physical Arcade Table Cabinet View Mode */
        <div className="w-full flex flex-col items-center justify-center bg-slate-950/60 p-4 sm:p-6 border border-slate-900 rounded-2xl relative overflow-hidden shadow-2xl">
          
          {/* Ambient lighting feedback overlay */}
          <div className="absolute inset-0 bg-radial-gradient-slate pointer-events-none opacity-20"></div>

          {/* Floating cash deposit feedback animation */}
          {coinDropFeedback && (
            <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-slate-950 px-5 py-2.5 rounded-full font-black text-xs shadow-[0_0_25px_rgba(245,158,11,1.0)] animate-bounce z-50 flex items-center gap-1.5 border-2 border-amber-300">
              🪙 COIN DROPPED: +$1,000 AUD DEPOSITED
            </div>
          )}

          {/* Table Cabinet Deck Structure */}
          <div className="w-full max-w-4xl bg-gradient-to-b from-stone-200 via-stone-300 to-stone-400 rounded-3xl p-5 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-4 border-stone-100 flex flex-col relative">
            
            {/* Upper Table Highlight Bevel */}
            <div className="absolute top-2 left-6 right-6 h-1 bg-white rounded-full opacity-65"></div>

            {/* Blinking Perimeter Pin-Lights (replicates the small bulb light indicators in photo) */}
            <div className="absolute top-3.5 left-8 right-8 flex justify-between pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={`l-top-${i}`}
                  className="w-3.5 h-3.5 bg-gradient-to-tr from-white via-amber-100 to-amber-300 border border-stone-400 rounded-full shadow-[0_0_12px_rgba(255,253,220,1.0)] transition-all"
                  style={{
                    animation: `pulse 0.8s infinite alternate ${i * 120}ms`,
                  }}
                />
              ))}
            </div>

            {/* Left Bezel Light Bulbs */}
            <div className="absolute top-12 bottom-36 left-4.5 flex flex-col justify-between pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <div
                  key={`l-left-${i}`}
                  className="w-3.5 h-3.5 bg-gradient-to-tr from-white via-amber-100 to-amber-300 border border-stone-400 rounded-full shadow-[0_0_12px_rgba(255,253,220,1.0)] animate-pulse"
                  style={{ animationDelay: `${i * 180}ms` }}
                />
              ))}
            </div>

            {/* Right Bezel Light Bulbs */}
            <div className="absolute top-12 bottom-36 right-4.5 flex flex-col justify-between pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <div
                  key={`l-right-${i}`}
                  className="w-3.5 h-3.5 bg-gradient-to-tr from-white via-amber-100 to-amber-300 border border-stone-400 rounded-full shadow-[0_0_12px_rgba(255,253,220,1.0)] animate-pulse"
                  style={{ animationDelay: `${i * 220}ms` }}
                />
              ))}
            </div>

            {/* Wooden Table Deck Control stations: TOP SIDE (Symmetrical) */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3.5 relative z-20">
              
              {/* Station 2: Bot Player Deck (Top-Left) */}
              <div className="bg-stone-300/95 border-t-4 border-yellow-500 border-x border-stone-400 p-2.5 rounded-xl shadow-md flex flex-col items-center relative overflow-hidden transition-all hover:scale-[1.02]">
                {/* Light-up Seat indicator */}
                <span className="absolute top-1.5 right-2.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
                
                <span className="text-[9px] font-black text-stone-700 uppercase tracking-widest mb-1">STATION 2 (Bot)</span>
                <span className="text-[8px] font-bold text-stone-500 truncate max-w-[120px] mb-2">{hudStats.botNames[1]}</span>
                
                <div className="flex items-center gap-3">
                  {/* Dynamic tilt joystick */}
                  <div className="w-10 h-10 bg-zinc-950 rounded-full flex items-center justify-center relative shadow-inner border border-stone-400">
                    <div
                      className="w-5 h-5 rounded-full bg-gradient-to-tr from-stone-200 to-yellow-500 border border-stone-300 shadow-md absolute transition-all duration-100"
                      style={{
                        transform: `translate(${Math.cos(playersRef.current[2]?.angle || 0) * 8}px, ${Math.sin(playersRef.current[2]?.angle || 0) * 8}px)`,
                      }}
                    />
                  </div>
                  {/* Active fire trigger */}
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full border border-stone-400 transition-all ${
                      playersRef.current[2]?.lastEmote ? 'bg-yellow-400 animate-bounce' : 'bg-red-500/20'
                    } ${Math.random() < 0.16 ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]' : ''}`} />
                    <span className="text-[6px] text-stone-500 font-bold mt-1">FIRE</span>
                  </div>
                </div>
                
                <span className="text-[9px] font-mono font-black text-yellow-700 mt-2">${hudStats.botCoins[1].toLocaleString()}</span>
                
                {/* Floating chat bubbles */}
                {playersRef.current[2]?.lastEmote && (
                  <div className="absolute bottom-2 left-2 bg-slate-900 border border-yellow-400 text-xs px-1.5 py-0.5 rounded-full animate-bounce shadow-md text-white">
                    {playersRef.current[2]?.lastEmote}
                  </div>
                )}
              </div>

              {/* Station 6: Bot Player Deck (Top-Middle) - SPACIOUS 2-COLUMN PREMIUM CENTER DECK */}
              <div className="md:col-span-2 bg-stone-300/95 border-t-4 border-cyan-500 border-x border-stone-400 p-2.5 rounded-xl shadow-md flex flex-col items-center relative overflow-hidden transition-all hover:scale-[1.01]">
                <span className="absolute top-1.5 right-2.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                
                <span className="text-[9px] font-black text-stone-700 uppercase tracking-widest mb-1">STATION 6 (Bot)</span>
                <span className="text-[8px] font-bold text-stone-500 truncate max-w-[200px] mb-2">{hudStats.botNames[4]}</span>
                
                <div className="flex items-center gap-12">
                  <div className="flex items-center gap-2">
                    {/* Joystick */}
                    <div className="w-10 h-10 bg-zinc-950 rounded-full flex items-center justify-center relative shadow-inner border border-stone-400">
                      <div
                        className="w-5 h-5 rounded-full bg-gradient-to-tr from-stone-200 to-cyan-500 border border-stone-300 shadow-md absolute transition-all duration-100"
                        style={{
                          transform: `translate(${Math.cos(playersRef.current[5]?.angle || 0) * 8}px, ${Math.sin(playersRef.current[5]?.angle || 0) * 8}px)`,
                        }}
                      />
                    </div>
                    <span className="text-[7px] text-stone-500 font-bold uppercase tracking-wider">AIM</span>
                  </div>

                  {/* High tech status LCD */}
                  <div className="bg-zinc-950 px-2.5 py-1 rounded border border-stone-400 shadow-inner text-center">
                    <div className="text-[6px] text-slate-500 uppercase font-bold">GUN SKIN</div>
                    <div className="text-[8px] font-black font-mono text-cyan-400 animate-pulse">HEAVY_LASER</div>
                  </div>

                  {/* Fire button flashes */}
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full border border-stone-400 transition-all ${
                      playersRef.current[5]?.lastEmote ? 'bg-cyan-400 animate-bounce' : 'bg-red-500/20'
                    } ${Math.random() < 0.12 ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : ''}`} />
                    <span className="text-[6px] text-stone-500 font-bold mt-1">FIRE</span>
                  </div>
                </div>
                
                <span className="text-[9px] font-mono font-black text-cyan-700 mt-2">${hudStats.botCoins[4].toLocaleString()}</span>
                
                {/* Floating chat bubble */}
                {playersRef.current[5]?.lastEmote && (
                  <div className="absolute bottom-2 left-2 bg-slate-900 border border-cyan-400 text-xs px-1.5 py-0.5 rounded-full animate-bounce shadow-md text-white">
                    {playersRef.current[5]?.lastEmote}
                  </div>
                )}
              </div>

              {/* Station 3: Bot Player Deck (Top-Right) */}
              <div className="bg-stone-300/95 border-t-4 border-purple-500 border-x border-stone-400 p-2.5 rounded-xl shadow-md flex flex-col items-center relative overflow-hidden transition-all hover:scale-[1.02]">
                <span className="absolute top-1.5 right-2.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                
                <span className="text-[9px] font-black text-stone-700 uppercase tracking-widest mb-1">STATION 3 (Bot)</span>
                <span className="text-[8px] font-bold text-stone-500 truncate max-w-[120px] mb-2">{hudStats.botNames[2]}</span>
                
                <div className="flex items-center gap-3">
                  {/* Joystick swivels on aim angle */}
                  <div className="w-10 h-10 bg-zinc-950 rounded-full flex items-center justify-center relative shadow-inner border border-stone-400">
                    <div
                      className="w-5 h-5 rounded-full bg-gradient-to-tr from-stone-200 to-purple-500 border border-stone-300 shadow-md absolute transition-all duration-100"
                      style={{
                        transform: `translate(${Math.cos(playersRef.current[3]?.angle || 0) * 8}px, ${Math.sin(playersRef.current[3]?.angle || 0) * 8}px)`,
                      }}
                    />
                  </div>
                  {/* Fire button flashes */}
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full border border-stone-400 transition-all ${
                      playersRef.current[3]?.lastEmote ? 'bg-purple-400 animate-bounce' : 'bg-red-500/20'
                    } ${Math.random() < 0.16 ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : ''}`} />
                    <span className="text-[6px] text-stone-500 font-bold mt-1">FIRE</span>
                  </div>
                </div>
                
                <span className="text-[9px] font-mono font-black text-purple-700 mt-2">${hudStats.botCoins[2].toLocaleString()}</span>
                
                {/* Floating chat bubbles */}
                {playersRef.current[3]?.lastEmote && (
                  <div className="absolute bottom-2 left-2 bg-slate-900 border border-purple-400 text-xs px-1.5 py-0.5 rounded-full animate-bounce shadow-md text-white">
                    {playersRef.current[3]?.lastEmote}
                  </div>
                )}
              </div>

            </div>

            {/* Inner Dark Bezel Frame surrounding the LED Display Panel */}
            <div className="bg-[#1e293b] rounded-2xl p-4 border-[12px] border-[#334155] shadow-[inset_0_4px_20px_rgba(0,0,0,0.95),0_12px_24px_rgba(0,0,0,0.4)] flex flex-col relative z-10 overflow-hidden my-1">
              
              {/* Responsive Game Canvas Screen */}
              <div ref={containerRef} className="w-full h-[360px] bg-slate-950 relative overflow-hidden cursor-crosshair border border-slate-900 rounded-lg shadow-2xl">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="absolute inset-0 w-full h-full block"
                />

                {/* Ocean Freeze Filter overlay */}
                {freezeTimer > 0 && (
                  <div className="absolute inset-0 bg-sky-200/20 border-4 border-[#38bdf8] pointer-events-none flex items-center justify-center">
                    <span className="bg-slate-950/80 px-3 py-1.5 rounded-lg text-xs font-black text-[#38bdf8] border border-[#38bdf8]/40 animate-pulse">
                      COLD FREEZE: {Math.ceil(freezeTimer / 30)}s
                    </span>
                  </div>
                )}

                {/* Real-time Overlay HUD display inside Screen Bezel */}
                <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-800/80 px-2.5 py-1.5 rounded font-mono text-[9px] text-slate-300 select-none flex items-center gap-3 shadow-md">
                  <div className="flex items-center gap-1 text-emerald-400 font-bold">
                    <Coins className="w-3.5 h-3.5" />
                    <span>${hudStats.coins.toLocaleString()}</span>
                  </div>
                  <span className="text-slate-700">|</span>
                  <div>Score: <span className="text-white font-bold">{hudStats.score.toLocaleString()}</span></div>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-[#10b981]/15 text-[#10b981] text-[8px] font-bold tracking-wider rounded uppercase border border-[#10b981]/20">
                    Chassis #201 Active
                  </span>
                </div>

                {/* Cannon trigger assist text */}
                <div className="absolute bottom-3 right-3 bg-slate-900/80 px-2 py-1 rounded text-[8px] font-bold text-slate-400 pointer-events-none select-none">
                  Click Screen viewport to aim & fire bullets
                </div>
              </div>
            </div>

            {/* Wooden Table Deck Control stations: BOTTOM SIDE (Symmetrical) */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3.5 relative z-20">
              
              {/* Station 5: Bot Player Deck (Bottom-Left) */}
              <div className="bg-stone-300/95 border-b-4 border-pink-500 border-x border-stone-400 p-2.5 rounded-xl shadow-md flex flex-col items-center relative overflow-hidden transition-all hover:scale-[1.02]">
                <span className="absolute top-1.5 right-2.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                </span>
                
                <span className="text-[9px] font-black text-stone-700 uppercase tracking-widest mb-1">STATION 5 (Bot)</span>
                <span className="text-[8px] font-bold text-stone-500 truncate max-w-[120px] mb-2">{hudStats.botNames[3]}</span>
                
                <div className="flex items-center gap-3">
                  {/* Joystick swivels on aim angle */}
                  <div className="w-10 h-10 bg-zinc-950 rounded-full flex items-center justify-center relative shadow-inner border border-stone-400">
                    <div
                      className="w-5 h-5 rounded-full bg-gradient-to-tr from-stone-200 to-pink-500 border border-stone-300 shadow-md absolute transition-all duration-100"
                      style={{
                        transform: `translate(${Math.cos(playersRef.current[4]?.angle || 0) * 8}px, ${Math.sin(playersRef.current[4]?.angle || 0) * 8}px)`,
                      }}
                    />
                  </div>
                  {/* Fire button flashes */}
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full border border-stone-400 transition-all ${
                      playersRef.current[4]?.lastEmote ? 'bg-pink-400 animate-bounce' : 'bg-red-500/20'
                    } ${Math.random() < 0.16 ? 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]' : ''}`} />
                    <span className="text-[6px] text-stone-500 font-bold mt-1">FIRE</span>
                  </div>
                </div>
                
                <span className="text-[9px] font-mono font-black text-pink-700 mt-2">${hudStats.botCoins[3].toLocaleString()}</span>
                
                {/* Floating chat bubbles */}
                {playersRef.current[4]?.lastEmote && (
                  <div className="absolute bottom-2 left-2 bg-slate-900 border border-pink-400 text-xs px-1.5 py-0.5 rounded-full animate-bounce shadow-md text-white">
                    {playersRef.current[4]?.lastEmote}
                  </div>
                )}
              </div>

              {/* Station 1: PLAYER 1 (YOU) Console (Fully Interactive control deck!) */}
              <div className="md:col-span-2 bg-gradient-to-b from-stone-100 to-stone-200 border-2 border-emerald-500 border-b-8 p-3 rounded-xl shadow-lg flex flex-col items-center relative overflow-hidden transition-all hover:scale-[1.01]">
                <div className="absolute -inset-2 bg-emerald-500/5 rounded-full filter blur-md pointer-events-none"></div>

                <div className="flex items-center justify-between w-full border-b border-stone-300/80 pb-1.5 mb-2.5">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                    🕹️ Station 1 (Player 1 - You)
                  </span>
                  <span className="text-[9px] font-mono font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">${hudStats.coins.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-6">
                  
                  {/* Physical Aim stick. Swivels dynamically in 360 degrees as user aims! */}
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-zinc-950 rounded-full border-2 border-stone-400 flex items-center justify-center relative shadow-inner">
                      <div className="w-10 h-10 bg-zinc-900 rounded-full absolute pointer-events-none"></div>
                      <div
                        className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-200 via-stone-100 to-emerald-400 border border-stone-300 shadow-[0_5px_10px_rgba(0,0,0,0.5),0_0_8px_rgba(16,185,129,0.3)] absolute transition-all duration-75"
                        style={{
                          transform: `translate(${Math.cos(playersRef.current[0].angle) * 11}px, ${Math.sin(playersRef.current[0].angle) * 11}px)`,
                        }}
                      />
                    </div>
                    <span className="text-[8px] text-stone-500 font-black mt-1 uppercase tracking-wider">AIM STICK</span>
                  </div>

                  {/* Physical Arcade Console Push Buttons */}
                  <div className="flex items-center gap-2">
                    
                    {/* Decrease Bet Button */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={decreaseBet}
                        className="w-8 h-8 rounded-full bg-orange-600 border border-orange-400 hover:brightness-110 active:scale-95 transition-all text-[8px] font-black text-white shadow-md flex items-center justify-center cursor-pointer"
                      >
                        DEC
                      </button>
                      <span className="text-[7px] text-stone-500 font-bold mt-1">BET -</span>
                    </div>

                    {/* Level display screen */}
                    <div className="bg-zinc-950 border border-stone-300 px-2 py-1 rounded text-center w-14 shadow-inner">
                      <div className="text-[7px] text-slate-500 uppercase font-bold">LVL</div>
                      <div className="text-xs font-black font-mono text-emerald-400">{playerBet}</div>
                    </div>

                    {/* Increase Bet Button */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={increaseBet}
                        className="w-8 h-8 rounded-full bg-orange-500 border border-orange-300 hover:brightness-110 active:scale-95 transition-all text-[8px] font-black text-white shadow-md flex items-center justify-center cursor-pointer"
                      >
                        INC
                      </button>
                      <span className="text-[7px] text-stone-500 font-bold mt-1">BET +</span>
                    </div>

                    {/* Gun type Toggle Button */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => {
                          const weapons = [WeaponType.STANDARD, WeaponType.LASER, WeaponType.DRILL];
                          const nextIdx = (weapons.indexOf(activeWeapon) + 1) % weapons.length;
                          handleWeaponChange(weapons[nextIdx]);
                        }}
                        className="w-8 h-8 rounded-full bg-cyan-600 border border-cyan-400 hover:brightness-110 active:scale-95 transition-all text-[8px] font-black text-white shadow-md flex items-center justify-center cursor-pointer"
                      >
                        WEAP
                      </button>
                      <span className="text-[7px] text-stone-500 font-bold mt-1">GUN</span>
                    </div>

                    {/* Big Orange Shoot Switch! Flashes bright orange on fire */}
                    <div className="flex flex-col items-center pl-2 border-l border-stone-300/80">
                      <button
                        onClick={() => {
                          const canvas = canvasRef.current;
                          if (!canvas) return;
                          const rect = canvas.getBoundingClientRect();
                          const targetX = rect.left + rect.width / 2 + Math.cos(playersRef.current[0].angle) * 150;
                          const targetY = rect.top + rect.height - 30 + Math.sin(playersRef.current[0].angle) * 150;
                          
                          const mockEvent = {
                            clientX: targetX,
                            clientY: targetY,
                          };
                          handleCanvasClick(mockEvent as any);
                        }}
                        className={`w-11 h-11 rounded-full bg-amber-500 border-2 border-amber-300 hover:brightness-110 active:scale-90 transition-all text-[9px] font-black text-slate-950 shadow-md shadow-amber-500/20 flex items-center justify-center cursor-pointer ${
                          cabinetButtonFlashes.shoot ? 'brightness-125 scale-90 shadow-[0_0_15px_rgba(245,158,11,0.8)]' : ''
                        }`}
                      >
                        SHOOT
                      </button>
                      <span className="text-[7px] text-stone-600 font-black mt-1 uppercase tracking-wider">FIRE</span>
                    </div>

                  </div>
                </div>

                {/* Floating chat bubble */}
                {playersRef.current[0]?.lastEmote && (
                  <div className="absolute bottom-2 left-2 bg-slate-900 border border-emerald-400 text-xs px-1.5 py-0.5 rounded-full animate-bounce shadow-md text-white">
                    {playersRef.current[0]?.lastEmote}
                  </div>
                )}
              </div>

              {/* Station 4: Bot Player Deck (Bottom-Right) */}
              <div className="bg-stone-300/95 border-b-4 border-blue-500 border-x border-stone-400 p-2.5 rounded-xl shadow-md flex flex-col items-center relative overflow-hidden transition-all hover:scale-[1.02]">
                <span className="absolute top-1.5 right-2.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                
                <span className="text-[9px] font-black text-stone-700 uppercase tracking-widest mb-1">STATION 4 (Bot)</span>
                <span className="text-[8px] font-bold text-stone-500 truncate max-w-[120px] mb-2">{hudStats.botNames[0]}</span>
                
                <div className="flex items-center gap-3">
                  {/* Joystick swivels on aim angle */}
                  <div className="w-10 h-10 bg-zinc-950 rounded-full flex items-center justify-center relative shadow-inner border border-stone-400">
                    <div
                      className="w-5 h-5 rounded-full bg-gradient-to-tr from-stone-200 to-blue-500 border border-stone-300 shadow-md absolute transition-all duration-100"
                      style={{
                        transform: `translate(${Math.cos(playersRef.current[1]?.angle || 0) * 8}px, ${Math.sin(playersRef.current[1]?.angle || 0) * 8}px)`,
                      }}
                    />
                  </div>
                  {/* Fire button flashes */}
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full border border-stone-400 transition-all ${
                      playersRef.current[1]?.lastEmote ? 'bg-blue-400 animate-bounce' : 'bg-red-500/20'
                    } ${Math.random() < 0.16 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : ''}`} />
                    <span className="text-[6px] text-stone-500 font-bold mt-1">FIRE</span>
                  </div>
                </div>
                
                <span className="text-[9px] font-mono font-black text-blue-700 mt-2">${hudStats.botCoins[0].toLocaleString()}</span>
                
                {/* Floating chat bubbles */}
                {playersRef.current[1]?.lastEmote && (
                  <div className="absolute bottom-2 left-2 bg-slate-900 border border-blue-400 text-xs px-1.5 py-0.5 rounded-full animate-bounce shadow-md text-white">
                    {playersRef.current[1]?.lastEmote}
                  </div>
                )}
              </div>

            </div>

            {/* Lower Cabinet Stand Base (Replicates gray laminate doors & key locks in photo) */}
            <div className="mt-6 bg-gradient-to-r from-stone-200 via-stone-300 to-stone-400 border-t border-stone-400/80 py-4 px-6 grid grid-cols-1 md:grid-cols-4 gap-4 rounded-b-2xl shadow-xl border-x-4 border-b-4 border-stone-400 relative">
              
              {/* Left Door node with Key lock */}
              <div className="border-r border-stone-400/50 flex flex-col justify-between h-20 pr-3">
                <div className="flex items-center gap-1.5 opacity-65">
                  <div className="w-3.5 h-3.5 bg-zinc-800 rounded-full border border-zinc-600 relative flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-amber-600 rounded-sm"></div>
                  </div>
                  <span className="text-[8px] text-stone-600 font-bold font-mono">NODE_LOCK_A</span>
                </div>
                <div className="text-[7px] font-mono text-stone-500">CABINET_SECTOR_01</div>
              </div>

              {/* Interactive Coin Door (Insert Coins to increase live balance!) */}
              <div className="md:col-span-2 flex justify-center items-center">
                <div
                  onClick={handleCoinInsert}
                  className="bg-neutral-850 border-2 border-neutral-700 hover:border-amber-500 transition-all rounded-lg px-6 py-2.5 flex items-center gap-6 shadow-[inset_0_0_12px_rgba(0,0,0,0.85)] cursor-pointer group active:scale-95 bg-zinc-900"
                >
                  {/* Slot A */}
                  <div className="flex flex-col items-center">
                    <div className="w-1 h-5 bg-amber-500 group-hover:bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse rounded-full" />
                    <div className="text-[6px] font-black text-amber-500/80 mt-1">25¢ INSERT TOKENS</div>
                  </div>
                  {/* Central Key */}
                  <div className="flex flex-col items-center border-x border-neutral-800 px-4">
                    <div className="w-4 h-4 bg-zinc-950 rounded-full border border-zinc-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-sm" />
                    </div>
                    <div className="text-[5px] text-neutral-400 font-mono mt-1">LOCK REFILL</div>
                  </div>
                  {/* Slot B */}
                  <div className="flex flex-col items-center">
                    <div className="w-1 h-5 bg-amber-500 group-hover:bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse rounded-full" />
                    <div className="text-[6px] font-black text-amber-500/80 mt-1">COIN REJECT</div>
                  </div>
                </div>
              </div>

              {/* Right Door node with Key lock */}
              <div className="border-l border-stone-400/50 flex flex-col justify-between h-20 pl-3 text-right">
                <div className="flex items-center justify-end gap-1.5 opacity-65">
                  <span className="text-[8px] text-stone-600 font-bold font-mono">NODE_LOCK_B</span>
                  <div className="w-3.5 h-3.5 bg-zinc-800 rounded-full border border-zinc-600 relative flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-amber-600 rounded-sm"></div>
                  </div>
                </div>
                <div className="text-[7px] font-mono text-stone-500">OPERATOR_OVERRIDE_04</div>
              </div>

            </div>

          </div>
        </div>
      ) : (
        /* Standard Flat Screen Mode */
        <div className="flex flex-col h-[620px] bg-slate-950 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative font-sans">
          {/* HUD Header Bar */}
          <div className="bg-slate-900 px-4 py-2 flex justify-between items-center border-b border-slate-800 select-none text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Coins className="w-4 h-4" />
                <span className="font-mono text-sm">${hudStats.coins.toLocaleString()}</span>
              </div>
              <div className="text-slate-400">
                Score: <span className="font-mono font-bold text-slate-100">{hudStats.score.toLocaleString()}</span>
              </div>
              <div className="text-slate-500 hidden sm:inline">
                Hit Ratio: <span className="font-mono">{hudStats.shoots ? Math.round((hudStats.hits / hudStats.shoots) * 100) : 0}%</span>
              </div>
            </div>

            {/* Weapons Selection Controls */}
            <div className="flex gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
              {[
                { type: WeaponType.STANDARD, label: "Std Cannon" },
                { type: WeaponType.LASER, label: "Glow Laser" },
                { type: WeaponType.DRILL, label: "Drill Missle" },
              ].map((w) => (
                <button
                  key={w.type}
                  onClick={() => handleWeaponChange(w.type)}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                    activeWeapon === w.type
                      ? "bg-emerald-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Sound toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-slate-400 hover:text-emerald-400 transition-all p-1"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 font-mono text-[10px] rounded border border-emerald-800/40">
                Live Ping: 28ms
              </span>
            </div>
          </div>

          {/* Main Canvas Space */}
          <div ref={containerRef} className="flex-1 bg-slate-950 relative overflow-hidden cursor-crosshair">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="absolute inset-0 w-full h-full block"
            />

            {/* Bottom User Controls HUD Overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900/90 border border-emerald-500/30 px-4 py-2.5 rounded-lg flex items-center gap-3 select-none backdrop-blur shadow-xl">
              <button
                onClick={decreaseBet}
                className="w-7 h-7 bg-slate-950 text-slate-100 font-black rounded border border-slate-800 hover:border-emerald-500 hover:bg-slate-900 transition-all text-xs"
              >
                -
              </button>
              <div className="text-center w-24">
                <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Cannon Level</div>
                <div className="text-sm font-black font-mono text-emerald-400">{playerBet}</div>
              </div>
              <button
                onClick={increaseBet}
                className="w-7 h-7 bg-slate-950 text-slate-100 font-black rounded border border-slate-800 hover:border-emerald-500 hover:bg-slate-900 transition-all text-xs"
              >
                +
              </button>
            </div>

            {/* Quick Emote Reactions Wheel Sidepanel */}
            <div className="absolute left-3 bottom-16 flex flex-col gap-1.5 bg-slate-900/85 p-1.5 rounded-lg border border-slate-800 select-none backdrop-blur shadow-lg">
              <div className="text-[8px] text-slate-500 font-bold text-center">EMOTE</div>
              {EMOTES.map((emote) => (
                <button
                  key={emote}
                  onClick={() => triggerUserEmote(emote)}
                  className="w-7 h-7 hover:scale-125 transition-all flex items-center justify-center bg-slate-950 rounded text-sm border border-slate-900 hover:border-emerald-500"
                >
                  {emote}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
        </div>

        {/* 🏆 TOURNAMENT ROUNDS LEDGER SIDEBAR */}
        <div className="xl:col-span-1 h-full">
          <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg text-slate-100 select-none h-full">
            
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <div className="p-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg border border-yellow-500/20">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">Rounds Ledger</h3>
                <p className="text-[10px] text-slate-500 font-bold">Deep Sea Championship</p>
              </div>
            </div>

            {/* Current Round Indicator Panel */}
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex flex-col gap-2.5 relative overflow-hidden">
              {/* Animated pulsing light */}
              <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Current Arena Wave</div>
                <div className="text-xl font-black text-yellow-500 tracking-tight font-mono">ROUND {currentRound}</div>
              </div>

              {/* Time Remaining Bar */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400">
                  <span>Wave Active Time</span>
                  <span className="font-mono text-slate-200">{roundTimeLeft}s</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-850/60 p-px">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      roundTimeLeft <= 10 
                        ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" 
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${(roundTimeLeft / 45) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* All-Time Round Record Target */}
            <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-500/20 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">👑</span>
                <div>
                  <div className="text-[9px] uppercase font-black text-yellow-500">BEST RD RECORD</div>
                  <div className="text-[10px] text-slate-400 font-bold">Target to smash:</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black font-mono text-emerald-400">${bestRoundScore.toLocaleString()}</div>
                <div className="text-[8px] font-mono text-slate-500">COINS WON</div>
              </div>
            </div>

            {/* Live Round Rankings Leaderboard */}
            <div className="flex flex-col gap-2">
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Live Round Leaderboard</div>
              <div className="bg-slate-950 border border-slate-850 rounded-lg p-2 flex flex-col gap-1.5">
                {(() => {
                  // Compute live round gains on the fly for all 6 players
                  const playersData = [
                    {
                      name: "Player 1 (You)",
                      gain: hudStats.coins - roundStartCoins[0],
                      color: "#10b981",
                      isUser: true
                    },
                    {
                      name: hudStats.botNames[0] || "MegaHunter_Bot",
                      gain: hudStats.botCoins[0] - roundStartCoins[1],
                      color: "#3b82f6",
                      isUser: false
                    },
                    {
                      name: hudStats.botNames[1] || "Cabinet_Seat_3",
                      gain: hudStats.botCoins[1] - roundStartCoins[2],
                      color: "#eab308",
                      isUser: false
                    },
                    {
                      name: hudStats.botNames[2] || "VIP_OceanLord",
                      gain: hudStats.botCoins[2] - roundStartCoins[3],
                      color: "#a855f7",
                      isUser: false
                    },
                    {
                      name: hudStats.botNames[3] || "NeonSlayer",
                      gain: hudStats.botCoins[3] - roundStartCoins[4],
                      color: "#ec4899",
                      isUser: false
                    },
                    {
                      name: hudStats.botNames[4] || "Apex_Predator",
                      gain: hudStats.botCoins[4] - roundStartCoins[5],
                      color: "#06b6d4",
                      isUser: false
                    }
                  ];

                  // Sort descending by gain
                  playersData.sort((a, b) => b.gain - a.gain);

                  return playersData.map((p, idx) => {
                    const colors = ["#fbbf24", "#94a3b8", "#b45309", "#475569", "#475569", "#475569"];
                    const placeColor = colors[idx] || "#475569";
                    return (
                      <div key={p.name} className={`flex items-center justify-between p-1.5 rounded text-xs transition-all ${p.isUser ? "bg-emerald-500/10 border border-emerald-500/20" : "hover:bg-slate-900/50"}`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          {/* Rank bubble */}
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black font-mono text-white" style={{ backgroundColor: placeColor }}>
                            {idx + 1}
                          </span>
                          {/* Color dot */}
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                          <span className={`truncate font-bold ${p.isUser ? "text-emerald-400 font-extrabold" : "text-slate-300"}`}>
                            {p.name}
                          </span>
                        </div>
                        <div className="font-mono text-right shrink-0">
                          <span className={`font-bold ${p.gain > 0 ? "text-emerald-400" : p.gain === 0 ? "text-slate-500" : "text-red-400"}`}>
                            {p.gain > 0 ? `+$${p.gain.toLocaleString()}` : p.gain === 0 ? "$0" : `-$${Math.abs(p.gain).toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Previous Completed Rounds Championship History */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex justify-between items-center">
                <span>Round Winner Log</span>
                <span className="text-[8px] font-bold text-slate-500 font-mono">HISTORY</span>
              </div>
              
              <div className="bg-slate-950 border border-slate-850 rounded-lg p-2.5 max-h-[160px] overflow-y-auto flex flex-col gap-2 custom-scrollbar">
                {roundHistory.length === 0 ? (
                  <div className="text-center py-6 text-slate-600 text-[10px] font-bold uppercase tracking-wider italic">
                    Waiting for Round 1 to clear...
                  </div>
                ) : (
                  [...roundHistory].reverse().map((hist, i) => (
                    <div key={`h-${hist.round}-${i}`} className="flex items-center justify-between border-b border-slate-900 pb-1.5 last:border-0 last:pb-0 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[9px] text-yellow-500 font-black shrink-0">WAVE {hist.round}</span>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: hist.color || "#10b981" }} />
                        <span className="truncate font-bold text-slate-300">{hist.winnerName}</span>
                      </div>
                      <div className="font-mono text-emerald-400 font-bold shrink-0 text-right">
                        +${hist.winnerGain.toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
