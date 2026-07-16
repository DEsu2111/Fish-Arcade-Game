/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SpecSection {
  id: string;
  title: string;
  content: string;
}

export const SPECIFICATIONS: SpecSection[] = [
  {
    id: "overview",
    title: "1. Executive Summary & Market Analysis",
    content: `## 1.1 Commercial Fish Arcade Games Analysis
This technical design defines the architectural blueprints for a modern, horizontally scalable, ultra-low-latency, multi-platform **Multiplayer Fish Arcade Game Platform**. To build a commercially successful platform, we analyze the leading arcade and digital titles that define the industry:

*   **Ocean King (Series 1-3)**: The gold standard of physical arcade cabinets. Focuses heavily on high-impact physical sensations (rumbling cabinets, glowing LED joysticks), massive boss entry alerts (Tsunami waves, Kraken invasions), and chain-reaction weapons (Chain Lightning, Hurricane Fish, Laser Beams) that trigger a visual spectacle, maximizing spectatorship and player dopamine.
*   **Dragon King / Fishing God**: Successful transitions from land-based cabinets to mobile and web browsers. Key innovations include rich multiplayer room structures, automated targeting assistance (auto-lock), and extensive dynamic bonus events where the entire screen is frozen or cleared.
*   **Jackpot Fishing / All-Star Fishing**: Integrates advanced betting mathematics directly into the gameplay loop. Leverages progressive, multi-tier jackpots (Grand, Mega, Mini) tied directly to bullet coin multipliers, along with specialized collectible subsystems where killed fish drop tokens that unlock higher RTP weapon tiers.

## 1.2 Core Gameplay & Player Flow
The player flow is designed as an continuous, high-frequency, instant-gratification loop:
1.  **Lobby Entrance**: Player authenticates and enters the game lobby. They select a room categorized by betting limits (e.g., Bronze: 1-10 coins, Silver: 10-100 coins, Gold: 100-1000 coins).
2.  **Room Assignment**: The matchmaking engine assigns the player to a shared screen containing 2 to 8 active seats. Missing slots are filled with realistic bot players to maintain high screen density.
3.  **Active Cannon Session**: The player's cannon is anchored to their designated seat boundary. Each tap or click triggers a bullet shot towards the cursor.
4.  **Coin-to-Bullet Deductions**: Each bullet fired has an immediate, server-validated cost matching the cannon's current level (bet size).
5.  **Target and Collision**: Bullets traverse the screen, bouncing off boundaries, until they collide with a fish. The collision is validated on the server.
6.  **Kill & Reward Assessment**: Upon hit, a server-side probability calculation determines if the fish is captured. If successful, a visual coin explosion occurs, and the reward ($R = \\text{Bet} \\times \\text{Multiplier}$) is immediately credited to the player's wallet.

## 1.3 Player Psychology, Retention, & Commercial Mathematics
The arcade model operates on deep psychological principles:
*   **Near-Miss Effects**: Displaying HP bars or visual hit-flashes on bosses creates a powerful illusion of progress ("The boss is almost dead!"), encouraging players to accelerate their fire rate before the boss exits the screen.
*   **The Sunk Cost Trap**: When a player invests 50 bullets into a high-value target, they feel psychologically compelled to keep shooting, fearing that if they stop, another player will steal the kill and harvest the reward.
*   **Return-to-Player (RTP) & House Edge**: Commercially, the game engine operates with a targeted RTP of **92% to 98%**, leaving a **2% to 8% House Edge**. The system manages this not by simple RNG, but through **Adaptive Difficulty Adjustment** where the capture probability dynamically shifts based on current room payouts, protecting the operator's margin during high-win streaks while stimulating engagement when players are experiencing dry runs.`
  },
  {
    id: "modules",
    title: "2. Modular Microservices Decomposition",
    content: `## 2.1 Microservice and System Breakdown
A commercial-grade system is divided into highly specialized, independent modules running within isolated container nodes. This ensures that a spike in game-loop physics calculations does not degrade payment gateways or wallet transaction performance.

\`\`\`
+---------------------------------------------------------------------------------+
|                               API GATEWAY / PROXY                               |
+---------------------------------------------------------------------------------+
        |                                 |                                 |
        v                                 v                                 v
+------------------+             +------------------+             +------------------+
|  AUTH & SESSION  |             |  ROOM & MATCH    |             |  GAME PLAY NODE  |
|  - JWT Service   |             |  - Room Manager  |             |  - Physics/Sync  |
|  - Wallet Ledger |             |  - Bot Spawner   |             |  - Bullet Engine |
+------------------+             +------------------+             +------------------+
        |                                 |                                 |
        +---------------------------------+---------------------------------+
                                          |
                                          v
                              +-----------------------+
                              | REDIS REAL-TIME STATE |
                              | - Snapshot Cache      |
                              | - Sorted Leaderboards |
                              | - Presence Tracker    |
                              +-----------------------+
                                          |
                                          v
                              +-----------------------+
                              |   POSTGRESQL DB R/W   |
                              | - Persistent Wallets  |
                              | - Audit Log / Ledger  |
                              +-----------------------+
\`\`\`

## 2.2 Core Modules Definition
*   **Authentication & Wallet Module (Ledger)**:
    *   *Responsibility*: Manages secure JWT-based player sessions, OAuth integrations, and maintains a strict, transaction-safe double-entry ledger for coin wallets.
    *   *APIs*: \`POST /api/auth/register\`, \`POST /api/auth/login\`, \`GET /api/wallet/balance\`, \`POST /api/wallet/credit-debit\`.
    *   *Data*: Players table, Wallets table, TransactionLedger.
    *   *Lifecycle*: Instantiated at boot; horizontally scaled. High availability is achieved using read-replicas.
*   **Lobby, Matchmaking, & Room Module**:
    *   *Responsibility*: Groups active users into 4-player shared rooms based on betting limits. Allocates unique room identifiers and spins up dedicated WebSocket spaces.
    *   *APIs*: \`GET /api/rooms/list\`, \`POST /api/rooms/join\`.
    *   *Redis State*: Tracks room population hashes (\`room:occupancy\`) and active player-to-room mappings.
*   **Authoritative Game Loop & Bullet Engine**:
    *   *Responsibility*: Drives the server-side tick loop (30 ticks/sec). Computes bullet physics, tracks bullet lifetimes, and handles screen boundary reflections (bounces).
    *   *Data Structure*: Bullet pool, spatial grid cache for fast bounding box evaluations.
*   **Fish AI & Spawning Engine**:
    *   *Responsibility*: Schedules and coordinates fish spawning timelines using pre-defined curves, spline path maps, and wave patterns. Generates individual fish coordinates and manages local lifecycles.
    *   *Algorithms*: Bezier/B-Spline curve interpolations, Schooling flocking behavior models.
*   **Transaction and Reward Engine**:
    *   *Responsibility*: Evaluates the validity of every bullet impact. Executes the capture probability algorithm, increments/decrements player balance, and triggers local jackpot shares.
    *   *APIs*: Emits high-priority Socket.IO event \`player:payout\` with transactional payloads.`
  },
  {
    id: "architecture",
    title: "3. Systems Architecture & Networking",
    content: `## 3.1 Overall Technical Architecture
To handle millions of concurrent players, the system relies on an event-driven, microservices-oriented backend. This architecture decouples low-latency UDP/WebSocket connection handling from durable state recording.

\`\`\`
  [ Web / Mobile Client ]   [ Desktop Client ]   [ Cabinet Client ]
             |                      |                     |
             +----------------------+---------------------+
                                    |
                                    v (TLS 1.3 / WSS)
                        +-----------------------+
                        | NGINX Load Balancer   |
                        +-----------------------+
                                    |
             +----------------------+----------------------+
             v (HTTP REST API)                             v (WSS Socket.IO)
+-------------------------+                   +-------------------------+
| Fastify API Gateway     |                   | Socket.IO Backend       |
| - JWT Auth Middleware   |                   | - 30Hz Server Tick Loop |
| - Lobby & Matchmaking   |                   | - Room Synchronization  |
| - Player Store Profile  |                   | - Authoritative Physics |
+-------------------------+                   +-------------------------+
             |                                             |
             +----------------------+----------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
| Redis Distributed Cache (Cluster Mode)                                |
| - Session Cache (Hashes)                                             |
| - Room Snapshot Pipeline (Strings)                                    |
| - Leaderboard Ranking (Sorted Sets)                                   |
| - Room Presence List (Sets)                                           |
+-----------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
| PostgreSQL Main Database (CockroachDB / AWS Aurora PG)                 |
| - Master Read/Write Nodes (Wallets, Ledger, Credentials)              |
| - Read Replica Clusters (Logs, Game History, Achievements)            |
+-----------------------------------------------------------------------+
\`\`\`

## 3.2 Multiplayer Sync & Socket.IO Networking
Low-latency real-time state sync is achieved through custom Socket.IO synchronization:

*   **Server Tick Rate**: Runs at a strict **30 Ticks per Second (33.3ms intervals)**.
*   **Snapshot Compression**: State snapshots are serialized into compact JSON structures, or optimized binary formats (Protobuf) for production.
*   **Snapshot Packet Structure**:
    \`\`\`json
    {
      "t": 172084532, 
      "f": [ 
        {"id": "f_1", "x": 420.5, "y": 210.2, "h": 12, "a": 1.57}
      ],
      "b": [
        {"id": "b_101", "p": "p_1", "x": 120.3, "y": 80.4, "a": 0.45}
      ]
    }
    \`\`\`
*   **Lag Compensation**:
    *   *Interpolation*: Client-side rendering is delayed by exactly 100ms (approx. 3 ticks) to interpolate between consecutive state snapshots, neutralizing packet jitter and visual stutter.
    *   *Prediction*: To maintain instantaneous feedback on inputs, the player's own cannon fires locally immediately upon tapping. It projects bullet trajectories using client-side physics, and reconciles coordinates when the authoritative server broadcast arrives.`
  },
  {
    id: "database",
    title: "4. Database Schemas & Cache Architecture",
    content: `## 4.1 Relational Database Schema (Prisma Format)
Below is the database design in standard Prisma schema notation. It ensures full normalization, referential integrity, and ledger immutability for casino/arcade operations:

\`\`\`prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String         @id @default(uuid())
  username      String         @unique
  passwordHash  String
  email         String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  wallet        Wallet?
  gameHistory   GameHistory[]
  achievements  UserAchievement[]
  logs          AuditLog[]
}

model Wallet {
  id          String        @id @default(uuid())
  userId      String        @unique
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  balance     Decimal       @default(0.00) @db.Decimal(18, 4)
  jackpotContribution Decimal @default(0.00) @db.Decimal(12, 4)
  updatedAt   DateTime      @updatedAt
  transactions Transaction[]
}

model Transaction {
  id          String        @id @default(uuid())
  walletId    String
  wallet      Wallet        @relation(fields: [walletId], references: [id])
  amount      Decimal       @db.Decimal(18, 4) // Negative for cost, positive for reward
  type        String        // "BULLET_FIRE", "FISH_CAPTURE", "JACKPOT_WIN", "DEPOSIT", "WITHDRAW"
  description String?
  timestamp   DateTime      @default(now())
}

model GameHistory {
  id          String        @id @default(uuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  bulletsFired Int
  fishCaptured Int
  totalSpent  Decimal       @db.Decimal(18, 4)
  totalWon    Decimal       @db.Decimal(18, 4)
  netProfit   Decimal       @db.Decimal(18, 4)
  timestamp   DateTime      @default(now())
}

model UserAchievement {
  id            String      @id @default(uuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  achievementKey String
  unlockedAt    DateTime    @default(now())
}

model AuditLog {
  id          String        @id @default(uuid())
  userId      String?
  user        User?         @relation(fields: [userId], references: [id])
  category    String        // "ECONOMY", "SECURITY", "SPAWNER", "SYSTEM"
  message     String
  severity    String        // "INFO", "WARNING", "CRITICAL"
  timestamp   DateTime      @default(now())
}
\`\`\`

## 4.2 Redis Cache Key Structures & Usage
To optimize response times and maintain high-speed game loops, Redis coordinates in-memory operations:

1.  **Player Session Store**:
    *   *Key*: \`session:token:<token_hash>\`
    *   *Type*: Hash
    *   *Fields*: \`userId\`, \`username\`, \`role\`, \`activeRoomId\`
2.  **Room Occupancy Register**:
    *   *Key*: \`rooms:active\`
    *   *Type*: Sorted Set (\`ZSET\`)
    *   *Score*: Player count (0-8)
    *   *Member*: \`roomId\`
3.  **Real-time Leaderboard**:
    *   *Key*: \`leaderboard:daily:<date_string>\`
    *   *Type*: Sorted Set (\`ZSET\`)
    *   *Score*: Total score (payout coins)
    *   *Member*: \`userId\`
4.  **Distributed Lock (Concurrency Guard)**:
    *   *Key*: \`lock:wallet:id:<walletId>\`
    *   *Type*: String with TTL
    *   *Usage*: Prevents double-spend and race conditions during high-frequency balance adjustments.`
  },
  {
    id: "ai",
    title: "5. Fish AI & Movement Mathematics",
    content: `## 5.1 Spline Interpolation & Trajectory Generation
All fish swimming paths are computed using parametric Bezier splines. This ensures smooth, organic movement paths rather than rigid, jagged line changes:

$$\\mathbf{B}(t) = (1-t)^3 \\mathbf{P}_0 + 3(1-t)^2 t \\mathbf{P}_1 + 3(1-t) t^2 \\mathbf{P}_2 + t^3 \\mathbf{P}_3$$

Where:
*   $\\mathbf{P}_0$ is the spawn coordinate (screen boundary).
*   $\\mathbf{P}_1, \\mathbf{P}_2$ are control points determining direction shifts and wave amplitudes.
*   $\\mathbf{P}_3$ is the exit coordinate.
*   $t \\in [0, 1]$ represents the progress time fraction.

## 5.2 Top 10 High-Fidelity Fish Behaviors
We implement a deep matrix of fish behaviors directly within the movement system:
1.  **Linear Patrol (Straight)**: Straight passage across the screen. Standard pacing.
2.  **Sinusoidal Wave**: Superimposes a sine wave onto a linear direction, simulating swimming undulations.
3.  **Vortex Spiral**: Fish circles and spirals around a central point, gradually descending into the deep.
4.  **Escape Dash**: Triggers when a fish receives cumulative hits. Its speed doubles, and it alters control coordinates to dash towards screen borders.
5.  **Flocking School**: A coordinated group of 10-30 minor fish following a central leader, updating paths dynamically using Reynolds flocking rules (Cohesion, Separation, Alignment).
6.  **Orbiting Boss Group**: A giant Boss surrounded by a circular orbit of shield-generating guard fish. Players must break the outer orbiting shield-fish before they can impact the boss.
7.  **Smart Teleporter**: Rare jellyfish that fades out (translucency) and reappears in a different screen quadrant, discarding active bullets tracking its previous coordinates.
8.  **Aggressive Charge**: A predator fish that occasionally targets a randomly selected player cannon, swimming directly towards it and blocking other player-shots in that sector.
9.  **Erratic Zigzag**: Sharp, jagged 90-degree angle switches resembling rapid underwater darting.
10. **Tsunami Wave Surge**: A sudden event spawning hundreds of school fish moving in uniform rows from left to right, creating a rapid-fire high-return scenario.`
  },
  {
    id: "mathematics",
    title: "6. Commercial Game Mathematics & RTP",
    content: `## 6.1 Return-to-Player (RTP) and House Edge Model
To guarantee profitability, each coin spent on a bullet is split on the server:

$$\\text{Bullet Cost} = C$$
$$\\text{RTP Distribution} = 0.96 \\times C \\quad (\\text{assuming } 96\\% \\text{ RTP})$$
$$\\text{House Margin} = 0.04 \\times C \\quad (\\text{assuming } 4\\% \\text{ House Edge})$$

The 96% distributed pool is allocated as:
*   **Base Capture Pool**: 90% (pays for standard fish captures).
*   **Progressive Jackpot Pool**: 4% (split between Grand, Mega, Mini tiers).
*   **Special Bonus Event Pool**: 2% (pays out during high-yield boss waves).

## 6.2 Capture Probability Formulas
The capture evaluation of any single bullet impact is server-authoritative and calculated as:

$$P(\\text{Capture}) = \\frac{\\text{Bullet Level (Bet)}}{\\text{Fish Score Value} \\times \\text{Difficulty Modifier}} \\times \\text{RTP Adaptive Factor}$$

Where:
*   **Bullet Level (Bet)**: Standard integer multiplier (1 to 50 coins).
*   **Fish Score Value**: The coin multiplier of the target (e.g., Small Fish = 2, Shark = 50, Gold Dragon Boss = 500).
*   **Difficulty Modifier**: Set by the operator (e.g., Easy = 0.95, Medium = 1.0, Hard = 1.05).
*   **RTP Adaptive Factor ($A$)**: Computed based on the room's rolling RTP history over the last 10,000 bullets:
    $$A = 1.0 + (\\text{Target RTP} - \\text{Actual RTP}) \\times \\gamma$$
    Where $\\gamma$ is a smoothing sensitivity constant. If Actual RTP exceeds Target RTP, $P$ decreases slightly to stabilize house margin; if Actual RTP is low, $P$ increases to stimulate player spend and ensure legal compliance.

## 6.3 Progressive Jackpots Allocation
Progressive jackpots grow with every bullet shot:
*   **Mini Jackpot**: Triggers frequently for multipliers between $50\\times$ and $200\\times$. Contribution rate: $1.5\\%$.
*   **Mega Jackpot**: Triggers for multipliers between $200\\times$ and $1000\\times$. Contribution rate: $1.5\\%$.
*   **Grand Jackpot**: Triggers for epic boss kills, starting at $1000\\times$ and climbing. Contribution rate: $1.0\\%$.`
  },
  {
    id: "security",
    title: "7. Security & Anti-Cheat Protocols",
    content: `## 7.1 Server-Authoritative Validations
In multiplayer arcade platforms, client-side calculations are completely ignored for monetary state:
1.  **Bullet Fires**: Checked immediately against the wallet balance in PostgreSQL/Redis. If the wallet is empty or does not support the bet size, the fire request is instantly rejected and the socket session is closed.
2.  **Trajectory Validation**: The server validates that bullet path equations match the reported impact coordinate. Rapid or teleporting bullets are flagged as speed hacks.
3.  **Kill Probability**: Calculated entirely on the server. Clients merely receive a capture message containing the updated coin balance.

## 7.2 Anti-Cheat Logic
To safeguard fair play and game economy integrity, we implement three real-time detectors:
*   **Speed Hack Detection**:
    *   *Algorithm*: Compares client timestamp delta against server timestamp delta. If client elapsed time lags behind server clock by more than 150ms per second, a warning is logged. Cumulative violations trigger a socket disconnect.
*   **Auto-Fire / Scripting Detection**:
    *   *Algorithm*: Measures the standard deviation of shot intervals:
        $$\\sigma = \\sqrt{\\frac{1}{N}\\sum_{i=1}^{N}(t_i - \\mu)^2}$$
        If $\\sigma < 5\\text{ms}$ over 50 consecutive shots, it indicates a script or macro rather than human thumb-presses, triggering automatic account freeze.
*   **Aim Bot Tracking**:
    *   *Algorithm*: Evaluates sudden, instant angle changes without realistic sweep paths. If cannon angle shifts instantly by $>90^\\circ$ repeatedly and perfectly locks onto moving fish center-points, the player's account is placed under review.`
  },
  {
    id: "performance",
    title: "8. Performance Optimization & Deployment",
    content: `## 8.1 Rendering Optimizations (Unity & Canvas)
High performance is essential to prevent latency spikes during intense shooting waves:
*   **Object Pooling (Bullets & Fish)**: Memory allocations are minimized by reusing assets. When a bullet hits or leaves screen borders, it is deactivated and returned to the pool rather than garbage-collected.
*   **Draw Call Reduction (Sprite Batching)**: All fish, bullet, and visual UI assets are packed into a unified **Texture Atlas**. This allows the rendering engine to draw thousands of elements in a single GPU draw call.
*   **Canvas Grid Spatial Partitioning**: The collision detection grid divides the screen coordinates into an $8 \\times 8$ matrix. Instead of checking every bullet against every fish ($O(N \\times M)$), the engine only evaluates collisions for bullets and fish sharing the same grid cell ($O(N)$), saving CPU cycles.

## 8.2 Production Deployment & Scalability Blueprint
The platform is designed for zero-downtime operations and massive horizontal scaling:
*   **Kubernetes Pod Clustering**: Independent clusters of Socket.IO servers handle high-frequency connections. Lobby routers balance connection counts across active nodes.
*   **Redis Pub/Sub Synchronization**: Room states, system parameters, and database sync configurations are communicated across backend servers instantly using Redis channels.
*   **Database Partitioning**: The Transaction ledger table is partitioned by date (e.g., monthly) to ensure PostgreSQL index searches remain ultra-fast as total record volumes grow into the billions.`
  }
];
