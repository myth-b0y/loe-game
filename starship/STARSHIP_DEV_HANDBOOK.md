# LoE: Starship Survivor - Development Handbook

**Status:** Living engineering/runbook document  
**Current documented runtime:** v0.9.6  
**Current cache/deploy key:** 9.6.1  
**Repository:** `myth-b0y/loe-game`  
**Branch:** `main`  
**Game path:** `starship/`  
**Public build:** `https://myth-b0y.github.io/loe-game/starship/`

This handbook describes how to safely develop, patch, test, release, recover, and eventually freeze the current Starship Survivor web build. It is intentionally practical. The goal is to stop rediscovering the same architecture, deployment, cache, save, and screen-state problems every time the game changes.

The separate `STARSHIP_DESIGN_DIRECTION.md` is the design north star. This file is the engineering playbook.

---

## 1. Source-of-truth hierarchy

When sources disagree, use this order:

1. **Explicit current design decisions made during active development.** These supersede older planning material.
2. **Current behavior and data on `main`.** This is the truth for what the build actually does now.
3. **`STARSHIP_DESIGN_DIRECTION.md`.** This records current intended behavior, including features that may not yet be fully implemented.
4. **`Starship_Game_Spec.docx` / Full Build Specification v1.0.** This is the original full-game blueprint and remains valuable for architecture and long-term scope.
5. **Older version folders and patch code.** These are archaeology sources, not automatic truth.

Never silently promote an old placeholder, abandoned rule, or historical implementation into current design canon.

Examples:

- The old full-build spec contains placeholder combat factions such as Swarm, Bastion, Vector, Marauders, Null, and Forge. Current faction direction is based on LoE peoples/fleets and must not inherit those names automatically.
- The current wave design is kill-complete with a continuous encounter queue. Old timer-complete wave code is historical and must not be restored.
- Current checkpoint starts are 11, 21, 31, and so on, after the preceding boss is defeated. Starting directly on 10, 20, 30 is wrong.

---

## 2. Repository boundaries

All active Starship Survivor work belongs under:

```text
starship/
```

Do not modify unrelated LoE content at repository root unless explicitly requested.

Current top-level Starship files include older base/runtime files plus the active loader chain:

```text
starship/
  index.html
  manifest.json
  loader-v5.js
  loader-v6.js
  loader-v65.js
  loader-v7.js
  loader-v8.js
  loader-v9.js          <- current entry loader
  audio.js              <- legacy/root implementation material
  combat.js             <- legacy/root implementation material
  data.js               <- legacy/root implementation material
  ui.js                 <- legacy/root implementation material
  style.css             <- legacy/root implementation material
  v5/
  v6/
  v7/
  v8/
  v9/                   <- current patch generation
```

The current runtime is assembled from historical layers. That means a later file can override a function defined much earlier. Debugging must always account for load order.

---

## 3. Current runtime load order

As of v0.9.6, `loader-v9.js` loads the game approximately in this order:

1. v5 base style
2. v5 data chunks
3. v5 combat runtime
4. v5 UI runtime
5. v6 style and patches/hotfixes
6. v7 style and patch
7. v8 style, patch chunks, and hotfixes
8. v9 base style and boss patch
9. v9 incremental styles/hotfixes through `hotfix.7.js`
10. final runtime version synchronization and save migration

The current loader cache key is `9.6.1`, while the visible/runtime game version remains `0.9.6`.

That distinction is intentional:

- **Runtime version** describes the game build: `0.9.6`.
- **Cache/deploy key** forces browsers and GitHub Pages to request fresh files: `9.6.1`.

Do not confuse the two.

### Why this matters

A function can be correct in `v5` and broken by a wrapper in `v9`. A screen can be built by the old UI, then visually changed by later patches. A CSS rule in a later stylesheet can also change positioning semantics for earlier DOM.

When investigating a bug, search for every override of the relevant function before changing it.

---

## 4. Patch philosophy

### 4.1 Prefer ownership over patch-on-patch behavior

The most common source of instability has been multiple systems believing they own the same state.

Examples:

- multiple boss flows trying to own pause state
- multiple screen shells leaving background canvases alive
- two different flagship renderers producing different ships
- a Launch footer living inside transformed tab content
- DOM remnants being used as gameplay state

The rule is:

> One system owns one responsibility.

Important ownership boundaries:

- **Encounter controller** owns encounter lifecycle.
- **Boss controller** owns boss intro, combat, phase, death, and victory resolution.
- **Draft state** owns whether a card choice is open. Hidden DOM is not gameplay state.
- **Station shell** owns global Station chrome such as Launch.
- **Each full-screen route** owns its screen lifecycle and must stop previous screen animation loops.
- **One canonical flagship renderer** owns flagship geometry everywhere.

### 4.2 Avoid DOM inference for simulation state

Do not decide whether the game is paused, drafting, resolving a boss, or finished based on whether an old DOM element still exists.

Bad:

```js
if (document.querySelector('#cards .card')) {
  // assume draft is open
}
```

Better:

```js
draftState = 'closed' | 'choosing' | 'resolving' | 'resolved'
```

The DOM should represent game state, not define it.

### 4.3 Patch small, verify broad

A narrowly targeted fix can still affect several screens because the runtime is layered. Every patch should have:

- one clear purpose
- explicit owner/state transitions
- migration impact considered
- cache key updated when needed
- regression checks outside the immediate bug

---

## 5. Versioning and cache busting

### Runtime version

The runtime version is displayed to the player and stored on saves. Example:

```text
0.9.6
```

When a true build changes, update the final version synchronization in the current patch/loader.

### Cache key

GitHub Pages and iOS Safari can continue serving old entrypoints or assets after `main` updates. Use an independent cache key in:

- `index.html` loader query
- `manifest.json` start URL
- `loader-v9.js` internal fetch query

Example:

```text
9.6.1
```

A pure deployment/cache refresh may increase the cache key without increasing runtime version.

### Public test URL

Use a cache-busted URL during testing:

```text
https://myth-b0y.github.io/loe-game/starship/?v=<cache-key>
```

For Boss Lab:

```text
https://myth-b0y.github.io/loe-game/starship/?v=<cache-key>&dev=1
```

### Never claim Pages is live solely because the commit exists

There are two separate facts:

1. the file is committed to `main`
2. GitHub Pages has propagated that commit

Verify both when possible. If only repository state has been verified, say that.

---

## 6. Safe release workflow

Use this sequence for every build patch:

1. Fetch latest `main` branch SHA.
2. Inspect the current loader and relevant latest patch files.
3. Search older layers for overrides of any function being changed.
4. Implement the smallest coherent patch.
5. Syntax-check new JavaScript and validate CSS/HTML structure where practical.
6. Update runtime version if this is a new build.
7. Update cache key in loader, index, and manifest.
8. Commit changes to `main`.
9. Re-fetch committed files from `main` and verify exact content.
10. Verify branch head.
11. Test public URL after Pages propagation.
12. Test on real iPhone/Safari before calling the patch stable.

### Release notes should distinguish

- **Implemented:** code is committed.
- **Repository verified:** committed code was re-fetched from `main`.
- **Public deployment verified:** Pages served the new entrypoint/assets.
- **Device verified:** tested on the target iPhone/Safari build.

Never collapse these into one claim.

---

## 7. Current save model and migration rules

The historical save key is:

```text
sr_mobile_v2
```

The current game uses three manual save slots and tracks a last-used slot. Saves are repeatedly migrated by later runtime layers.

### Save migration rules

A migration must be:

- idempotent
- backward-compatible whenever reasonable
- safe when fields are missing
- safe when fields contain legacy IDs
- non-destructive unless the old data is objectively invalid

Do not erase progression merely because a new field does not exist. Supply defaults.

### Current permanent categories

Saves may include or evolve toward:

- slot ID
- ship name
- hull frame
- salvage
- Boss Cores
- ship systems
- weapon inventory / mounts
- Tactical Systems
- crew roster and assignments
- drone ownership/equipment
- support craft ownership/equipment
- R&D state
- unlocked checkpoints
- records
- settings
- pack state

Run cards and temporary run build state reset when the expedition ends unless suspended-run support is explicitly implemented.

### Checkpoint migration rule

Historical checkpoints that represented boss waves must migrate to the next sector start:

```text
10 -> 11
20 -> 21
30 -> 31
40 -> 41
...
```

The checkpoint means "this boss was defeated and the next sector is unlocked."

It must never mean "spawn directly into the boss I already beat."

---

## 8. Encounter architecture

There are distinct encounter types. They should not run concurrently unless a future design explicitly creates a hybrid encounter.

### Normal combat

A normal wave owns:

- full enemy queue
- active-pressure cap
- faction/sector context
- spawn refill cadence
- completion check

Normal waves are **not timer-completed**.

They finish only when:

```text
queue exhausted AND active enemies == 0
```

The desired pressure model is continuous:

1. fill the active cap
2. when an enemy dies, schedule another quickly
3. continue until every queued enemy has spawned
4. finish when the final active enemy dies

Do not restore old visible spawn batches with long dead-air pauses.

### Asteroid field

Asteroid fields are independent encounters:

- no enemy ships
- rocks/fragments are the encounter objects
- asteroids bounce off one another and the flagship
- collisions do not damage the player
- large rocks can fracture
- encounter ends only when all encounter rocks/fragments are destroyed
- resource warning must finish before the field begins

If a timed mining variant is ever used experimentally, treat that as a deliberate exception and document it. The current design north star remains object-complete rather than generic timer-complete.

### Boss encounter

Bosses are their own lifecycle, not a special normal enemy.

Required stages:

```text
warning
-> approach from above
-> player shifts lower
-> countdown
-> engage
-> phase combat
-> boss death
-> clear hostile effects
-> resolve pending draft
-> boss victory choice
-> optional Engineer encounter
-> next wave OR successful return
```

Wave 11 must be impossible until the complete Wave 10 boss transaction resolves.

---

## 9. Boss controller rules

Bosses are mechanic-driven encounters. They must never regress into generic large enemies.

### Boss profile data should own

- identity
- faction
- archetype
- silhouette
- relative hull scale
- subsystem layout
- movement profile
- attack pattern set
- phase definitions
- telegraphs
- reward data
- optional modifiers

### Recovered current archetypes

The v0.9 boss foundation recovered three useful archetypes from older code:

- **Dreadnought**
- **Carrier Prime**
- **Reaper**

These are implementation archetypes, not a final complete faction boss roster.

### Current boss presentation rules

- Boss warning is centered and faction-colored.
- Boss physically enters from above during warning/countdown.
- Player ship moves lower.
- Combat begins only at ENGAGE.
- Boss scale can dwarf the player, but rendering must remain readable and mostly on-screen.
- Subsystems remain attached to visible hull geometry.
- Boss attack telegraphs must be visible before damage.

### Targetable systems

Bosses may expose systems such as:

- weapon batteries
- missile banks
- shield nodes
- engines
- hangars
- ion arrays
- repair cores
- main weapons

Destroying a subsystem must change the encounter where appropriate.

### Phase rule

Phase II is not `damage +25%`.

A real phase transition changes at least one of:

- available attacks
- attack combinations
- movement
- exposed subsystems
- defensive state
- reinforcements
- battlefield pattern
- visual damage state

### Boss death state

Boss death must use explicit simulation state. Do not poll the card DOM to determine whether a level-up draft has finished.

---

## 10. Canonical flagship renderer

There must be exactly one source of truth for player-ship geometry.

The same flagship must appear in:

- combat
- main menu
- Ship screen
- Arsenal/equipment preview
- launch preview
- any future profile/share screen

Those contexts may change:

- scale
- camera
- lighting
- damage state
- shield visibility
- animation

They must not change the actual hull design, mount locations, installed weapons, drones, or support craft.

### Renderer input should come from save/config state

At minimum:

- hull frame
- weapon mount instances
- equipped drones
- equipped support craft
- shield state
- damage state when relevant

Avoid separate "decorative preview" ship geometry.

---

## 11. Station and full-screen route ownership

Each major route must fully own its screen lifecycle.

Routes include:

- Main Menu
- New / Load
- Settings
- Station
- Combat
- Boss Lab / developer screens

When leaving a route:

- cancel its animation frame loops
- remove route-specific canvases
- remove route-specific body classes
- remove fixed overlays/footers that belong to it
- clear stale timers/listeners when necessary

### Station Launch button

Launch belongs to the **Station shell**, not to each tab's transformed/scrolling content.

Requirements:

- anchored above mobile safe area
- consistent across Station tabs
- scrollable tabs reserve bottom space
- content can scroll completely above Launch
- Launch never floats over Systems/Arsenal cards because of transformed ancestors

### New / Load

New / Load is a dedicated route, not the old main-menu shell with save controls layered on top.

It should own:

- three save slots
- load
- new flagship
- overwrite confirmation
- delete confirmation
- slot metadata
- clean Back behavior

### Settings

Settings is also a dedicated route. Main-menu telemetry and ship canvas must not leak underneath it.

---

## 12. UI interaction rules

The original full-build rule remains excellent:

> Icon first. Number second. Words only when necessary.

Player-facing design should remain sparse even as internal systems grow.

### Prefer

- symbols
- capacity indicators
- direct numbers
- status bars
- color
- movement
- animation
- spatial placement
- optional info details

### Avoid

- paragraphs on every card
- duplicated faction labels
- repeated headings that say the same thing
- permanent debug text in normal play
- controls leaking from developer mode into combat
- giant overlays that obscure the battlefield without purpose

### Motion

Motion should make screens feel alive, not noisy:

- restrained parallax
- engine idle
- scan lines/sweeps
- telemetry pulses
- smooth screen entrance
- live drones/support craft
- terminal-like report sequencing

---

## 13. Audio architecture

The current base uses WebAudio synthesis, but the long-term contract is semantic audio IDs.

Gameplay code should conceptually request events such as:

```text
audio.weapon.railgun.fire
audio.shield.hit
audio.shield.break
audio.boss.arrival
audio.card.legendary
audio.ui.confirm
```

Do not design future audio around permanent hardcoded filenames.

### Audio Library / mapping requirement

Settings should eventually expose a development/player-facing mapping layer where compatible sounds can be previewed and assigned to semantic events.

High-frequency events should support variants so the mix does not become repetitive.

### iOS requirement

WebAudio may require a user gesture before the context can start/resume. Preserve a global interaction-based unlock path.

Do not report iOS audio as working until tested on device.

---

## 14. Emberpack boundary

Emberpacks are intended to be declarative content and asset packs.

They may eventually provide or override:

- cards
- weapons
- enemies
- bosses
- crew
- hulls
- research
- balance data
- localization
- ship art
- UI art
- effects
- audio

Normal player packs should not execute arbitrary engine code.

Stable semantic IDs remain the central contract.

Example style:

```text
weapon.railgun.mk1
card.ion.chain.2
boss.elsari.archon
audio.shield.hit.heavy
ui.icon.reactor
```

The base game should increasingly follow the same ID conventions used by packs.

---

## 15. Native/iOS boundary

The project is web-first today. A later native iOS shell can provide:

- haptics
- file import/export
- sharing
- platform storage
- native lifecycle hooks
- platform audio/device integration

Simulation logic should remain separable from browser UI so a future shell does not require rewriting the game.

Do not prematurely move core logic into platform-specific code.

---

## 16. Performance rules

Endless mode must scale without turning the phone into a tiny furnace altar.

Priorities:

- active enemy pressure cap
- projectile cap where needed
- pooling for high-frequency entities
- offscreen culling
- simple steering for most ships
- broad-phase collision optimization if entity counts grow
- effect-density controls
- audio voice limits
- late-game effect compression when visual chaos exceeds useful information

The enemy cap is not only a performance tool. It is also a design tool. Excess threat should increasingly improve enemy quality and behavior instead of spawning an unreadable blob.

---

## 17. Developer tooling

The hidden Boss Lab is the beginning of a proper developer tool layer.

Boss Lab should support direct testing of:

- faction
- boss archetype/profile
- wave/tier
- player hull
- Phase I / Phase II
- subsystem state where useful

Future developer tools should include:

- spawn enemy
- set wave
- add XP
- grant progression/resources
- force card rarity
- inspect current build
- inspect boss state
- show hitboxes
- show target selection
- export telemetry
- game-speed control

Developer controls must never appear in normal player combat.

---

## 18. Testing matrix

### Every patch

Test at least:

- fresh load
- Continue
- New / Load
- Settings open/back
- Station tabs
- Launch
- one normal wave
- card draft
- pause/resume

### Combat/system patches

Also test:

- wave completion only after encounter objects are gone
- continuous refill spawning
- targeted enemy priority
- shield break at zero
- Tactical System activation
- Auto on/off
- Run Build panel

### Boss patches

Test:

- Wave 10 normal progression
- direct Boss Lab start
- boss approach from above
- ENGAGE transition
- visible telegraphs
- subsystem destruction
- Phase II
- boss death
- draft after boss if a level triggers
- FULL REPAIR
- CONTINUE DAMAGED
- RETURN TO STATION
- checkpoint unlock to Wave 11
- Wave 20 Engineer path

### Save patches

Test:

- all three slots
- new save
- load existing
- overwrite confirmation
- delete confirmation
- migration from older save shape
- no cross-slot corruption

### iPhone-specific checks

- safe areas
- footer placement
- Safari viewport resizing
- scroll-to-bottom on long Station tabs
- audio unlock
- touch targeting
- no accidental text selection/zoom
- portrait layout
- page cache after deployment

---

## 19. Current known engineering risks

As of v0.9.6, the largest risks are architectural rather than feature-count related.

### Patch-chain depth

The live runtime is composed from v5 through v9 patch layers. This has allowed rapid iteration, but it also increases override complexity.

**Ground Build requirement:** once behavior is stable, consolidate the working runtime into a recoverable, comprehensible baseline rather than indefinitely stacking hotfixes.

### Screen lifecycle leakage

Historical main-menu canvas/telemetry has leaked into Settings and New / Load. Dedicated route ownership is now the rule, but all future screens must follow it.

### Boss resolution

Boss post-death flow has recently been reworked around explicit draft state. It requires real-device regression testing through Wave 10 and Wave 20 before being considered stable.

### GitHub Pages propagation

Repository success is not deployment success. Cache keys help, but Pages delay must remain part of release expectations.

---

## 20. Ground Build freeze procedure

When the current foundation finally passes the regression matrix:

1. Stop adding features.
2. Perform bugfix-only stabilization.
3. Test the full loop on real iPhone/Safari.
4. Record the exact `main` commit SHA.
5. Create a complete deployable snapshot under a release path such as:

```text
starship/releases/ground-v1/
```

6. Include the exact loader, runtime files, styles, manifest, and metadata required to launch it independently.
7. Record runtime version, cache key, source commit, save schema assumptions, and known limitations.
8. Tag the commit if repository workflow supports it.
9. Update this handbook with the frozen Ground Build identifier.
10. Future experimental work must be recoverable back to that snapshot without archaeology.

The frozen snapshot is not merely a zip of random source files. It must be a known-good deployable game.

---

## 21. Rollback procedure

If a new patch breaks core play:

1. Identify the last known-good commit/cache key.
2. Determine whether the problem is code, save migration, or deployment caching.
3. Do not destroy user saves to hide a migration bug.
4. Revert or restore the known-good runtime files.
5. Increment cache key.
6. Verify repository content.
7. Verify Pages deployment.
8. Re-test with an old save and a fresh save.

If only one patch file is bad, prefer a targeted revert over rewriting several old layers at once.

---

## 22. Collaboration rules for future build sessions

These rules preserve momentum and reduce accidental scope creep.

### When the user says "talk" or "don't do anything"

Do not change the repository. Discuss only.

### When the user says "plan patch"

Produce a scoped patch plan. Do not build until asked.

### When the user says "build" or "fix"

Implement the agreed scope directly. Avoid restarting design discussion unless a blocking ambiguity makes implementation unsafe.

### During bug reports

Screenshots are evidence. Describe what is actually visible, connect it to likely architecture, then inspect code before claiming a cause.

### Avoid invented canon

Do not invent final faction fleet names, Empire behavior, or lore labels simply because code needs a string. Use clearly temporary data until canon is supplied.

---

## 23. Engineering definition of done

A system is not done because a button exists.

It is done when:

- the real game path reaches it
- its state is owned by one clear system
- it survives save/load when required
- mobile layout works
- it gives readable feedback
- failure paths do not deadlock the run
- it can be tested without unreasonable setup
- it does not rely on invisible stale DOM or side effects
- it does not contradict current design direction

For Starship Survivor, boring reliability is part of the fantasy. The flagship can be exploding. The state machine should not be.
