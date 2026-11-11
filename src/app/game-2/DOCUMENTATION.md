# GAME 2 — DEMO Documentation

A side-scrolling platformer built with **Phaser 4** inside an **Angular** app. The player runs along a wide level, collects stars before the clock runs out, and advances through four progressively harder levels.

- **Rendering / engine:** Phaser 4 (`phaser` in `dependencies`)
- **Shell:** Angular 22 component + service that bootstraps and destroys the Phaser game
- **Code location:** `src/app/game-2/`

---

## 1. File map

| File                    | Responsibility                                                      |
| ----------------------- | ------------------------------------------------------------------- |
| `game.config.ts`        | Viewport size, physics gravity, render settings, scene registration |
| `game-tunbles.ts`       | All tunable constants and the level configuration table             |
| `scenes/first-scene.ts` | The single parameterized scene that runs every level                |
| `game-2.component.ts`   | Angular host component (provides the DOM container)                 |
| `game-2.service.ts`     | Lazily creates the Phaser `Game` and destroys it on teardown        |

---

## 2. Boot process (Angular → Phaser)

1. `game-2.component.ts` exposes a `<div>` via `viewChild.required('gameContainer')`.
2. In `ngAfterViewInit` it calls `gameService.create(container)`.
3. `game-2.service.ts` **dynamically imports** Phaser (so it isn't bundled into the initial page load), guards against SSR (`isPlatformBrowser`) and double-init (`if (.game)`), then builds:
   ```ts
   new PhaserModule.Game(createGameConfig(container));
   ```
4. `ngOnDestroy` → `gameService.destroy()` → `game.destroy(true)` tears everything down.

---

## 3. `game.config.ts` — engine configuration

- `GAME_WIDTH = 800`, `GAME_HEIGHT = 600` — the **viewport** (what you see on screen).
- `type: Phaser.AUTO` — WebGL preferred, Canvas fallback.
- `scale`: `FIT` + `CENTER_BOTH` — scales the canvas to fit its parent and centers it.
- `render`: `pixelArt: true` + `roundPixels: true` — keeps the retro sprite look crisp.
- `physics.arcade`: gravity `{ x: 0, y: 300 }` (global downward pull), `debug: false`.
- `scene: [FirstScene]` — the game boots straight into the `FirstScene`.

> `scene: [FirstScene]` means Phaser auto-starts `FirstScene` with **no data**, so `init()` defaults to level 1.

---

## 4. `game-tunbles.ts` — constants & level table

### `LevelConfig` interface

```ts
export interface LevelConfig {
  timeSeconds: number; // countdown for the level (seconds)
  starsRequired: number; // stars to collect in order to PASS the level
  spawnInitialBomb: boolean; // whether a bomb exists from the moment the level starts
  bombIntervalMs: number; // spawn a new bomb every N ms; 0 = never
}
```

### Level table (`LEVELS`)

| Level | Time | Stars to pass | Start bomb | Bomb every |
| ----- | ---: | ------------: | :--------: | ---------: |
| 1     |  60s |            12 |     no     |          — |
| 2     |  60s |            12 |    yes     |         5s |
| 3     |  45s |            12 |    yes     |         5s |
| 4     |  45s |        **16** |    yes     |         5s |

**Level 4 is special:** only `STAR_COUNT = 12` stars exist, but you need 16. When the first 12 are gone, `respawnStars()` re-enables them at the top of the screen so you can collect 4 more (see §6.9).

### Gameplay tunables

| Constant                 |      Value | Meaning                                                               |
| ------------------------ | ---------: | --------------------------------------------------------------------- |
| `WORLD_WIDTH`            |       2400 | Total level width (3× viewport) — the world is bigger than the screen |
| `CAMERA_LERP_X / _Y`     | 0.1 / 0.15 | Smooth-follow strength per axis                                       |
| `CAMERA_DEADZONE_W / _H` |   160 / 80 | Camera only starts moving once the player exits this box              |
| `PLAYER_MOVE_VELOCITY`   |        160 | Horizontal run speed (px/s)                                           |
| `PLAYER_JUMP_VELOCITY`   |       -330 | Upward impulse on jump                                                |
| `PLAYER_BOUNCE`          |        0.4 | Player bounce off floors                                              |
| `STAR_VALUE`             |         10 | Points per star                                                       |
| `STAR_COUNT`             |         12 | Stars drawn per batch                                                 |
| `TIME_BONUS_PER_SECOND`  |          5 | Score awarded per remaining second when a level ends                  |
| `BOMB_SPAWN_Y`           |         16 | Height at which bombs drop in from                                    |

---

## 5. Scene lifecycle overview (`scenes/first-scene.ts`)

Phaser drives every scene through a fixed set of hooks. `FirstScene` implements four of them:

```
init(data)  →  preload()  →  create()  →  update()   (every frame)
                │              │             │
                │              └─ builds all objects once (+ camera)
                └─ loads assets (textures)
```

| Hook you see here | Called                      | Purpose                                           |
| ----------------- | --------------------------- | ------------------------------------------------- |
| `constructor`     | once, at game boot          | Registers the scene key `'FirstScene'`            |
| `init(data)`      | every time the scene starts | Reads level + carried score from scene data       |
| `preload()`       | once per scene start        | Loads the PNG assets & the player spritesheet     |
| `create()`        | once per scene start        | Builds world, player, camera, stars, bombs, HUD   |
| `update()`        | every frame                 | Applies input, runs the countdown, checks the win |

> Both `init` and `create` run again whenever the scene is restarted or re-entered, so **all state is reset in `create()`**, not in field initializers.

---

## 6. `FirstScene` — code walkthrough

### 6.1 Key syntax and types

The scene key is `'FirstScene'` (constructor). This matters because transitions reference it:

- Passing a level → `this.scene.start('FirstScene', { level, carriedScore })`
- Restarting → `this.scene.restart({ level, carriedScore })`

Local types used by the scene:

- `GameOverReason = 'bomb' | 'time-up'` — the two ways to lose.
- `LevelStartData` — the data object passed between levels (`level`, `carriedScore`).
- `DialogOptions` — everything needed to render an end-of-level overlay.
- `ArcadePhysicsObject` — a union matching Phaser's `ArcadePhysicsCallback` parameter types, so the collision callbacks stay **fully typed** (no `any`).

### 6.2 State fields

- **Player/physics:** `player`, `platforms`, `stars`, `bombs`
- **HUD texts:** `scoreText`, `levelText`, `timerText` — each `.setScrollFactor(0)` so they never scroll off-screen
- **Level progression:** `level`, `levelConfig`, `carriedScore`
- **Round state:** `score`, `elapsedTime`, `timeLeft`, `gameIsOver`, `bombTimer`

### 6.3 `init(data)` — the level picker

```ts
this.level = Math.min(Math.max(1, data?.level ?? 1), LEVELS.length);
this.levelConfig = LEVELS[this.level - 1];
this.carriedScore = data?.carriedScore ?? 0;
```

- `level` is clamped into `[1, LEVELS.length]` — unknown or missing values safely fall back to level 1.
- `carriedScore` lets a score earned in level 1 roll into the later levels.

### 6.4 `preload()` — asset inventory

| Key      | File                  | Usage                                |
| -------- | --------------------- | ------------------------------------ |
| `sky`    | `assets/sky.png`      | Background image                     |
| `ground` | `assets/platform.png` | Platform tile (400×32, scaled ×2)    |
| `star`   | `assets/star.png`     | Collectible                          |
| `bomb`   | `assets/bomb.png`     | Hazard                               |
| `dude`   | `assets/dude.png`     | Player spritesheet (32×48, 9 frames) |

### 6.5 `create()` — composition root

`create()` resets score/time/game-over state, then delegates to one focused builder per concern:

```ts
createBackground();  -> createPlatforms();  -> createPlayer();  -> createCamera();
createAnimations();  -> createInput();      -> createStars();   -> createBombs();   -> createHud();
```

Each `createX()` helper is described below.

### 6.6 Background, platforms, player, camera

- **`createBackground()`** — one full-screen sky image pinned with `.setScrollFactor(0)`. Because the world is wider than the viewport, pinning prevents the sky from scrolling and leaving gaps.
- **`createPlatforms()`** — a static group. The level is 2400px wide, so the floor is three `ground` tiles scaled ×2 (each ~800px wide) at `x = 400, 1200, 2000`, edge to edge, with `refreshBody()` (required after scaling a static body). Eight floating platforms (e.g. `50,250`, `750,220`, `1450,300`, …) create the jumping route.
- **`createPlayer()`** — a dynamic physics sprite at `(100, 450)` with bounce, world-boundary collision, and a persistent `collider` against the platforms. (This collider belongs here — **not** in `update()` — otherwise a new collider would be registered every frame.)
- **`createCamera()`** — the side-scroll core:
  ```ts
  this.physics.world.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT); // player physics clamped to level
  this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT); // camera clamped to level edges
  this.cameras.main.setDeadzone(CAMERA_DEADZONE_W, CAMERA_DEADZONE_H);
  this.cameras.main.startFollow(this.player, true, CAMERA_LERP_X, CAMERA_LERP_Y);
  ```
  The deadzone keeps the camera still while the player moves inside a 160×80 box (no jitter), then it chases smoothly with lerp. `roundPixels = true` keeps pixel art aligned. The camera is rebuilt on every `create()`, which is important because a scene restart resets it.

### 6.7 Animations, input, stars, bombs

- **`createAnimations()`** — three `dude` animations: `left` (frames 0–3), `turn` (frame 4, the idle), `right` (frames 5–8).
- **`createInput()`** — CursorKey bindings (arrow keys / WASD via Phaser defaults). Guarded against a missing keyboard plugin.
- **`createStars()`** — one dynamic group containing `STAR_COUNT = 12` stars. They are spread **across the whole level**, which is what forces traversal:
  ```ts
  setXY: { x: 120, y: 0, stepX: (WORLD_WIDTH - 240) / (STAR_COUNT - 1) }
  ```
  first star at `x = 120`, last at `x = 2280`. Each star gets a random `bounceY` (0.4–0.8) so they tumble onto platforms. Colliders:
  - stars ↔ platforms (they rest on platforms),
  - player ↔ stars via `overlap` → `collectStar`.
- **`createBombs()`** — a dynamic group with bomb↔platforms collider and player↔bombs **collider** → `hitBomb`. Per level config:
  - `spawnInitialBomb` → one bomb immediately,
  - `bombIntervalMs > 0` → a looping `TimerEvent` calls `spawnBomb` every interval.

### 6.8 `update()` — input & timer, frame by frame

Every frame, unless the round is over:

1. `tickTimer(delta)` advances `elapsedTime += delta / 1000` and computes `timeLeft = max(0, levelSeconds - elapsed)`, updating the HUD. When it hits 0 → `endGame('time-up')`.
2. Movement: arrows set horizontal velocity `±PLAYER_MOVE_VELOCITY` and play `left`/`right`; no input → velocity 0 + idle `turn`.
3. Jump: only when `cursors.up.isDown && player.body.touching.down` (can't double-jump) → `setVelocityY(PLAYER_JUMP_VELOCITY)`.
4. `tickTimer` may have just ended the game, so `update` re-checks `gameIsOver` before processing input.

### 6.9 `collectStar` / respawn logic — the win condition

```ts
star.disableBody(true, true); // hide & disable colliding
this.score += STAR_VALUE; // +10
this.scoreText.setText(`Score: ${this.score}`);

if (this.score >= this.levelConfig.starsRequired * STAR_VALUE) {
  this.passLevel(); // won this level
  return;
}
if (this.stars.countActive(true) === 0) {
  this.respawnStars(); // no pass yet but batch exhausted
}
```

That second branch is what powers **level 4** (needs 16 stars from 12 slots): clear the batch, `respawnStars()` re-enables each star at its original `x`, top `y=0`, and you collect the remainder.

### 6.10 Bombs — off-camera spawns

`spawnBomb()` picks the player's right or left side at random and places the bomb **just outside the camera** (`GAME_WIDTH/2 + 80` away), clamped to `[40, WORLD_WIDTH - 40]`. It bounces (`bounce 1`), respects world bounds, and gets an initial velocity. Spawning beside the player keeps the threat relevant while the world scrolls.

### 6.11 `hitBomb` → `endGame` (lose path)

Hitting a bomb calls `endGame('bomb')`; running out of time calls `endGame('time-up')`.

`endGame`:

1. Sets `gameIsOver` → freezes `update()` input/timer.
2. `bombTimer?.remove()` → no more bombs spawn on the frozen screen.
3. `this.physics.pause()` → the whole simulation stops.
4. If bomb: tints the player red, plays the `turn` frame, **shakes the camera** (`shake(200, 0.01)`).
5. Scores the round: `timeBonus = floor(timeLeft × TIME_BONUS_PER_SECOND)`, `totalScore = carriedScore + stars + bonus`.
6. Shows the **GAME OVER** dialog; confirming restarts **the same level** explicitly:
   ```ts
   onConfirm: () => this.scene.restart({ level: this.level, carriedScore: this.carriedScore });
   ```
   Passing the data explicitly is important — Phaser's bare `restart()` reuses the scene's previous data, which would cause subtle bugs.

### 6.12 `passLevel` (win path)

Same teardown as `endGame`, but:

- If `this.level < LEVELS.length` → **LEVEL PASSED** dialog; confirming:
  ```ts
  this.scene.start('FirstScene', { level: this.level + 1, carriedScore: totalScore });
  ```
  The next level boots, `init()` picks its config, and the carried score rolls forward.
- If it was the last level (4) → **YOU WIN!** dialog; confirming resets the whole run:
  ```ts
  this.scene.restart({ level: 1, carriedScore: 0 });
  ```

### 6.13 `showDialog` — the shared overlay

One function renders every end-screen (Game Over / Level Passed / You Win):

- A full-screen black rect at 55% alpha (**depth 20**).
- A rounded panel `460×320` (**depth 21**).
- Title, subtitle, multi-line stats, and a hint (**depth 22**).
- Every object is `.setScrollFactor(0)` so the panel is always centered on screen regardless of where the camera is.
- Interaction via `once` listeners: `pointerdown`, `keydown-ENTER`, `keydown-SPACE` → all call `options.onConfirm`. They are `once` so a single click/keypress triggers exactly one transition, and the scene restart tears them down anyway.

---

## 7. Gameplay rules (concise summary)

1. **Goal:** collect `starsRequired` stars before the level timer reaches 0.
2. **Win:** `score >= starsRequired * 10` → pass → next level, carrying `totalScore` forward. Beat level 4 → WIN → whole game resets to level 1.
3. **Lose:** hit a bomb (red tint + camera shake) or run out of time → GAME OVER → retry the current level.
4. **Score:** `+10` per star, plus a time bonus of `5 × secondsLeft` at the end of any level.
5. **Movement:** ← → run, ↑ jump (grounded only). Camera follows with a deadzone; world is 2400px wide.

---

## 8. How to tune the game

All knobs live in `game-tunbles.ts` — no scene changes needed:

- **Difficulty curve:** edit `LEVELS` rows (time, required stars, bomb cadence) or add a 5th level.
- **Level length:** change `WORLD_WIDTH` (stars auto-re-spread via the `stepX` formula).
- **"Fits on screen" platforms:** the `createPlatforms()` positions assume the 2400px world; if you change `WORLD_WIDTH`, extend the three floor tiles and float positions accordingly.

---

## 9. How to run / verify

```bash
npm start                 # Angular dev server → play GAME 2 in the browser
npx tsc --noEmit -p tsconfig.app.json   # typecheck the whole app
npx prettier --write src/app/game-2/**/*.ts
```

---

## 10. Design notes / why things are done this way

- **One parameterized scene, not four classes:** each level is just data; no gameplay logic is duplicated. Adding level 5 = one row in `LEVELS`.
- **Colliders in `create()`, not `update()`:** registering colliders every frame leaks collision entries and slows the sim.
- **No `any` in callbacks:** `ArcadePhysicsObject` mirrors Phaser's callback parameter union, keeping type safety through the physics API.
- **Explicit restart data:** Phaser's `restart()` will silently reuse previous scene data; passing `{ level, carriedScore }` everywhere makes the flow deterministic.
- **`setScrollFactor(0)` discipline:** any object you want to live on screen (HUD, dialogs, sky) must be pinned explicitly once the camera starts following.
