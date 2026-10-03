# Phaser 4 + Angular — Ski Safari-Inspired Game

## Session Decisions & Implementation Log

> Decisions agreed with the developer during implementation. They override earlier wording in this document where they conflict.

| #   | Decision                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | **Phaser 4, not Phaser 3.** The repo installs `phaser@^4.2.1` and the reference shell (game-2) runs Phaser 4. Only one `phaser` package can be installed, so "preserve Phaser 3" (old Agent Rule 1 / tech constraints) is treated as stale text.                         |
| D2  | **Fresh folder.** game-3 lives in `src/app/game-3/`, mirroring game-2's shell: `component` → `service` (dynamic `import('phaser')`, SSR + double-init guards) → `game.config.ts` → `game-tunbles.ts` → `scenes/`.                                                        |
| D3  | **Ported prototype.** The `BootScene` / `MainScene` prototype described in §3 comes from `src/app/game/` (game-1) and is ported, never edited in place.                                                                                                                  |
| D4  | **No ESLint.** Only Prettier is installed. Verification loop = `npx tsc --noEmit -p tsconfig.app.json` → `npx prettier --check` → `npm run build`.                                                                                                                       |
| D5  | **SSR safety.** `/game-3` is registered as `RenderMode.Client` in `app.routes.server.ts` (same as `game`, `game-2`) so Phaser is never evaluated during prerender. Build reproduced the `window is not defined` failure before this was added.                           |
| D6  | **Placeholder art first.** Temporary textures are generated at runtime in `BootScene` via `graphics.generateTexture()` — no external assets / licensing burden until later milestones introduce real CC0 art (then `ASSETS.md`).                                         |
| D7  | **Contour terrain model.** Arcade physics has no rotated static bodies, so the downhill slope uses a surface contour `surfaceYAt(x)` + gravity + ground-snap (an "original simplified physics model" per Phase 5); Arcade handles the player body and hazard collisions. |
| D8  | **In-scene game-over overlay** (game-2 `showDialog` pattern); a dedicated `GameOverScene` is deferred until needed.                                                                                                                                                      |

### Step log

| Step                                                                                                                                                                                                     | Status  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Step 1 — scaffold + `Boot → Preload → Game` chain, loaded player sprite, keyboard + FPS, route + home pill                                                                                               | ✅ done |
| Step 2 — Arcade Physics player (Phase 2): gravity, velocity, jump, ground detection, landing, rotation, player FSM                                                                                       | ✅ done |
| Step 3 — Snow terrain (Phase 3): `TerrainGenerator` contour, world bounds + camera follow, ground-snap, downhill push, slope-banked rotation                                                             | ✅ done |
| Step 4 — Endless world (Phase 4): infinite procedural rollers, chunked stream + `chunkPool` reuse, endless physics/camera bounds                                                                         | ✅ done |
| Step 5 — Skiing mechanics (Phase 5): air control, spin + flip counting, landing alignment → `CRASHED` stun + recovery                                                                                    | ✅ done |
| Step 6 — Obstacles (Phase 6): deterministic slot placement, per-kind static-group pooling, overlap crash → game-over overlay (D8), ramp launch                                                           | ✅ done |
| Step 7 — Animals (Phase 7): `entities/animal.ts` config model + `AnimalSystem` streaming; mount applies speed/jump/stability + `doubleJump`; bad landing dismounts                                       | ✅ done |
| Step 8 — Score + combo (Phase 8): `ScoreSystem` + `ComboSystem` (distance/coins/air time/flips/landings × multiplier), `CoinSystem` pickups, score HUD + final score                                     | ✅ done |
| Step 9 — Difficulty scaling (Phase 9): `DifficultySystem` distance-driven progress scaling terrain complexity, obstacle/animal density, downhill speed (capped, x-deterministic)                         | ✅ done |
| Step 10 — Camera + background (Phase 10): `BackgroundSystem` parallax `TileSprite` layers (sky/clouds/far+mid mountains/foreground snow), physics-independent                                            | ✅ done |
| Step 11 — Particles/effects (Phase 11): `EffectsSystem` pooled emitters — snowfall, trail, landing/jump/crash/coin bursts (pooled, no per-frame creation)                                                | ✅ done |
| Step 12 — Audio (Phase 12): `AudioSystem` + `audio-keys.ts`; ambient wind bed, skiing loop, jump/land/crash/coin/combo/UI one-shots; assets in `public/sounds` (trimmed)                                 | ✅ done |
| Step 13 — Angular integration (Phase 13): `GameEventBus` on Phaser registry ↔ `Game3Component` signals; discrete game events (start/pause/over/score/crash/mount/restart), no per-frame change detection | ✅ done |
| Step 14 — Mobile/responsive controls (Phase 14): `InputSystem` abstracts keyboard + touch buttons + swipe into `left`/`right`/`jump`/`restart` semantics (gamepad-ready)                                 | ✅ done |

---

## 1. Project Goal

Build an original 2D endless skiing / snowboarding game inspired by the gameplay style of Ski Safari.

The game should run inside the existing Angular application using Phaser 3 + TypeScript.

The objective is both:

1. Build a playable game.
2. Use the project as a structured learning POC for Phaser 3, game architecture, physics, procedural generation, animation, performance, and Angular ↔ Phaser communication.

Do NOT copy Ski Safari's proprietary characters, artwork, sounds, branding, or other game assets.

Use original or properly licensed assets.

---

# 2. Technology Constraints

Use:

- Angular
- TypeScript
- Phaser 4 (installed `phaser@^4.2.1`, same version game-1 and game-2 use)
- Arcade Physics initially
- Existing Angular build/tooling
- Existing project conventions
- Prettier conventions already used by the project (no ESLint is configured)

> Decision D1: target Phaser 4. The older "preserve Phaser 3 / do not migrate to Phaser 4" wording is superseded — the repo already runs Phaser 4 and only one `phaser` package can be installed.

Do not introduce another game engine.

Do not replace Angular with a standalone Phaser application.

The Phaser game should remain a self-contained game subsystem hosted by Angular.

---

# 3. Current Starting Point

The prototype described below originated in `src/app/game/` (game-1). It was ported into `src/app/game-3/` and evolved into a three-scene chain:

```text
BootScene → PreloadScene → GameScene
```

## BootScene

Currently:

- Creates a temporary Graphics object.
- Draws a green rounded rectangle and a white snow square.
- Generates placeholder `player` / `snow` textures via `generateTexture`.
- Destroys the temporary Graphics object.
- Starts `PreloadScene`.

### PreloadScene

Currently:

- A thin seam for future asset loading.
- On loader `complete`, starts `GameScene`.

### GameScene

Currently (Phase 14 — Mobile / Responsive Controls):

- `TerrainGenerator` (`systems/terrain-generator.ts`) models an **infinite** procedural contour `surfaceYAt(x)` (large 2400px roller + small 700px bump harmonics around `SURFACE_MID_Y`), deterministic for any x.
- Terrain is streamed in **chunks** (`CHUNK_WIDTH` 800): chunks behind the camera are recycled into a `chunkPool`, chunks ahead are drawn/reused (`drawChunk` / `redrawChunk`) — no unbounded object growth.
- Camera/physics world are effectively endless: width `ENDLESS_WIDTH` (20M px), height bounded to `WORLD_HEIGHT` 900; deadzone (140×90) + lerp follow.
- Player is a dynamic Arcade body under gravity; vertical position is driven by the terrain, not free input.
- Ground model (decision D7): when falling and crossing the contour → snap to the surface, zero vertical velocity; grounded when `velocity.y >= 0` and body bottom reaches the surface.
- `DOWNHILL_PUSH` slides the player along the slope while grounded (momentum); left / right steering; UP / SPACE jump while grounded.
- (Phase 5) **Air tricks:** while airborne, LEFT / RIGHT rotate the sprite (`SPIN_SPEED`), and air steering is gentler (`AIR_HORIZONTAL_SPEED`); full 360° spins accumulate a flip count (`trackFlips`, a jump resets it).
- (Phase 5) **Landing quality:** on ground contact the sprite's rotation is compared to the local slope angle; within `LANDING_ALIGN_TOLERANCE` → successful landing (flip count kept, `LANDING` lock); beyond it → `CRASHED` (red tint + small camera shake + stun for `CRASH_COOLDOWN_MS`, then auto-recover to the slope).
- (Phase 6) **Obstacles:** `ObstacleSystem` (`systems/obstacle-system.ts`) places obstacles deterministically per `OBSTACLE_SLOT_WIDTH` slot (hash-based kind via `OBSTACLE_DENSITY`), streaming + recycling them through per-kind `StaticGroup` pools as the camera moves.
- (Phase 6) Tree / rock / snow pile are solid hazards (overlap-only, decision: pass-through-and-die) that end the run; ramps are sensors that launch the player (`PLAYER_RAMP_LAUNCH_VELOCITY`).
- (Phase 7) **Rideable animals:** `AnimalSystem` (`systems/animal-system.ts`) streams a first rideable creature (`entities/animal.ts` config: `speed`, `jumpPower`, `stability`, `ability`) deterministically per `ANIMAL_SLOT_WIDTH` slot and recycles it through a pooled `StaticGroup`. Contact mounts it (consumed for the run).
- (Phase 7) **Mounted movement:** speed scales move/air velocity (`speed`), jump uses `jumpPower`, landing tolerance widens by `stability`, and the `doubleJump` ability grants one extra mid-air jump. A too-steep landing while mounted **dismounts** (loses the animal) instead of crashing; a normal crash still stuns/game-overs.
- (Phase 8) **Score + combo:** `ScoreSystem` (`systems/score-system.ts`) aggregates distance, coins, air time, flips and successful landings, then multiplies by a `ComboSystem` (`systems/combo-system.ts`) multiplier that grows on successful landings/flips and resets on a crash/dismount.
- (Phase 8) **Coins:** `CoinSystem` (`systems/coin-system.ts`) streams pooled, non-blocking coin pickups above the contour per `COIN_SLOT_WIDTH` slot; overlap collects them for points. Multi-line HUD shows score/coins/combo; the game-over overlay shows the final score.
- (Phase 9) **Difficulty scaling:** `DifficultySystem` (`systems/difficulty-system.ts`) derives a 0→1 `progress` from forward distance (`DIFFICULTY_RAMP_DISTANCE`), then scales terrain complexity (amplitude), obstacle/animal density, and downhill speed — all additive, capped bonuses that avoid unfairness. Because it is a pure function of `x`, terrain stays deterministic and streamed chunks remain valid.
- (Phase 10) **Camera + parallax background:** `BackgroundSystem` (`systems/background-system.ts`) adds screen-pinned `TileSprite` layers — sky gradient, clouds, far mountains, mid mountains, and foreground snow — with per-layer scroll multipliers (`BG_PARALLAX_*`) and no physics bodies. Camera follow (deadzone + lerp) remains the gameplay camera.
- (Phase 11) **Particles/effects:** `EffectsSystem` (`systems/effects-system.ts`) owns a fixed set of pooled emitters — one ambient screen-space snowfall emitter, one low-frequency trail emitter that follows the player (enabled only while grounded and moving), and four `explode()`-based bursts (landing, jump, crash, coin). No per-frame emitter creation; counts live in `EFFECT_*` tunables.
- (Phase 12) **Audio:** `AudioSystem` (`systems/audio-system.ts`) manages a looping ambient wind bed, a looping ski slide that toggles with grounded movement, and one-shot jump/landing/crash/coin/combo/UI sounds. Audio is defined in `audio-keys.ts` (`AUDIO_KEYS` + `AUDIO_FILES`) and loaded by `PreloadScene`; it is idempotent across `scene.restart()` (guards on `sound.getAll`/`isPlaying`) and respects the browser autoplay lock (ambient starts on first input).
- (Phase 13) **Angular bridge:** a framework-agnostic `GameEventBus` (`game-events.ts`) is registered on the Phaser game registry by `Game3Service` and emits `GAME_STARTED`, `GAME_PAUSED`, `GAME_OVER`, `SCORE_CHANGED`, `PLAYER_CRASHED`, `PLAYER_MOUNTED`, `GAME_RESTARTED`. `Game3Component` subscribes and mirrors run state into signals (Angular HUD panel + "Ski again" button), updating only on discrete events — never per frame (`SCORE_CHANGED` is emitted per `SCORE_EVENT_STEP` of score, not every tick).
- (Phase 14) **Abstracted input:** `InputSystem` (`systems/input-system.ts`) exposes a semantic API (`left`, `right`, `jumpJustPressed()`, `restartJustPressed()`) that merges keyboard (arrows + WASD + space/up, R to restart), on-screen touch buttons (left/right/JUMP, shown when `device.input.touch`), and an optional swipe-up-to-jump gesture. `GameScene` reads only these semantics — no direct keyboard access.
- State machine now `IDLE → SKIING → AIRBORNE → LANDING → CRASHED`; grounded rotation banks to the local slope angle.
- **Game over:** an in-scene overlay (decision D8) is shown on obstacle contact; `R` restarts the scene (`scene.restart()`, which re-runs `create`). Player physics is frozen while the overlay is up.
- HUD: a score/coins/combo line plus a debug line (FPS, player state, flips, mount, difficulty %, active chunk count), both pinned with `setScrollFactor(0)`.

This code remains the starting point for the later phases and is preserved rather than discarded.

---

# 4. Target Architecture

Gradually evolve the current structure into:

```text
Phaser
│
├── BootScene
│
├── PreloadScene
│
├── MenuScene
│
├── GameScene
│
├── GameOverScene
│
├── entities/
│   ├── Player
│   ├── Obstacle
│   ├── Animal
│   ├── Coin
│   └── PowerUp
│
├── systems/
│   ├── TerrainGenerator
│   ├── ScoreSystem
│   ├── DifficultySystem
│   ├── SpawnSystem
│   └── ComboSystem
│
├── config/
│   ├── game-config
│   ├── player-config
│   └── asset-keys
│
└── utils/
```

Do not create all of these files immediately.

Introduce abstractions only when the corresponding feature requires them.

---

# 5. Scene Responsibilities

## BootScene

Responsibility:

- Minimal game initialization.
- Configure / prepare shared resources if necessary.
- Start PreloadScene.

Avoid putting gameplay logic here.

Target:

```text
BootScene
   ↓
PreloadScene
```

---

## PreloadScene

Introduce this after the initial prototype.

Responsibility:

- Load shared game assets.
- Load player spritesheets.
- Load terrain assets.
- Load obstacle assets.
- Load UI assets.
- Load audio.
- Display loading progress if useful.
- Start MenuScene after loading.

Phaser's Loader is designed for this purpose, and `preload()` is the normal location for adding assets to the loader. Asset keys should be unique and then referenced throughout the game.

Target:

```text
PreloadScene
   │
   ├── player spritesheet
   ├── terrain
   ├── obstacles
   ├── background
   ├── UI
   └── audio
          ↓
      MenuScene
```

---

## MenuScene

Minimal first version:

- Game title
- Start button
- Instructions
- Optional sound toggle

Later this can remain mostly Phaser UI or communicate with Angular UI depending on the final application architecture.

---

## GameScene

This is the main gameplay scene.

Responsibilities:

- Player
- Camera
- Terrain
- Physics
- Obstacles
- Animals
- Collectibles
- Score
- Combo
- Difficulty
- Procedural world generation
- Game events
- Game-over detection

Avoid turning `GameScene` into a giant class.

Move reusable systems/entities into separate classes when complexity increases.

---

## GameOverScene

Display:

- Final score
- Best score
- Restart
- Return to menu

---

# 6. Development Phases

## Phase 1 — Clean Current Prototype

Start from the existing `BootScene` and `MainScene`.

Goals:

- Preserve current working movement.
- Introduce proper asset loading.
- Replace generated rectangle with a loaded player sprite.
- Introduce `PreloadScene`.
- Keep FPS debugging available during development.

Do not implement terrain yet.

Definition of done:

```text
Game launches
→ assets load
→ player appears
→ keyboard works
→ FPS works
```

---

# Phase 2 — Player + Arcade Physics

Replace manual:

```ts
player.x += step;
player.y += step;
```

with Phaser Arcade Physics where appropriate.

Use:

```ts
this.physics;
```

and physics-enabled sprites.

Arcade Physics provides velocity, acceleration, gravity and collision support and is appropriate for simple arcade-style gameplay.

Introduce:

- gravity
- velocity
- jump
- ground detection
- falling
- landing
- basic rotation

Target player state:

```text
IDLE
RUNNING / SKIING
AIRBORNE
LANDING
CRASHED
```

Do not build complicated physics before the basic loop works.

> Status: DONE (Step 2). Player is a dynamic Arcade body under gravity with left/right velocity, grounded-only jump, state machine `IDLE / SKIING / AIRBORNE / LANDING`, basic airborne rotation, and a temporary flat test ground (replaced by the Phase 3 slope). `CRASHED` arrives with obstacles in Phase 6.

---

# Phase 3 — Snow Terrain

Replace the simple screen-bound movement with a downhill skiing environment.

Initial goal:

```text
       Player
          ↓
         🧍
        /
       /
______/____________________
```

Implement:

- snow ground
- slope
- terrain collision
- camera following
- horizontal world movement
- basic downhill motion

The player should no longer freely move vertically.

Instead:

```text
Player
   ↓
interacts with terrain
   ↓
gravity / slope
   ↓
momentum
```

> Decision D7: the slope is implemented as a surface contour `surfaceYAt(x)` with gravity and ground-snap, not Arcade slope bodies — Arcade physics has no rotated static bodies. Arcade collision is reserved for obstacles/hazards.

> Status: DONE (Step 3). The temporary test ground is gone. The player rides the contour with ground-snap, banks into the slope, and the camera follows across a 4800×900 world. Phase 4 replaces the fixed world with regenerating chunks.

---

# Phase 4 — Endless World

Introduce procedural terrain generation.

The world should continuously create new terrain ahead of the player.

Conceptually:

```text
        CAMERA
           ↓

[old][old][current][next][next][future]
                    ↑
                  player
```

When terrain is sufficiently far behind the player:

```text
remove old terrain
generate new terrain
```

Avoid continuously creating unlimited objects.

Use cleanup and object pooling where appropriate.

The free Ourcade Phaser 3 TypeScript infinite-runner material specifically covers infinite scrolling and object pools, making it a useful reference for this phase.

> Status: DONE (Step 4). Fixed-width world replaced with infinite procedural rollers + chunk streaming (pooled) terrain; camera/physics bounds are effectively endless while only ~3-4 chunks stay alive. The temporary finite `WORLD_WIDTH` / straight-drop slope is gone.

---

# Phase 5 — Skiing Mechanics

Implement the main game feel.

Player should support:

- downhill acceleration
- jump
- air control
- rotation
- flips
- landing
- crash

Example state:

```text
SKIING
   ↓
JUMP
   ↓
AIRBORNE
   ↓
ROTATE / FLIP
   ↓
LAND
   │
   ├── successful → continue
   │
   └── bad landing → crash
```

Do not attempt to perfectly reproduce Ski Safari physics.

Create an original simplified physics model.

> Status: DONE (Step 5). The player has air control + controlled spin with flip counting, and landing quality is checked against the slope angle — misaligned landings trigger a temporary `CRASHED` stun (crash → game-over wiring arrives with obstacles in Phase 6).

---

# Phase 6 — Obstacles

Introduce:

- trees
- rocks
- snow piles
- ramps
- cliffs
- other hazards

Create an `Obstacle` abstraction only when multiple obstacle types need shared behavior.

Example:

```text
Obstacle
├── Tree
├── Rock
├── SnowPile
└── Ramp
```

Use groups for repeated objects.

Destroy or recycle objects that move outside the active game area.

> Status: DONE (Step 6). `ObstacleSystem` implements trees, rocks, snow piles and ramps via per-kind `StaticGroup` pools, placed deterministically per slot and streamed/recycled with the camera. Solids are overlap-only (pass-through-and-die) and trigger the in-scene game-over overlay (D8); ramps are sensors that launch the player. Deferred: dedicated cliff hazard (steep rollers currently stand in) and obstacle randomization/difficulty (Phase 9).

---

# Phase 7 — Animals / Rideable Objects

Add the distinctive gameplay layer.

Examples:

```text
Player
  ↓
encounters animal
  ↓
mount
  ↓
different movement properties
```

Potential initial animals:

- penguin
- wolf
- bear
- fictional snow creature

Use original designs.

Each rideable entity can eventually have:

```text
speed
jumpPower
stability
specialAbility
```

Do not implement multiple animals until the first one is fun and stable.

> Status: DONE (Step 7). One rideable animal (wolf) implemented with an `AnimalKind`/`AnimalConfig` model (`speed`, `jumpPower`, `stability`, `ability`) in `entities/animal.ts`, spawned/recycled by `systems/animal-system.ts`. Mounting applies the movement profile and the `doubleJump` ability; a bad landing dismounts instead of crashing. Only the first animal exists on purpose — add more once this one feels stable (Phase 9 can tune spawn cadence).

---

# Phase 8 — Score + Combo

Implement:

```text
distance score
+
coins
+
air time
+
flips
+
successful landings
+
combo
```

Example:

```text
Jump
 ↓
1 flip
 ↓
2 flips
 ↓
3 flips
 ↓
land successfully
 ↓
combo multiplier
```

Create a `ScoreSystem` rather than putting all scoring calculations inside `GameScene`.

> Status: DONE (Step 8). `ScoreSystem` aggregates distance, coins, air time, flips and successful landings; `ComboSystem` provides the multiplier (grows on success, resets on crash/dismount). `CoinSystem` adds pooled coin pickups, and both the HUD and the game-over overlay surface the score. Tuning lives in `game-tunbles.ts` (`DISTANCE_POINTS_PER_PX`, `COIN_POINTS`, `AIR_TIME_POINTS_PER_SEC`, `FLIP_POINTS`, `LANDING_POINTS`, `COMBO_STEP`, `COMBO_MAX_MULTIPLIER`).

---

# Phase 9 — Difficulty Scaling

Difficulty should gradually increase.

Possible variables:

```text
terrain complexity
obstacle frequency
downhill speed
jump difficulty
gap frequency
enemy / animal frequency
```

Create a `DifficultySystem`.

Do not make the game unfair.

> Status: DONE (Step 9). `DifficultySystem` ramps a 0→1 progress from distance and drives four capped bonuses: terrain amplitude (`complexityAt`), obstacle density, animal density, and downhill speed (all in `game-tunbles.ts` as `DIFFICULTY_*`). A full-progress run is faster with taller rollers and more hazards, but the ramp is long and the bonuses are additive so it stays fair. Deferred: gaps/enemies (no dedicated enemy type yet) and jump-difficulty tuning.

---

# Phase 10 — Camera + Background

Implement:

- camera following
- snowy mountain background
- parallax layers
- foreground snow
- distant mountains
- clouds / fog
- optional weather

Use multiple layers:

```text
Background
   ↓
Far mountains
   ↓
Mid mountains
   ↓
Gameplay terrain
   ↓
Foreground effects
```

Keep decorative layers independent from physics.

> Status: DONE (Step 10). `BackgroundSystem` renders sky, clouds, far/mid mountains and foreground snow as `TileSprite` layers pinned to the screen (`setScrollFactor(0)`) with per-layer `tilePositionX` multipliers, so they parallax infinitely without world objects or physics bodies. Camera follow was already in place. Deferred: weather (fog/snowfall overlay) belongs with Phase 11 particles; background art is placeholder.

---

# Phase 11 — Particles and Effects

Add:

- snow particles
- landing snow
- crash effect
- jump effect
- speed effect
- trail
- collectible effect

Phaser particle effects should be used carefully.

Avoid creating/destroying large numbers of particles continuously if an emitter/pooling solution is appropriate.

Kenney's Particle Pack is CC0 and can be used as a useful prototype VFX source.

> Status: DONE (Step 11). `EffectsSystem` implements ambient snowfall, a skiing trail, and landing/jump/crash/coin bursts. All effects are a fixed pool of `ParticleEmitter`s created once; bursts use `explode()` and the trail is toggled on/off, so nothing is created or destroyed per frame. A 6×6 white circle (`ASSET_KEYS.particle`) is the shared particle texture (tinted per effect). Deferred: speed lines and a distinct crash/weather overlay.

---

# Phase 12 — Audio

Add:

- background music
- skiing sound
- snow movement
- jump
- landing
- crash
- coin pickup
- combo
- UI clicks

Use CC0/public-domain sources where possible.

Useful resources include:

- OpenGameArt snow sounds
- OpenGameArt CC0 audio collections
- Kenney UI audio

Examples of CC0 snow sounds include dry and wet snow footsteps.

> Status: DONE (Step 12). `AudioSystem` provides the ambient wind bed (`wind.mp3`, looping), skiing slide (`ski_loop.wav`, looping while grounded+moving), and one-shots for jump (`jump.wav`), landing (`landing.wav`), crash (`crash.wav`), coin (`coin.wav`), combo (`combo.wav`), and UI click (`ui_click.wav`). Assets live in `public/sounds/` (trimmed to only the 8 files actually referenced), are loaded in `PreloadScene`, and volumes are in `AUDIO_VOLUME_*` tunables. Background _music_ was not in the supplied pack, so the ambient wind loop stands in (noted as deferred).

---

# Phase 13 — Angular Integration

Keep Phaser responsible for:

```text
gameplay
physics
rendering
game loop
game entities
```

Keep Angular responsible for application-level UI/state where appropriate.

Possible communication:

```text
Angular
   ↕
EventBus / service
   ↕
Phaser
```

Potential events:

```text
GAME_STARTED
GAME_PAUSED
GAME_OVER
SCORE_CHANGED
PLAYER_CRASHED
PLAYER_MOUNTED
GAME_RESTARTED
```

Do not introduce Angular change detection into the Phaser game loop.

Do not call Angular state updates every Phaser frame unless absolutely necessary.

> Status: DONE (Step 13). `GameEventBus` (`game-events.ts`, no Angular dependency) is passed into `Game3Service.create(container, bus)` and stored on `game.registry`; `GameScene` emits via a small `emitEvent` helper and `Game3Component` subscribes, mirroring state into signals for an Angular HUD panel. Phaser keeps full ownership of gameplay/physics/render/loop; Angular only reacts to discrete events and its signal writes are wrapped in `NgZone.run` so the Phaser loop stays out of change detection. `SCORE_CHANGED` is throttled to `SCORE_EVENT_STEP`. `GAME_PAUSED` currently reflects run start/end (no dedicated pause screen yet).

---

# Phase 14 — Mobile / Responsive Controls

After desktop gameplay is stable:

Support:

- keyboard
- touch
- mobile buttons
- optional swipe controls

Input should be abstracted so gameplay doesn't depend directly on keyboard input.

Example:

```text
Input
├── Keyboard
├── Touch
└── Gamepad
       ↓
Player Control
```

> Status: DONE (Step 14). `InputSystem` is the single input boundary: it merges keyboard, on-screen touch buttons and swipe gestures into semantic actions consumed by `GameScene`. Touch buttons and swipe only activate on touch-capable devices; the keyboard remains the desktop path. Gamepad is not wired yet (the abstraction leaves room for it). Button size/swipe threshold live in `TOUCH_*` tunables.

---

# Phase 15 — Performance

Measure before optimizing.

Monitor:

- FPS
- active game objects
- texture sizes
- particle counts
- object creation/destruction
- terrain cleanup
- memory usage

Important rule:

```text
Do not keep infinite world objects alive.
```

Use:

```text
pool
 ↓
reuse
 ↓
move
 ↓
disable
 ↓
reuse
```

where appropriate.

---

# 7. Asset Strategy

Do not start with final artwork.

Use placeholder assets first.

Recommended progression:

```text
Phase 1:
simple rectangles

Phase 2:
temporary sprites

Phase 3:
consistent asset pack

Phase 4:
final art direction
```

This prevents spending time making the game look good before the gameplay works.

> Decision D6: until real assets are added, placeholder textures are generated at runtime in `BootScene` via `graphics.generateTexture()` (simple rectangles / temporary sprites from the progression above).

---

# 8. Recommended Asset Sources

## A. Kenney

Use Kenney as the primary source for prototype assets.

Kenney assets are particularly useful because many packs are explicitly CC0.

Useful packs:

### Platformer Art Pixel

CC0, 900+ files.

Useful for:

- characters
- terrain
- objects
- prototype environment

[Kenney Platformer Art Pixel](https://kenney.nl/assets/platformer-art-pixel?utm_source=chatgpt.com)

### New Platformer Pack

A newer 2D pack with 440+ files and CC0 licensing.

[Kenney New Platformer Pack](https://kenney.nl/assets/new-platformer-pack?utm_source=chatgpt.com)

### Foliage Pack

Useful for:

- trees
- vegetation
- environment decoration

CC0.

[Kenney Foliage Pack](https://kenney.nl/assets/foliage-pack?utm_source=chatgpt.com)

### Foliage Sprites

Useful for 2D environmental decoration and VFX.

CC0.

[Kenney Foliage Sprites](https://kenney.nl/assets/foliage-sprites?utm_source=chatgpt.com)

### Particle Pack

Useful for:

- snow
- impact
- speed
- environment particles

CC0.

[Kenney Particle Pack](https://kenney.nl/assets/particle-pack?utm_source=chatgpt.com)

---

# 9. UI Assets

Useful Kenney UI resources:

## UI Pack

430+ files, CC0.

[Kenney UI Pack](https://kenney.nl/assets/ui-pack?utm_source=chatgpt.com)

### Pixel UI Pack

750+ files, CC0.

[Kenney Pixel UI Pack](https://kenney.nl/assets/pixel-ui-pack?utm_source=chatgpt.com)

### UI Pack - Adventure

130+ files, CC0.

[Kenney UI Pack Adventure](https://kenney.nl/assets/ui-pack-adventure?utm_source=chatgpt.com)

---

# 10. Fonts

Kenney Fonts provides game-oriented fonts under CC0.

[Kenney Fonts](https://kenney.nl/assets/kenney-fonts?utm_source=chatgpt.com)

Use one consistent font for:

- score
- combo
- buttons
- game-over screen

---

# 11. Audio

## Snow / movement SFX

OpenGameArt has CC0 snow-step recordings that can be adapted for skiing/snow movement.

[CC0 dry snow steps](https://opengameart.org/content/4-dry-snow-steps?utm_source=chatgpt.com)

[CC0 wet snow steps](https://opengameart.org/content/9-wet-snow-steps?utm_source=chatgpt.com)

## Snow music

A recent CC0 snow-themed loop:

[Snow Theme — Through the Snow](https://opengameart.org/content/snow-theme?utm_source=chatgpt.com)

It is explicitly CC0 and intended for snowy/winter environments.

## Alternative snow music

`Black Diamond` is a CC0 winter/snowboarding-oriented track.

[Black Diamond — OpenGameArt](https://opengameart.org/content/black-diamond?utm_source=chatgpt.com)

## UI sounds

Kenney provides CC0 UI audio.

[Kenney UI Audio](https://kenney.nl/assets/ui-audio?utm_source=chatgpt.com)

---

# 12. Winter Art Search

For assets specifically matching the snow/winter theme, use the following repositories:

## itch.io

There is an active free 2D snow asset category containing:

- sprites
- backgrounds
- characters
- tilesets
- textures
- UI

[itch.io Free 2D Snow Assets](https://itch.io/game-assets/top-rated/free/tag-2d/tag-snow?utm_source=chatgpt.com)

The licensing must be checked for each individual pack.

Do not assume every asset on itch.io is CC0.

### OpenGameArt

Use the CC0 resources collection when possible.

[OpenGameArt CC0 Resources](https://opengameart.org/content/cc0-resources?utm_source=chatgpt.com)

---

# 13. Recommended Phaser Learning Resources

## Official Phaser documentation

Use this as the primary technical reference.

[Phaser Scenes Documentation](https://docs.phaser.io/phaser/concepts/scenes?utm_source=chatgpt.com)

Useful topics:

- Scenes
- Loader
- Game Objects
- Input
- Physics
- Cameras
- Tweens
- Animations

Phaser Scenes own systems such as input, physics and game objects, which fits the architecture planned above.

---

## Phaser Loader

Use this when implementing `PreloadScene`.

[Phaser Loader Documentation](https://docs.phaser.io/phaser/concepts/loader?utm_source=chatgpt.com)

---

## Arcade Physics

Use this for the first physics implementation.

[Phaser Arcade Physics Documentation](https://docs.phaser.io/phaser/concepts/physics/arcade?utm_source=chatgpt.com)

---

# 14. Infinite Runner Reference Project

Use this as a reference implementation rather than blindly copying it.

[Infinite Runner Phaser 3 + TypeScript — GitHub](https://github.com/ag-game/infinite-runner-phaser3?utm_source=chatgpt.com)

It is MIT licensed and was created alongside the free Infinite Runner in Phaser 3 with TypeScript book.

Another implementation:

[Phaser 3 Infinite Runner — saltymouse](https://github.com/saltymouse/phaser3-infinite-runner?utm_source=chatgpt.com)

This project is also MIT licensed and references Kenney artwork and Phaser TypeScript resources.

---

# 15. Free Infinite Runner Book

Use:

[Infinite Runner in Phaser 3 with TypeScript — Ourcade](https://ourcade.co/books/infinite-runner-phaser3/?utm_source=chatgpt.com)

Topics include:

- TypeScript
- infinite scrolling
- object pools
- state machines
- UI
- animations
- game architecture

The complete PDF is offered free by Ourcade.

---

# 16. Phaser by Example

Also use:

[Phaser by Example — official Phaser resource](https://phaser.io/news/2024/04/phaser-by-example-book?utm_source=chatgpt.com)

This is a free 500-page book covering Phaser 3.80 and multiple game genres, including an infinite runner, platformer, puzzle game and more.

---

# 17. Asset Folder Structure

Use a structure similar to:

```text
public/
└── assets/
    ├── images/
    │   ├── player/
    │   ├── animals/
    │   ├── terrain/
    │   ├── obstacles/
    │   ├── background/
    │   ├── effects/
    │   └── ui/
    │
    ├── audio/
    │   ├── music/
    │   └── sfx/
    │
    └── fonts/
```

Do not put random downloaded assets directly into the project.

Each asset should have:

```text
asset
source
license
author
usage notes
```

Keep a simple:

```text
ASSETS.md
```

containing:

```text
Asset:
Source:
Author:
License:
URL:
Used for:
```

This is especially important for assets from itch.io/OpenGameArt where licenses vary.

---

# 18. First Playable Milestone

Do NOT implement the whole game initially.

The first milestone should only be:

```text
Game starts
   ↓
Snow background
   ↓
Player skis downhill
   ↓
Terrain scrolls
   ↓
Player can jump
   ↓
Player lands
   ↓
One obstacle
   ↓
Collision
   ↓
Game over
   ↓
Restart
```

If this is fun, continue.

---

# 19. Second Playable Milestone

Add:

```text
procedural terrain
+
multiple obstacles
+
distance score
+
speed increase
+
basic combo
+
snow particles
+
sound
```

---

# 20. Third Playable Milestone

Add:

```text
animals
+
mounting
+
special abilities
+
ramps
+
flips
+
better camera
+
parallax
```

---

# 21. Final Milestone

Add:

```text
Angular UI
+
mobile controls
+
settings
+
audio settings
+
persistent high score
+
responsive scaling
+
performance optimization
+
polished art
+
polished effects
```

---

# 22. Agent Rules

The agent MUST:

1. Preserve Phaser 4 (D1).
2. Preserve TypeScript.
3. Preserve Angular as the host application.
4. Avoid unnecessary dependencies.
5. Prefer Phaser APIs over direct DOM manipulation.
6. Keep Phaser game-loop code inside Phaser.
7. Avoid Angular change detection on every Phaser frame.
8. Use proper Phaser Scene lifecycle methods.
9. Use `preload()` for asset loading.
10. Use Arcade Physics for the initial physics model.
11. Prefer reusable entities/systems as complexity increases.
12. Avoid one giant `GameScene`.
13. Reuse/pool frequently spawned objects where appropriate.
14. Remove objects that leave the active world.
15. Keep asset keys centralized.
16. Keep an asset/license record.
17. Use CC0/public-domain assets where possible.
18. Verify the license of every third-party asset before adding it.
19. Do not copy Ski Safari proprietary assets or branding.
20. Build original gameplay and art direction.
21. Make one small playable milestone at a time.
22. Do not prematurely optimize.
23. Keep the existing project lint/type-check/build commands working.

---

# 23. Agent Working Method

For every feature:

```text
1. Explain the Phaser concept.
2. Inspect the existing implementation.
3. Make the smallest change.
4. Run typecheck.
5. Run prettier `--check` on changed files (D4: no ESLint is configured in this repo).
6. Run build.
7. Test the game manually.
8. Explain what changed.
9. Only then continue to the next feature.
```

Do not implement multiple major systems in one uncontrolled change.

---

# 24. First Task for the Agent

Start ONLY with the architecture and first milestone.

Tasks:

1. Inspect the existing Angular + Phaser project.
2. Identify Phaser version.
3. Identify the existing Phaser entry point/configuration.
4. Keep the existing `BootScene` and `MainScene`.
5. Introduce `PreloadScene`.
6. Move actual asset loading into `PreloadScene`.
7. Replace the generated player rectangle with a temporary loaded sprite.
8. Keep keyboard movement working.
9. Do not add physics yet.
10. Do not add procedural terrain yet.
11. Do not add animals yet.
12. Do not add external assets until the asset structure is established.
13. Run typecheck/lint/build.
14. Report the resulting architecture before continuing.

After this milestone is confirmed, proceed to Arcade Physics.

> Status: all §24 sub-tasks are DONE for the deployed Step 1 scaffold (see "Step log"). Phaser version identified = 4.2.1; entry point = `game-3.service.ts` → `createGameConfig`. Verified with D4. Next milestone: Phase 2 — Arcade Physics player.
