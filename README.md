# DeepSea King: Multiplayer Fish Arcade Platform
### Enterprise-Grade Server-Authoritative Simulation & Live Risk-Management Console

Welcome to the **DeepSea King** repository. This platform is a high-fidelity commercial simulator of premier multiplayer Fish Arcade games (similar to *Ocean King*, *Dragon King*, and *Jackpot Fishing*). It features a real-time high-performance 60FPS physics/rendering arena, a dynamic live Return-to-Player (RTP) difficulty modifier, kernel-authoritative anti-cheat controllers, and a complete Technical Design Document (TDD) browser.

---

## 1. Directory Structure & Architecture Mapping

Below is the complete file layout of the platform, along with explanations of the role each file plays in development, scaling, and production compilation:

```
├── .env.example                       # Reference environment variables for cloud & local configuration
├── .gitignore                         # Build and dependency exclusion paths for Git versioning
├── index.html                         # SPA root layout entrypoint and viewport setups
├── metadata.json                      # AI Studio frame permissions and capability manifests
├── package.json                       # Module dependencies, engines specification, and dev/build scripts
├── tsconfig.json                      # Strict TypeScript compiler options & alias configurations
├── vite.config.ts                     # Bundler settings, HMR overrides, and asset aliases
└── src
    ├── App.tsx                        # Main Client application wrapper, state router, and tabs coordinator
    ├── index.css                      # Global Tailwind CSS imports and ambient background configurations
    ├── main.tsx                       # React DOM runtime mounter with StrictMode checks
    ├── types.ts                       # Shared system typings, enumerations, interface state shapes
    ├── data
    │   └── specification.ts           # Comprehensive database model schemas & mathematical design specs (TDD)
    └── components
        ├── GameArena.tsx              # High-performance 60FPS physics loop, spatial collisions, & player HUDs
        ├── AdminConsole.tsx           # Live RTP dials, anti-cheat switches, and audit logging screens
        ├── AnalyticsPanel.tsx         # Economy ledger tracker, progressive jackpot pools, and capture yield charts
        └── SpecificationView.tsx      # Multi-section Software Architecture Document viewer with interactive styling
```

### Module Responsibilities:
*   `src/types.ts`: Serves as the single source of truth for structural interfaces. Every weapon type, player schema, bullet instance, particle group, and database configuration is validated strictly against these schemas.
*   `src/components/GameArena.tsx`: Houses the primary HTML5 Canvas rendering pipeline. Runs on a double-buffered game tick. Operates custom linear and trigonometric trajectories, spline wave calculations, and spatial partition collision detections.
*   `src/components/AdminConsole.tsx`: The system operator's command room. Simulates real-time CPU/RAM system loads, and triggers direct socket updates and anti-cheat thresholds.
*   `src/components/AnalyticsPanel.tsx`: Captures transaction records and evaluates live player yields. Calculates the variance between the actual and target Return-to-Player (RTP) indices.

---

## 2. Production Technology Stack & Technical Justifications

The DeepSea King platform is built using a modern, high-performance web tech stack. Each technology was selected specifically to meet the strict demands of real-time multiplayer gaming, complex math calculations, and financial-grade ledger security:

### 2.1 Core Development Frameworks
*   **TypeScript (v5.x)**: Used for strict type safety. In a system where mathematical equations dictate progressive jackpots and real money balance audits, type errors can lead to game exploits or critical financial discrepancies. TypeScript ensures that all data payloads, anti-cheat structures, and player profiles are rigidly validated at compile-time.
*   **React (v18+) & HTML5 Canvas**: The interface uses a decoupled architecture. React manages administrative states, operator dials, and specifications with high-level declarative components, while the game engine is powered by an independent, double-buffered **HTML5 Canvas loop** driven by `requestAnimationFrame`. This combination avoids DOM-repaint lag, keeping the game at a locked **60FPS** while preserving modern reactive state-management for metrics.
*   **Vite**: The build system uses Vite to enable ultra-fast Hot Module Replacement (HMR) during developer iterations and highly optimized code splitting/tree-shaking for production deployment bundles.

### 2.2 Visuals, Icons, & Design System
*   **Tailwind CSS (v4.0)**: Guarantees modular, robust UI styling with zero runtime CSS overhead. It ensures that the admin screens, analytics, and game dashboards render flawlessly across high-density mobile screens, desktop monitors, and land-based physical arcade cabinet displays.
*   **Lucide React**: Integrated for crisp, vector-based, high-DPI system icons that remain completely responsive without the overhead of heavy custom graphic assets.
*   **Framer Motion (`motion/react`)**: Powering interactive tab transitions, slide-outs, and HUD animations to deliver an enterprise-grade operator and player user experience.

### 2.3 Mathematical Data Visualization
*   **Recharts & D3.js**: High-efficiency charting libraries are used to translate millions of lines of financial logs and capture events into human-readable real-time charts (such as RTP tracking and progressive jackpot pool accumulation trends), enabling operators to monitor risk-management metrics at a glance.

---

## 3. Physical Arcade Cabinet Hardware & Assembly Specification

This section details the physical hardware list, bill of materials (BOM), step-by-step assembly protocol, and software-to-hardware interface mappings for operators building a physical, custom multiplayer sit-down arcade console (matching the design in the photo).

### 3.1 Bill of Materials (BOM) & Purpose

The physical chassis is a premium sit-down multi-terminal cabinet constructed with robust materials to withstand intensive player interactions:

| Hardware Component | Purpose / Role | Technical Specifications & Material Selection |
| :--- | :--- | :--- |
| **Laminated MDF Wood Panels** | Table chassis & base cabinet doors | 18mm heavy-duty MDF with moisture-resistant scratchproof ash-white timber laminate finish. |
| **Open-Frame LED Monitor** | Unified tabletop game screen | 55-inch or 65-inch high-density IPS/LCD display with 178° ultra-wide viewing angles, running at 60Hz. |
| **8mm Tempered Glass Panel** | Screen protection cover | Thermal-toughened anti-glare safety glass with polished borders, sealed with silicon against liquid spills. |
| **E14 Amber LED Bulbs (16x)** | Attract-mode blinking indicators | Warm-orange low-temperature 12V DC LED bulbs, installed in screw-bezel sockets flush with the tabletop border. |
| **Heavy-Duty Joysticks (4x)** | Analog direction and angle input | Multi-directional arcade joysticks with microswitches and weighted restrictor plates. |
| **Arcade Pushbuttons** | Action trigger commands | Sanwa-style premium 30mm plastic buttons with copper contact microswitches (mapped to SHOOT, INC, DEC, and GUN). |
| **Zero-Delay USB Encoders (4x)** | Signal translation to computer | 4-way USB control boards mapping analog joystick potentiometers and pushbuttons into virtual keyboard HIDs. |
| **Mechanical Coin Acceptors (4x)** | Token deposits and ledger audits | CPU-intelligent electronic coin validators with multi-diameter and thickness comparative profiling. |
| **Security Key Cam Locks (4x)** | Prevent unauthorized terminal access | Radial pin tubular key cam cylinder locks on lower laminate panels for secure logic boards & vault drawers. |
| **Industrial Core Mini PC** | Host OS and game engine container | Intel Core i5 CPU, 16GB RAM, 256GB SSD, running Linux Ubuntu with locked Chromium/Kiosk web instance. |
| **2.1 Audio Sound System** | Play high-impact sound feedback | 2x 15W high-density stereo speakers + 1x 25W subwoofer driven by a 12V class-D audio amplifier. |

---

### 3.2 Physical Assembly Protocol (Step-by-Step)

To assemble your physical cabinet safely, proceed slowly in the following structural order:

1.  **Construct the Lower Support Pedestal**: Using the 18mm laminated MDF boards, build the bottom rectangular pedestal base. Fasten panels internally using steel L-brackets and woodscrews. Set up partition walls to separate the vault collection boxes from the main computer cabinet.
2.  **Mount Cabinet Doors and Lock Plugs**: Hang the white-laminated cabinet doors onto the support pedestal using soft-close spring hinges. Drill 19mm holes through each door and fit the security Key Cam Locks.
3.  **Build the Tabletop Console Well**: Construct the upper horizontal tabletop tray. Leave a precise recessed frame in the exact center matching the height and width of your 55"/65" open-frame LED monitor.
4.  **Install the Central Display Panel**: Lower the monitor into the table-well frame, securing it from underneath using rubber-padded steel brackets to eliminate movement. Lay the 8mm tempered anti-glare safety glass on top. Seal the outer rim with black silicon grout to make the tabletop completely liquid-tight.
5.  **Console Drilling & Light Fitting**: Drill 16 22mm holes around the tabletop perimeter for the E14 amber light bulbs. Route the parallel wiring harness underneath to a centralized 12V power supply.
6.  **Install Player Terminals**: Drill holes for the 4 player stations (joystick shafts, pushbuttons). Mount the joysticks from the underside. Tap the arcade pushbuttons from the top-down until they click flush against the white timber panel.
7.  **Cable & Controller Harnessing**: Connect the joystick microswitches and button contacts to the Zero-Delay USB Encoder board for each terminal using 4.8mm spade crimp cables. Connect the 4 USB encoders to the Mini PC host.
8.  **Setup Coin Acceptors**: Mount the 4 coin validators on the vertical walls of the base pedestal beneath each player station. Install metal coin chute slide tracks directing all dropped tokens into heavy-duty plastic vaults inside the locked bottom doors.

---

### 3.3 Hardware-to-Software Code Mapping

The DeepSea King platform is programmed to bind seamlessly with physical USB hardware controllers:

#### Joystick Angle Vector Translation
Each player station's joystick registers as horizontal (`X`) and vertical (`Y`) inputs. These are mapped directly to the cannon turret angle calculations in `src/components/GameArena.tsx`:
```typescript
// Reading physical joystick axis offsets to rotate the turret gun
const handleJoystickMovement = (playerIndex: number, xAxis: number, yAxis: number) => {
  if (Math.abs(xAxis) > 0.15 || Math.abs(yAxis) > 0.15) {
    // Trigonometric translation of physical coordinate vector into visual radians
    const targetAngle = Math.atan2(yAxis, xAxis);
    playersRef.current[playerIndex].angle = targetAngle;
  }
};
```

#### Physical Coin Drop GPIO/Keyboard Event Handler
The mechanical coin validator outputs a 12V pulse (100ms duration) upon detecting a valid token. This pulse is routed to a USB interface board mapping to standard keyboard inputs (e.g., key code `C` for Seat 1):
```typescript
// Listening to keyboard inputs triggered by physical coin microswitches
window.addEventListener("keydown", (event) => {
  if (event.key === "c" || event.key === "C") {
    // Triggers playSynthSound("coin_drop"), increases user balance, and logs event
    handleCoinInsert(); 
  }
});
```

#### Blinking Cabinet Lights Relay Control
During Progressive Jackpot wins or Boss captures, the game logic triggers specific flash sequences. In land-based deployments, this maps to an FTDI USB-to-Relay module controlling the E14 amber light bulbs:
```javascript
// Relays high-priority cabinet light commands to physical USB Relay board
const triggerCabinetFlashPattern = async (winType) => {
  if (isPhysicalRelayConnected && serialConnection) {
    if (winType === "JACKPOT_WIN") {
      // Send hexadecimal code to flash perimeter E14 light bulbs in sequence
      await serialConnection.write(Buffer.from([0xAA, 0x01, 0x55])); 
    }
  }
};
```

---

## 4. Maintenance & Operations Runbook

This section contains technical guidelines for developers, math designers, and security engineers to maintain and calibrate the platform during live operations.

### 4.1 Adjusting Game Mathematics & Capture Probabilities
To modify how easy or hard it is for players to capture fish, you can alter the calculations located in `src/components/GameArena.tsx`.

The core capture formula resides in the collision matrix block:
```typescript
let damage = bullet.damage;
// To scale damage per weapon type dynamically:
if (bullet.type === WeaponType.LASER) damage *= 1.3; // 130% scalar multiplier
if (bullet.type === WeaponType.DRILL) damage *= 1.5; // 150% scalar multiplier
```
To adjust base fish health indices, update the `spawnFish` config array:
*   **Clownfish HP**: Increase from `5` to raise shot consumption rates for small yields.
*   **Steel Shark HP**: Increase from `60` to trigger a stronger "sunk cost" feeling on heavy fish.
*   **Golden Toad HP**: Modify from `150` to scale high-pacing bet matches.

---

### 4.2 Tuning Return-to-Player (RTP) & Margin Thresholds
The target RTP is managed dynamically from the `AdminConsole.tsx` dashboard and syncs down to the transaction engine.

1.  **Legal Compliance**: Regional gaming boards typically require an RTP between **92% and 98%**. If the operator moves the RTP slider below **90%**, the `AdminConsole` triggers an automatic warning indicator and files a high-severity critical audit log.
2.  **RTP Adaptive Algorithm ($A$)**:
    If actual payouts exceed budget boundaries:
    $$A = 1.0 + (\text{Target RTP} - \text{Actual RTP}) \times \gamma$$
    To tune the stabilizer speed, increase the coefficient $\gamma$. A higher $\gamma$ will result in faster, steeper capture probability adjustments when players win progressive jackpots.

---

### 4.3 Hardening Anti-Cheat Shields & Calibration
The platform relies on deep mathematical profiling to intercept game clients that bypass native logic:

*   **Auto-Fire / Macros**: Evaluates the standard deviation ($\sigma$) of the shot timestamp intervals. Humans cannot maintain consistent tap patterns down to millisecond intervals.
    *   *Tuning*: If standard deviation falls below `5ms` over 50 consecutive shots, flag the player as a script. If you encounter false positives with highly advanced touchscreens, raise the limit to `8ms`.
*   **Speed-Hacks**: If a user client pushes packet streams faster than the server clock interval ($> 150\text{ms}$ clock drift per second), log a security warning and disconnect the socket.
*   **Aim-Bots**: If angle changes occur instantly ($> 90^\circ$ sweep within 1 frame) and lock onto the center coordinate of a fish, flag the session for manual moderator review.

---

### 4.4 Adding Custom Spline Paths
To add an organic movement path (e.g., spiral vortexes or figure-eights), edit the parametric update formulas in `GameArena.tsx`:

```typescript
if (fish.pattern === "sinewave") {
  fish.y += Math.sin(fish.pathTime * 3) * 1.5;
} else if (fish.pattern === "coswave") {
  fish.y += Math.cos(fish.pathTime * 2) * 2.0;
}
```
To add a new path mapping:
1.  Add the identifier name to the `MovementPattern` union type inside `src/types.ts`.
2.  In `GameArena.tsx`, add a corresponding `else if (fish.pattern === "your_pattern")` block.
3.  Inject parametric equations utilizing `Math.sin`, `Math.cos`, or Bézier cubic multipliers.

---

## 5. High-Performance Deployment Specifications

To maintain a consistent **60FPS rendering performance** during heavy wave invasions with thousands of concurrent bullets, verify that the following optimizations remain active:

1.  **Texture Atlases / Sprite Batching**: All rendering files (clownfish, sharks, lasers, coin items) must be compiled into a single unified asset texture pack. This keeps GPU draw calls at **1** regardless of the active element count on screen.
2.  **Canvas Rendering Loop**: Use `requestAnimationFrame` for high frame updates. Avoid React rendering triggers inside the game loop to prevent DOM bottlenecks. Use referentially stable React callbacks (`useCallback`) to bridge game capture states over to the React layout.
3.  **Object Pools**: Keep the bullet pool active. Never use `new` allocations or let garbage collection trigger during gameplay. Reclaim dead bullets from the array by setting their index properties.

---

## 6. Operational Commands & Maintenance

### 1. Install Dependencies
```bash
npm install
```

### 2. Spin up Development Cluster
```bash
npm run dev
```

### 3. Build & Package for Production
```bash
npm run build
```

This compiles static SPA bundles into the `/dist` output directory, ready to be mounted onto nginx cloud clusters or deployed directly into land-based physical arcade machine memory files.
