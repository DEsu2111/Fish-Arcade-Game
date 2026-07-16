/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum WeaponType {
  STANDARD = "Standard",
  LASER = "Laser Beam",
  DRILL = "Drill Missile",
  LIGHTNING = "Chain Lightning",
  BOMB = "Plasma Nuke"
}

export interface Player {
  id: string;
  name: string;
  coins: number;
  netWorth: number;
  level: number;
  gunLevel: number;
  weaponType: WeaponType;
  isBot: boolean;
  ping: number;
  connected: boolean;
  score: number;
  shootsCount: number;
  hitCount: number;
  lastEmote?: string;
  emoteTimer?: number;
  color: string;
  angle: number; // cannon angle in radians
}

export type MovementPattern = 
  | "straight" 
  | "sinewave" 
  | "coswave" 
  | "circle" 
  | "spiral" 
  | "zigzag" 
  | "escape" 
  | "teleport" 
  | "school_center" 
  | "school_orbit";

export interface Fish {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  speed: number;
  hp: number;
  maxHp: number;
  scoreValue: number;
  pattern: MovementPattern;
  angle: number;
  pathTime: number;
  shieldActive: boolean;
  isBoss: boolean;
  scale: number;
  color: string;
  isDying: boolean;
  deathProgress: number; // 0 to 1
  specialTrigger?: string; // "freeze", "lightning", "bomb", "clear"
}

export interface Bullet {
  id: string;
  playerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  damage: number;
  level: number;
  type: WeaponType;
  color: string;
  bounces: number;
}

export interface GameParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: "bubble" | "coin" | "spark" | "hit" | "explosion" | "laser" | "shield" | "text";
  text?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  category: "ECONOMY" | "SECURITY" | "SPAWNER" | "SYSTEM";
  message: string;
  severity: "info" | "warning" | "critical";
}

export interface DatabaseState {
  rtpSetting: number; // e.g., 96 (percentage)
  houseEdge: number; // e.g., 4 (percentage)
  antiCheatActive: {
    speedHack: boolean;
    autoFire: boolean;
    aimBot: boolean;
    packetValidation: boolean;
  };
  jackpotPool: number;
  totalIncome: number;
  totalPayout: number;
  spawnRateModifier: number;
}
