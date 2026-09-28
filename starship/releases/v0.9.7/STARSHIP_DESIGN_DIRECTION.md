# LoE: Starship Survivor - Design Direction

**Status:** Living design north star  
**Current documented runtime:** v0.9.6  
**Project state:** Active foundation development, pre-Ground-Build freeze

This document records the current intended game, including design decisions made after the original Full Build Specification v1.0. It is not a promise that every listed feature is already implemented. It exists so implementation can evolve without losing the game we are actually trying to make.

The separate `STARSHIP_DEV_HANDBOOK.md` describes how to build, release, migrate, debug, and recover the project.

---

## 1. The game in one sentence

**LoE: Starship Survivor is a portrait endless-siege starship roguelite where a persistent flagship grows from a tiny two-person fighter into a crewed warship, while each launch creates a temporary, increasingly absurd combat build that must survive one more wave.**

The core fantasy from the original specification remains intact:

> Run 1: two people in a starfighter.  
> Much later: a frigate, trained crew, drones, escorts, missile batteries, shields, Tactical Systems, and a build that may or may not survive the next wave.

The core question is still:

> **How long can I keep this build alive?**

---

## 2. Non-negotiable design rules

### Deep machinery underneath, brutally clean information on top

The game may have complicated simulation, dependencies, crew roles, build tags, boss systems, and R&D. The player-facing surface should remain simple.

### Icon first. Number second. Words only when necessary

Use symbols, bars, spatial organization, animation, sound, and color before explanatory prose.

### Gameplay first, lore-consistent second

The game exists inside Legends of EDEN, but it is not a plot retelling and should not depend on main-series characters or major story devices.

The player is a legend in the world, not Ikaros/Saphira/etc.

### The flagship must visibly become more than it was

A Heavy Frigate is not a Starfighter with larger numbers. Hull progression changes silhouette, mounts, staffing, capacity, drones, support craft, and the visual relationship between the player and enemies.

### Permanent growth expands possibility

Permanent progression should mostly unlock capability, capacity, systems, equipment, crew use, and tactical options.

### Run growth creates the madness

Temporary cards are where the build becomes ridiculous.

Offense is allowed to become spectacularly broken. Defense, hard disables, and cooldown loops need diminishing returns or other limits so endless mode never becomes permanently invulnerable.

---

## 3. Core loop

The intended loop is:

```text
MAIN MENU
-> STATION
-> configure flagship / crew / equipment / R&D
-> choose unlocked start wave
-> LAUNCH
-> continuous combat waves
-> XP and temporary card drafts
-> boss every 10 waves
-> repair / continue / return decision
-> deeper sector
-> eventual death OR voluntary successful return
-> animated expedition report
-> STATION
-> spend / configure / launch again
```

### Death is not the only valid end of a run

After defeating a boss, the player may choose to return to Station successfully. This should feel like extracting from an expedition, not quitting.

---

## 4. Combat arena

### Format

- portrait-first mobile presentation
- dark scrolling space
- flagship normally near center
- parallax creates forward-motion illusion
- enemies move freely
- no grid
- no rows
- no lanes
- no Space Invaders motion

### Player control

Normal waves are primarily build/targeting combat rather than joystick piloting.

Weapons fire automatically according to their own behavior and priorities.

The player can tap an enemy to prioritize it.

Boss fights unlock free flagship maneuvering because boss mechanics need spatial dodging and positioning.

### Tactical Systems

Direct combat buttons are called **Tactical Systems**.

They should alter the battlefield meaningfully, not produce tiny invisible bonuses.

Examples include:

- Ion Bomb
- Energy Nova
- Gravity Well
- Blink Drive
- Shield Burst
- Missile Barrage
- EMP
- Emergency Repair
- Singularity
- Artillery Strike

Reactor progression supports Tactical power/recharge.

---

## 5. Wave structure

### Critical rule: waves are kill-complete

Normal waves do not end because a timer expired.

A wave ends only when:

```text
all scheduled encounter enemies have spawned
AND
all active enemies are dead
```

### Continuous pressure, not visible batches

A wave has a total encounter queue plus an active-pressure cap.

Example:

```text
24 total enemies
6 active-pressure capacity
```

The first set enters. When one dies, the next queued ship enters after a short natural delay. The battle should feel like one sustained attack, not:

```text
5 enemies
pause
5 enemies
pause
```

### Weighted active cap

Large ships may consume more active-pressure budget than small fighters.

The goal is to increase danger without turning late waves into unreadable entity soup or a hardware stress test.

### Quiet interval

When the final encounter object dies, hostile projectiles/mines/telegraphs should clear appropriately. A short breath/countdown separates encounters.

---

## 6. Endless scaling and threat tiers

Difficulty should rise along several dimensions:

- total encounter size
- simultaneous active pressure
- enemy hull/shield durability
- enemy damage
- firing cadence
- targeting quality / skill
- stronger archetype weighting
- elite frequency
- formation/composition difficulty
- special behavior complexity
- status resistance
- boss modifiers

### Sector threshold moments

Bosses mark danger thresholds.

Wave 11 should feel materially more dangerous than Wave 9. Wave 21 should feel like another step deeper.

Desired structure:

```text
Waves 1-9: smooth growth
Wave 10: boss
Wave 11: noticeable threat-tier jump
Waves 11-19: smooth growth
Wave 20: boss
Wave 21: next threat-tier jump
...
```

The jump should affect both quantity pressure and enemy quality/skill.

Player progression can be tuned slightly slower if necessary, but the fantasy of becoming extremely powerful should remain.

---

## 7. Boss cadence and checkpoint rule

Bosses occur forever on:

```text
10, 20, 30, 40, ...
```

Defeating a boss unlocks the **next sector start**:

```text
10 -> unlock 11
20 -> unlock 21
30 -> unlock 31
40 -> unlock 41
```

Starting from an unlocked checkpoint means a fresh temporary run build at the beginning of that sector.

It must not:

- start directly on the previously defeated boss
- fabricate a fake temporary deck to simulate progress

Permanent ship progression remains.

---

## 8. Bosses are a first-class game system

Bosses are not ordinary enemies with multiplied HP.

They have their own lifecycle:

```text
warning
-> physical approach from above
-> player shifts lower
-> countdown
-> ENGAGE
-> free maneuvering unlocks
-> attacks / telegraphs / subsystems
-> Phase II
-> destruction
-> resolution
```

### Boss entrance

The boss must be visible during its arrival.

The desired moment:

- faction/system warning appears
- boss creeps into frame from top-middle
- flagship shifts down
- countdown becomes part of the warning
- boss is staged and looming before combat begins
- ENGAGE

### Boss scale

Relative scale matters.

A Corvette-class boss can be enormous next to a Starfighter. Later, the same class may appear smaller than the player's Frigate.

The game should preserve that progression.

However, extreme scale ratios are visually compressed enough to keep the boss mostly readable on-screen. "Huge" cannot become "mostly an invisible white shape outside the viewport."

### Boss movement

Bosses use boss-specific movement behaviors such as:

- fortress hold
- horizontal strafe
- charge
- dive/re-entry
- orbit
- reposition
- retreat/re-engage
- subsystem/phase-dependent movement

### Telegraphs

Dangerous mechanics need readable anticipation:

- lines
- arcs
- target zones
- charging hardpoints
- countdown pulses
- lane warnings

Difficulty should come from reading and responding to the fight, not invisible unavoidable damage.

### Targetable subsystems

Potential systems include:

- weapon batteries
- missile racks
- shield nodes
- engines
- hangars
- ion arrays
- repair modules
- main cannons

Destroying a meaningful subsystem changes the fight.

Examples:

- missile bank destroyed -> missile pattern disappears
- engine damaged -> movement pattern weakens/changes
- hangar destroyed -> launches stop
- shield nodes destroyed -> hull vulnerability changes

### Real phases

Phase II changes the encounter rather than only increasing numbers.

It can change:

- attacks
- pattern combinations
- movement
- defensive state
- exposed systems
- reinforcements
- battlefield geometry
- visual damage state

### Recovered implementation archetypes

Current boss foundation recovered useful old archetypes:

- Dreadnought
- Carrier Prime
- Reaper

They are reusable boss behavior foundations, not the final full roster.

### Boss modifiers

Late-game modifiers can layer on strong base bosses:

- Armored
- Fortified
- Regenerative
- Berserk
- Ionized
- Carrier
- Overcharged
- other future faction/void modifiers

Modifiers must not substitute for actual boss design.

---

## 9. Boss victory flow

Boss death should feel like a completed encounter, not a popup interrupt.

After the boss is genuinely destroyed:

1. stop/clear hostile combat effects
2. resolve any card draft that was legitimately triggered
3. show boss victory interface exactly once
4. offer the three expedition choices

### Choices

**FULL REPAIR**  
Spend Salvage and continue repaired.

**CONTINUE DAMAGED**  
Keep resources and continue in current condition.

**RETURN TO STATION**  
End the expedition successfully and bank the run.

### Galactic Engineers interaction

A Galactic Engineer encounter can appear at major intervals such as every 20 waves. It occurs after boss victory resolution, not simultaneously with it.

One overlay/state owner at a time.

---

## 10. Expedition reports

### Death report

Death should transition into a fast terminal-style status report rather than a static generic Game Over card.

Desired feel:

```text
RUN STATUS ........ LOST
WAVE REACHED ...... 17
HOSTILES DESTROYED 143
BOSSES DESTROYED .. 1
SALVAGE RECOVERED . 2,840
CORE RECOVERY ..... 1
```

Lines type/feed in quickly. Counters can animate. The final result should feel like ship telemetry reconstructing what happened.

### Successful return

Voluntary return after a boss uses the same report framework with successful language, for example:

```text
EXPEDITION STATUS .. SUCCESS
RETURN VECTOR ...... CONFIRMED
```

Both flows end cleanly at Station.

---

## 11. Asteroid/resource fields

Asteroid fields are their own encounter type.

Rules:

- no enemy ships during the field
- warning completes before the encounter begins
- fewer, better-spaced rocks
- asteroids bounce off each other
- asteroids bounce off the flagship
- collision does not damage the player
- large asteroids can fracture
- richness/size may affect HP and Salvage
- every fragment must be destroyed for encounter completion

The desired feel is closer to physics mining than a normal combat wave with rocks layered on top.

Resource warnings use their own visual identity rather than faction combat colors.

---

## 12. Persistent flagship progression

Fixed hull ladder:

1. Starfighter
2. Heavy Fighter
3. Gunship
4. Corvette
5. Light Frigate
6. Frigate
7. Heavy Frigate

The same save should visibly grow through this ladder.

### Target capacity direction

The original full-build target remains a useful progression shape:

| Hull | Crew | Weapons | Tactical | Utility | Drones | Escorts |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Starfighter | 2 | 2 | 1 | 1 | 0 | 0 |
| Heavy Fighter | 3 | 3 | 1 | 2 | 1 | 0 |
| Gunship | 4 | 4 | 2 | 2 | 1 | 0 |
| Corvette | 6 | 5 | 2 | 3 | 2 | 1 |
| Light Frigate | 9 | 7 | 3 | 4 | 3 | 2 |
| Frigate | 12 | 9 | 4 | 5 | 4 | 3 |
| Heavy Frigate | 16 | 12 | 4 | 7 | 5 | 4 |

Exact capacity numbers remain balance-tunable. The structural progression is the important part.

### Visual consistency rule

There is one flagship.

Combat, Main Menu, Ship screen, Arsenal preview, and launch previews must all show the same hull geometry, mounted equipment, drones, and support craft.

Different camera presentation is fine. Different ship design is not.

---

## 13. Permanent ship systems

Current conceptual relationships:

### Hull / Armor

Structural survivability.

### Shield Array

Controls:

- shield capacity
- recharge rate
- recharge delay

### Reactor

Supports:

- weapon efficiency/output
- Tactical System recharge/power
- modest shield/system assistance where appropriate

### Engines

Primarily matter for boss maneuvering and responsiveness.

### Crew Quarters

Controls active crew capacity.

### Fire Control

Physical permanent system supporting mounted weapons.

Fire Control should improve things such as:

- targeting
- tracking
- cycle performance
- modest output/operational quality

It does not replace weapon-family R&D.

### Drone Bay and Hangar

These are not generic Systems-screen purchases in the current direction.

They are foundational capabilities installed through R&D:

- Drone Development I -> installs Drone Bay
- Flight Development I -> installs Hangar

This makes their dependency chain teachable and meaningful.

---

## 14. Weapons and hardpoints

Current base weapon families are nine mechanically distinct families:

- Autocannon
- Pulse Laser
- Railgun
- Beam Lance
- Plasma Mortar
- Flak Battery
- Ion Arc
- Missile Rack
- Torpedo Tube

The older full-build spec proposed a larger 12-family / 48-weapon catalog. That is long-term expansion direction, not a requirement to fake variety by duplicating current weapons.

### Hardpoint rules

- weapon mounts are instances
- duplicates are allowed
- shots originate from visible hardpoints/muzzles
- hardpoints can independently target
- different weapons can attack different enemies
- equip UI should show the actual ship and actual mount slots
- replacing an occupied mount is explicit

Each family needs a tactical identity, not just a DPS number.

---

## 15. Drones and support craft

These are permanent equipment categories.

### Drones

Offensive drones roam/engage within a leash and return.

Defensive drones remain close and can repair, shield, intercept, or provide point defense.

R&D direction:

**Drone Development**

1. Drone Bay installation
2. basic chassis such as Striker / Guardian
3. specialized chassis such as Ion / Repair
4. expanded control capacity
5. advanced chassis such as Bomber / Shield

An appropriate Engineer/Drone specialty is part of operating the system.

### Support craft

Support ships are distinct allied spacecraft, not large drones.

They arrive around Corvette/Light Frigate progression and require:

- Hangar
- appropriate pilots/flight crew
- crew capacity where relevant

R&D direction:

**Flight Development**

1. Hangar installation
2. Interceptor / Heavy Fighter
3. Bomber / EW craft and capacity
4. Rescue Cutter / Escort Gunship

Run cards may temporarily enhance these systems or add temporary extra craft.

---

## 16. Crew

Broad crew roles:

- Pilot
- Gunner
- Engineer
- Tactical
- Command

Specialties live underneath broad roles.

Engineer specialties can include:

- Drone Systems
- Shield Systems
- Reactor
- Repair
- EW

### Crew capacity

Only Active Crew aboard the flagship consume Crew Quarters.

Reserve Crew remain available at Station without consuming bunks.

### Dependency teaching

Locks should explain the ship through dependency chains:

```text
Hull -> hardpoint -> Crew Quarters -> Gunner -> weapon
Drone Bay -> Engineer/Drone specialty -> drone
Hangar -> Crew Quarters -> Pilot/Flight crew -> support ship
```

Crew is not just a stat bonus layer. Staffing is part of ship configuration.

---

## 17. R&D

R&D should unlock meaningful capability rather than endless tiny percentages.

Examples:

- new weapon families/behavior
- Drone Bay
- drone chassis
- expanded drone control
- Hangar
- support craft
- targeting functions
- rerolls/selection tools
- capacity

Research is real-time and may continue offline.

The interface should visibly show:

- active project
- countdown
- progress
- queue
- completion
- dependencies

Current rough research timings scale from tens of seconds early to several minutes for advanced work and remain tunable.

---

## 18. Temporary run cards

Run cards reset when the expedition ends.

### Draft

On level-up:

- combat pauses
- choose 1 of 3 cards
- card effects should have short clear explanations

### Controlled RNG

Offers should understand:

- equipped weapon families
- installed systems
- current build tags
- prerequisites
- synergies
- transformations

Weapon-family cards should not appear if that family is not equipped.

The system should gently support emerging builds without guaranteeing them.

### Rerolls

Current run rule:

- start each run with 3 rerolls
- gain +1 reroll per boss defeated
- reset on death/new run

### Auto

Auto can choose cards and use Tactical Systems.

When Auto is enabled during a draft, it should visibly think before choosing.

Auto should be competent but imperfect, not psychic.

Boss interaction still deserves deliberate pauses and readable state.

---

## 19. Card rarity

Current rarity language:

- **White - Common**
- **Green - Uncommon**
- **Blue - Rare**
- **Yellow - Epic**
- **Orange - Legendary**
- **Purple - Mythic**
- **Red - Fractured**

Fractured sits outside the normal ladder. It offers exceptional power with a meaningful cost.

Rarity should be communicated through border treatment, glyphs, subtle light, animation, and audio more than giant text labels.

---

## 20. Factions and sectors

Every ten-wave sector has a combat identity. At a sector boundary, a faction is selected and influences the waves leading to its boss.

Current people/race-level combat directions are:

### A'aru

Disciplined energy warfare, shields, coordinated fire.

### Nevari

Balanced, resilient, adaptable pressure.

### Rakkan

Aggressive kinetic/endurance combat, charges, close pressure.

### Elsari

Advanced technology, drones, ion warfare, precision.

### Olydran

Fortress behavior, armor, shields, controlled firing lanes.

### Svarin

Mobility, tempo, speed, rapid repositioning.

These are directional identities, not permission to use race names as final fleet/faction names.

### Naming architecture

Final structure should be:

```text
people/race
-> combat faction / fleet
-> sector identity
-> roster
-> boss pool
-> abilities
```

Final fleet/faction names remain unresolved until canon is provided.

### Avoid immediate faction repetition

Adjacent ten-wave sectors should generally not select the same faction twice in a row.

---

## 21. Pirates

Pirates are a conglomerate, not a pirate race.

Visual/combat direction:

- mixed ship origins
- stolen systems
- patched grey/scavenged identity
- mismatched technology
- asymmetry
- unpredictable combinations

Pirate bosses should feel assembled from things that were never supposed to work together.

---

## 22. Void

Void is its own fleet identity, not "normal ships painted black."

Direction:

- grey/black family with variable accents/outlines
- distinct silhouettes
- strange mechanics
- rare/scary presence
- higher difficulty
- better rewards
- not common in the earliest game

Void should feel wrong before it feels statistically strong.

---

## 23. Galactic Engineers

Galactic Engineers are neutral/trade encounters and are never fought.

A large Engineer city/frigate may appear at major intervals around every 20 waves.

Current encounter concept:

- three premium Legendary/Mythic technology/card options
- pay a fee to choose one
- or continue without purchasing

This encounter must sequence after boss resolution rather than competing with it.

---

## 24. Empire

Empire implementation remains intentionally unresolved.

Do not add major Empire combat logic, faction rules, or canon assumptions merely to fill a roster gap.

---

## 25. Economy

Persistent currencies remain intentionally simple:

### Salvage

Primary common permanent-progression currency.

It should be earned at a fairly generous pace so Station experimentation is encouraged.

### Boss Cores

Rarer boss/advanced-progression currency.

No premium-currency layer is part of the design.

---

## 26. Station

The Station is a menu interface, not a walkable location.

Primary current areas include:

- Ship
- Systems
- Arsenal
- Crew
- Fleet
- R&D / Research
- Launch

Settings lives outside the Station route.

### Ship page

The Ship page is a live diagnostic/showcase, not the primary upgrade menu.

It should display:

- editable ship name
- canonical live ship
- actual weapons/hardpoints
- drones/support craft
- dock/station environment
- restrained motion
- diagnostic bars
- records

Useful diagnostic categories include:

- Hull
- Shield
- Reactor
- Armor
- Crew
- Weapons
- Fire Control
- Drones
- Hangar

### Launch control

Launch is global Station chrome, anchored safely above the phone safe area. Long tabs scroll beneath a reserved bottom gutter rather than placing Launch inside transformed content.

---

## 27. Main menu and route flavor

Main Menu should feel like a live terminal view of the actual flagship.

It should include:

- starfield/parallax
- canonical live ship
- large STARSHIP SURVIVOR title
- restrained diagnostic animation
- clean Continue / New-Load / Settings hierarchy

### New / Load

Dedicated Flagship Records screen with three slots.

Occupied slots show useful identity/progression information and allow:

- Load
- Overwrite with confirmation
- Delete with confirmation

Empty slots create a new flagship.

### Settings

Dedicated route, no leaked Main Menu canvas or telemetry.

Current/future settings include:

- master audio
- motion
- haptics
- save management
- Audio Library / mappings
- Emberpacks
- accessibility/visual density options later

---

## 28. Visual direction

Core visual language:

- dark space
- angular ships
- strong silhouettes
- restrained luminous energy
- smoked glass UI
- geometric symbols
- minimal text

Avoid:

- pixel-art dependence
- Space Invaders visual logic
- overloaded neon-cyberpunk dashboards
- unreadable late-game effect soup

### Damage feedback

Shield and hull feedback must be visually distinct.

Shield:

- localized bubble/ripple
- stronger full-shell flash for heavy impact
- fracture/collapse on break
- no shield flash when shield is already zero

Hull:

- sparks
- fragments
- scorch
- electrical damage
- damaged trails/fire at critical state

---

## 29. Audio and haptics

Audio should eventually resolve semantic event IDs rather than fixed file names.

The current web build can use generated/synthesized sounds during development, but final architecture should support mapping and replacement.

Important identities include:

- shield hit
- heavy shield hit
- shield break
- hull impact
- boss arrival
- phase transition
- card select
- Legendary/Mythic result
- wave start
- system ready
- ship destruction
- each weapon family

Use variants and voice limits to stop high-fire-rate builds from becoming audio mush.

---

## 30. Emberpacks

The game should be pack-friendly without making the player-facing game feel like an editor.

Pack-capable content includes:

- cards
- weapons
- enemies
- bosses
- crew
- hulls
- research
- balance
- localization
- ship/UI/effect assets
- audio

Normal Emberpacks should be declarative data/assets/configuration, not arbitrary executable code.

---

## 31. Relative scale philosophy

The flagship keeps a reasonably consistent screen footprint for playability, while other objects scale relative to its hull progression.

This allows a powerful progression illusion:

- an enemy Corvette can look enormous next to the early Starfighter
- the same Corvette can later look peer-sized
- eventually it can look small next to a Frigate

Old bosses can visually become less imposing when revisited from later progression.

There is always a bigger fish.

---

## 32. Current UI/reporting principles

### System announcements

Sector, boss, Void, Pirate, and resource warnings should use a reusable system-warning language:

- text-forward
- no generic popup window when a clean overlay will work
- quick fade in
- dramatic hold
- slower fade out
- centered
- background slightly dimmed
- faction/resource color identity
- encounter begins only after warning resolves

### HUD

Wave number should be prominent.

Faction/fleet identity appears beneath it in matching color when appropriate.

Avoid repeating the same faction name three times across stacked labels.

---

## 33. What the original full-build spec still contributes

The original v1.0 blueprint remains useful for long-term architecture and ambition. Important ideas still carried forward include:

- full persistent progression loop
- seven visible hull stages
- real crew dependency
- faction-specific enemy behavior
- mechanic-driven bosses
- modular content architecture
- versioned saves/migrations
- semantic assets/audio
- mobile-first UI
- headless/balance tooling as a future goal
- strong definition-of-done standards

However, some exact content counts and placeholder names are not current commitments.

Do not force the game to contain 204 cards or 48 weapons merely because those were early scope targets. Build real variety first, then expand.

---

## 34. Explicitly superseded or corrected old assumptions

Current direction supersedes older material in these areas:

### Wave completion

**Current:** kill-complete encounter queue.  
**Not current:** generic timer-completed normal waves.

### Spawn rhythm

**Current:** continuous refill under active-pressure cap.  
**Not current:** obvious discrete enemy batches separated by dead air.

### Checkpoints

**Current:** 11, 21, 31, etc. after boss clear.  
**Not current:** starting directly at 10, 20, 30 bosses.

### Bosses

**Current:** dedicated boss framework, approach, movement, telegraphs, targetable subsystems, phases.  
**Not current:** generic large triangles or HP bricks.

### Ship previews

**Current:** one canonical flagship renderer.  
**Not current:** separate decorative menu/Ship-screen vessel design.

### Drone Bay / Hangar

**Current:** installed by R&D foundational levels.  
**Not current:** generic Systems-page upgrades disconnected from the research dependency chain.

### Faction names

**Current:** LoE race/fleet direction with final fleet naming unresolved.  
**Not current:** treating old Swarm/Bastion/Vector/etc. placeholders as canon.

---

## 35. Open design decisions

Keep these explicitly unresolved rather than silently inventing answers:

- final combat fleet/faction names beneath each LoE people
- exact Empire role in this game
- final number of base bosses per faction
- final elite/modifier catalog
- exact long-term card count
- exact long-term weapon catalog beyond the current nine families
- final R&D timing/economy tuning
- exact Engineer encounter cadence/reward pricing
- suspended-run behavior
- final Emberpack management UX
- final audio asset library and mapping format
- native iOS packaging details

---

## 36. Ground Build acceptance target

The foundation is ready to freeze only when the following feels coherent on a real phone:

### Main loop

```text
Main Menu
-> save slot
-> Station
-> Launch
-> Waves 1-9
-> Wave 10 boss
-> boss decision
-> Wave 11
-> death OR successful return
-> report
-> Station
```

### Required quality bar

- no recurring runtime faults
- no post-boss freeze
- New / Load works
- Settings works
- Launch footer behaves on every Station tab
- flagship is visually identical across every screen/context
- continuous wave pressure feels natural
- boss is visible/readable and has real mechanics
- checkpoint unlocks 11 rather than 10
- saves migrate without destroying progression
- reports feel intentional
- iPhone safe areas/layout are stable
- audio unlock is verified or clearly documented as unresolved

Only after this passes should the build be snapshotted as the Ground Build and development move confidently into larger content expansion.

---

## 37. Final experience target

Early game should feel lonely and exposed: a tiny ship, two crew, a couple guns, a lot of empty space.

Late game should feel almost impossible to believe came from that same save: a frigate holding the center while independent batteries track different targets, drones orbit and roam, support craft launch, shields ripple under impacts, missiles cross the screen, Tactical Systems reshape the battlefield, bosses lose physical systems, and the next sector still manages to look dangerous.

The screen can become spectacular.

The information should remain clean.

The flagship should always feel like **your ship**, becoming a legend one impossible wave at a time.
