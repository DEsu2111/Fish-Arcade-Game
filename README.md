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

## 2. Maintenance & Operations Runbook

This section contains technical guidelines for developers, math designers, and security engineers to maintain and calibrate the platform during live operations.

### 2.1 Adjusting Game Mathematics & Capture Probabilities
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

### 2.2 Tuning Return-to-Player (RTP) & Margin Thresholds
The target RTP is managed dynamically from the `AdminConsole.tsx` dashboard and syncs down to the transaction engine.

1.  **Legal Compliance**: Regional gaming boards typically require an RTP between **92% and 98%**. If the operator moves the RTP slider below **90%**, the `AdminConsole` triggers an automatic warning indicator and files a high-severity critical audit log.
2.  **RTP Adaptive Algorithm ($A$)**:
    If actual payouts exceed budget boundaries:
    $$A = 1.0 + (\text{Target RTP} - \text{Actual RTP}) \times \gamma$$
    To tune the stabilizer speed, increase the coefficient $\gamma$. A higher $\gamma$ will result in faster, steeper capture probability adjustments when players win progressive jackpots.

---

### 2.3 Hardening Anti-Cheat Shields & Calibration
The platform relies on deep mathematical profiling to intercept game clients that bypass native logic:

*   **Auto-Fire / Macros**: Evaluates the standard deviation ($\sigma$) of the shot timestamp intervals. Humans cannot maintain consistent tap patterns down to millisecond intervals.
    *   *Tuning*: If standard deviation falls below `5ms` over 50 consecutive shots, flag the player as a script. If you encounter false positives with highly advanced touchscreens, raise the limit to `8ms`.
*   **Speed-Hacks**: If a user client pushes packet streams faster than the server clock interval ($> 150\text{ms}$ clock drift per second), log a security warning and disconnect the socket.
*   **Aim-Bots**: If angle changes occur instantly ($> 90^\circ$ sweep within 1 frame) and lock onto the center coordinate of a fish, flag the session for manual moderator review.

---

### 2.4 Adding Custom Spline Paths
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

## 3. High-Performance Deployment Specifications

To maintain a consistent **60FPS rendering performance** during heavy wave invasions with thousands of concurrent bullets, verify that the following optimizations remain active:

1.  **Texture Atlases / Sprite Batching**: All rendering files (clownfish, sharks, lasers, coin items) must be compiled into a single unified asset texture pack. This keeps GPU draw calls at **1** regardless of the active element count on screen.
2.  **Canvas Rendering Loop**: Use `requestAnimationFrame` for high frame updates. Avoid React rendering triggers inside the game loop to prevent DOM bottlenecks. Use referentially stable React callbacks (`useCallback`) to bridge game capture states over to the React layout.
3.  **Object Pools**: Keep the bullet pool active. Never use `new` allocations or let garbage collection trigger during gameplay. Reclaim dead bullets from the array by setting their index properties.

---

## 4. Operational Commands & Maintenance

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
