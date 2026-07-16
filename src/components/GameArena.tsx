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

  // Freeze Screen state
  const [freezeTimer, setFreezeTimer] = useState(0);

  // Wave Rush event state
  const [waveRushTimer, setWaveRushTimer] = useState(0);

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
  ]);

  const bulletsRef = useRef<Bullet[]>([]);
  const fishRef = useRef<Fish[]>([]);
  const particlesRef = useRef<GameParticle[]>([]);

  // Track target endpoints to draw laser guides or assist locking
  const [mousePos, setMousePos] = useState({ x: 400, y: 300 });

  // Sync React state for User's local HUD from playersRef
  const [hudStats, setHudStats] = useState({
    coins: userBalance,
    score: 0,
    shoots: 0,
    hits: 0,
    botCoins: [4500, 12000, 8500],
    botNames: ["MegaHunter_Bot", "Cabinet_Seat_3", "VIP_OceanLord"],
    botEmotes: ["", "", ""],
  });

  // Emotes list for quick triggering
  const EMOTES = ["🔥", "💰", "💥", "🎯", "👑", "🍀", "GG"];

  const triggerUserEmote = (emote: string) => {
    playersRef.current[0].lastEmote = emote;
    playersRef.current[0].emoteTimer = 90; // stay on screen for 90 frames (3 seconds)
    addLog("SYSTEM", `Player 1 sent reaction emote: ${emote}`, "info");

    // Randomize a bot responding
    setTimeout(() => {
      const responderIdx = Math.floor(Math.random() * 3) + 1;
      const botEmotes = ["💥", "👑", "🔥", "🤑", "🎯"];
      const botEmote = botEmotes[Math.floor(Math.random() * botEmotes.length)];
      playersRef.current[responderIdx].lastEmote = botEmote;
      playersRef.current[responderIdx].emoteTimer = 90;
    }, 1200);
  };

  // Helper to trigger synth sound effects using Web Audio API
  const playSynthSound = (type: "shoot" | "hit" | "capture" | "boss" | "freeze" | "explosion") => {
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
        { type: "clownfish", name: "Clownfish", size: 30, hp: 5, value: 2, speed: 1.5, color: "#f97316" }, // Orange
        { type: "goldfish", name: "Goldfish", size: 24, hp: 3, value: 3, speed: 2.0, color: "#eab308" }, // Yellow
        { type: "jellyfish", name: "Luminous Jellyfish", size: 40, hp: 12, value: 8, speed: 0.8, color: "#a855f7" }, // Purple
        { type: "swordfish", name: "Razor Swordfish", size: 55, hp: 20, value: 15, speed: 2.5, color: "#06b6d4" }, // Cyan
        { type: "shark", name: "Steel Shark", size: 80, hp: 60, value: 50, speed: 1.2, color: "#64748b" }, // Slate Gray
        { type: "toad", name: "Golden Toad", size: 90, hp: 150, value: 120, speed: 1.0, color: "#f59e0b" }, // Amber Gold
      ];

      const bossTypes = [
        { type: "kraken", name: "DEEP SEA KRAKEN BOSS", size: 160, hp: 800, value: 400, speed: 0.5, color: "#ec4899" }, // Hot Pink
        { type: "dragon", name: "GOLDEN DRAGON KING BOSS", size: 200, hp: 1500, value: 800, speed: 0.4, color: "#f59e0b" }, // Gold
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
        if (player.coins < 50) {
          player.coins += 2000;
          addLog("ECONOMY", `Regulating Bot liquidity: [${player.name}] wallet automatically replenished +2000 coins.`, "info");
        }

        // Randomly upgrade cannon
        if (Math.random() < 0.002) {
          const bets = [10, 20, 50, 100];
          player.gunLevel = bets[Math.floor(Math.random() * bets.length)];
          addLog("SYSTEM", `Bot [${player.name}] upgraded cannon bet level to: ${player.gunLevel} coins.`, "info");
        }

        // Randomly send emotes
        if (Math.random() < 0.002 && !player.lastEmote) {
          const emotes = ["🔥", "👑", "🎯", "🍀", "GG", "💎", "💪"];
          player.lastEmote = emotes[Math.floor(Math.random() * emotes.length)];
          player.emoteTimer = 90;
        }

        // Rotate Cannon towards some active fish
        if (fishRef.current.length > 0) {
          // Prefer targeting bosses
          const targetBoss = fishRef.current.find((f) => f.isBoss && !f.isDying);
          const target = targetBoss || fishRef.current[Math.floor(Math.random() * fishRef.current.length)];

          if (target && !target.isDying) {
            let canonX = 0;
            let canonY = 0;

            // Anchor locations for seats:
            // Bot 1 (idx 1): Bottom-Right (width - 150, height)
            // Bot 2 (idx 2): Top-Left (150, 0)
            // Bot 3 (idx 3): Top-Right (width - 150, 0)
            if (idx === 1) {
              canonX = width - 150;
              canonY = height - 20;
            } else if (idx === 2) {
              canonX = 150;
              canonY = 20;
            } else if (idx === 3) {
              canonX = width - 150;
              canonY = 20;
            }

            const dx = target.x - canonX;
            const dy = target.y - canonY;
            const targetAngle = Math.atan2(dy, dx);

            // Interpolate rotation smoothly
            player.angle += (targetAngle - player.angle) * 0.15;

            // Fire bullet with probability based on active fish count
            if (Math.random() < 0.08) {
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
                // only play select audio for bottom bot to avoid clutter
                playSynthSound("shoot");
              }
            }
          }
        }
      });
    }

    // Particle Burst spawner
    function createParticles(x: number, y: number, color: string, count: number, type: GameParticle["type"]) {
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
          maxLife: type === "coin" ? 50 : Math.random() * 20 + 20,
          type: type,
        });
      }
    }

    // Main Engine Tick & Drawing
    const tick = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Deep Sea Ambient Background
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#082f49"); // Deep Slate Blue
      grad.addColorStop(1, "#020617"); // Dark Midnight Blue
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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
      spawnTimer += 1 * config.spawnRateModifier;
      if (spawnTimer >= 100) {
        spawnTimer = 0;
        if (fishRef.current.length < 24) {
          spawnFish(canvas.width, canvas.height);
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
        if (fish.isBoss) {
          // Boss Ring Guard Glow
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, fish.width * 0.6, 0, Math.PI * 2);
          ctx.stroke();

          // Core Glowing Orb
          const radGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, fish.width * 0.5);
          radGrad.addColorStop(0, "#ffffff");
          radGrad.addColorStop(0.3, fish.color);
          radGrad.addColorStop(1, "rgba(2, 6, 23, 0.2)");
          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(0, 0, fish.width * 0.5, 0, Math.PI * 2);
          ctx.fill();

          // Crown on top of boss
          ctx.fillStyle = "#fbbf24"; // Gold Crown
          ctx.beginPath();
          ctx.moveTo(-15, -fish.height * 0.9);
          ctx.lineTo(-25, -fish.height * 1.4);
          ctx.lineTo(-8, -fish.height * 1.1);
          ctx.lineTo(0, -fish.height * 1.6);
          ctx.lineTo(8, -fish.height * 1.1);
          ctx.lineTo(25, -fish.height * 1.4);
          ctx.lineTo(15, -fish.height * 0.9);
          ctx.closePath();
          ctx.fill();
        } else if (fish.type === "toad") {
          // Chubby amphibian body
          ctx.fillStyle = fish.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, fish.width * 0.5, fish.height * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();

          // Golden Coin on back
          ctx.fillStyle = "#f59e0b";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, -10, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          // Standard Fish Ellipse Body
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
      runBotsLogic(canvas.width, canvas.height);

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

              // Trigger special visual effect explosion
              createParticles(fish.x, fish.y, fish.color, fish.isBoss ? 40 : 15, "coin");

              const rewardCoins = fish.scoreValue * bullet.level;

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

        // Gravity/float effect for coins
        if (p.type === "coin") {
          p.vy += 0.05; // slight falling gravity
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

      // 8. Draw Player Cannons & HUD tags (Anchored around borders)
      playersRef.current.forEach((player, idx) => {
        let anchorX = 0;
        let anchorY = 0;

        // Seat layout:
        // Seat 0 (You): Bottom-Middle (width / 2, height - 20)
        // Seat 1: Bottom-Right (width - 150, height - 20)
        // Seat 2: Top-Left (150, 20)
        // Seat 3: Top-Right (width - 150, 20)
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
        }

        // Draw HUD panel background card in Canvas
        ctx.save();
        ctx.translate(anchorX, anchorY);

        // Name & Balance Tag
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.strokeStyle = player.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-55, idx < 2 ? -75 : 45, 110, 25, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          `${player.name}`,
          0,
          idx < 2 ? -68 : 52
        );
        ctx.fillStyle = "#eab308";
        ctx.fillText(
          `$${player.coins.toLocaleString()}`,
          0,
          idx < 2 ? -58 : 62
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
          ctx.arc(0, idx < 2 ? -100 : 90, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = "14px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(player.lastEmote, 0, idx < 2 ? -100 : 90);
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
          botCoins: [playersRef.current[1].coins, playersRef.current[2].coins, playersRef.current[3].coins],
          botNames: [playersRef.current[1].name, playersRef.current[2].name, playersRef.current[3].name],
          botEmotes: [playersRef.current[1].lastEmote || "", playersRef.current[2].lastEmote || "", playersRef.current[3].lastEmote || ""],
        });
      }

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
  );
}
