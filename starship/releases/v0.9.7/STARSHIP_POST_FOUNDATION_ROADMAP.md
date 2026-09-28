# LoE: Starship Survivor — Post-Foundation Roadmap

**Status:** Living roadmap for work after the v1.0 Foundation freeze  
**Foundation candidate:** v0.9.8  
**Repository:** `myth-b0y/loe-game`  
**Game path:** `starship/`

This document begins **after** the v0.9.8 Foundation Candidate has passed regression testing and is frozen as **v1.0 FOUNDATION**.

The purpose is to keep post-1.0 work deliberate. The game already works as a game. The next phase is about giving builds identity, making endless progression sustainable, and expanding depth without turning every run into “collect every card and become immortal.”

---

## 1. Foundation boundary

v1.0 FOUNDATION should prove that the core machine is trustworthy:

- normal waves work and are kill-complete
- bosses physically appear and resolve every sector
- checkpoints are reliable
- Galactic Engineers arrive and trade without deadlocking the run
- saves and checkpoint migration are stable
- shields, hull hits, target locks, weapon aiming, asteroids, drones, and support craft behave coherently
- the Build screen accurately shows the current run
- the game can run for long expeditions without obvious state corruption

After the freeze, avoid rewriting foundation systems unless a real defect requires it.

The post-Foundation question becomes:

> **What kind of build am I making, and how far can I carry it?**

---

# v1.1 — Run Build Architecture

The current card system is too wide. A successful long run eventually owns almost everything, which erases build identity and creates runaway scaling.

v1.1 turns the run into a finite build with upgradeable paths.

## Build categories

A run has a limited number of build categories/slots. Exact counts should be tuned, but the structure should distinguish concepts such as:

- Weapon Paths
- Defense
- Drone Systems
- Tactical / Utility
- Core / Systems

Acquiring a foundational card occupies a slot in its category.

Once a category is full, drafts should stop offering unrelated new foundations for that category and increasingly offer upgrades to what is already installed.

Early run:
- discoveries
- foundational cards
- first build commitments

Mid run:
- upgrades
- branch choices
- synergy pieces

Late run:
- upgrades
- evolutions
- rare rule-breakers
- very few entirely new foundations

The goal is for a late-game build to become **deeper**, not merely wider.

---

## Modifier subcategories

The “one kind of thing” rule should operate at a subcategory level, not as a blanket ban on stacking interesting effects.

A weapon path can contain different modifier types at the same time, but normally only one modifier from each subcategory.

### Shot Pattern
Changes how the weapon releases fire.

Examples:
- Scatter
- Burst
- Split
- Salvo

Only one Shot Pattern is normally active on a weapon path.

### Contact / Trajectory
Changes what happens after the projectile is launched or hits something.

Examples:
- Ricochet
- Pierce
- Chain
- Detonation

Only one primary Contact / Trajectory modifier is normally active unless an evolution explicitly breaks the rule.

### Payload / Effect
Changes what the hit does.

Examples:
- Ion
- Burn
- Armor Break
- Slow
- Shield Strip

### Signature
A rare defining transformation unique to that weapon path.

This means **Scatter + Ricochet is legal** because they occupy different jobs.

A Scatter weapon can fire multiple projectiles, and each projectile can ricochet according to the Ricochet level.

The system should still cap multiplication carefully so Scatter × Ricochet does not become exponential projectile soup.

---

## Unique cards

A unique foundation or unique modifier should not appear as a second independent copy once owned.

If the player owns:

`RICOCHET I`

future Ricochet offers become:

`RICOCHET II`
`RICOCHET III`
or a branch/evolution choice.

The player should not own three separate Ricochet cards that all stack independently.

The same rule applies to major shield, drone, tactical, and weapon-defining cards.

---

## Upgrade cards

Cards should carry visible levels.

Examples:

`RICOCHET I`
- 1 secondary bounce

`RICOCHET II`
- improved bounce range / retained damage

`RICOCHET III`
- additional bounce or stronger retained damage

The exact numerical progression should be conservative and capped.

Upgrades should often improve behavior, not only percentages.

---

## Build screen

The Build screen should visually reinforce the architecture.

Owned cards should appear as a **fanned hand/deck of real card faces**, not long menu rows.

Card face should communicate:
- rarity
- icon
- name
- level
- category
- evolution state

Tap a card:
- card lifts forward
- fan shifts around it
- detailed effect panel appears
- related evolution/synergy requirements can be inspected

The Build screen should also show live run stats.

---

# v1.2 — Weapon Identity & Evolutions

After finite build architecture exists, audit the weapon families.

Current families:

- Autocannon
- Pulse Laser
- Railgun
- Beam Lance
- Plasma Mortar
- Flak Battery
- Ion Arc
- Missile Rack
- Torpedo Tube

Do not keep nine merely because nine currently exist.

Each family should justify itself through:
- targeting behavior
- firing feel
- projectile/beam behavior
- card paths
- evolutions
- tactical role

Families that overlap too heavily can be merged or redesigned.

## Evolution system

Evolutions are structural transformations, not another ordinary rarity tier.

They should require:
- a weapon or system at a defined level
- one or more compatible modifiers
- sometimes another card/system
- sometimes a boss/core/resource condition

The evolved form should change behavior visibly.

Evolution should feel like the build crossing a threshold, not receiving +20% damage.

## Cross-system evolutions

Some evolutions can combine systems.

Examples in principle:
- weapon + drone
- weapon + shield
- tactical + weapon
- drone + defense

Keep these rare enough that they feel discovered rather than mandatory.

---

# v1.3 — Fractured Cards

Red / Fractured cards sit outside the normal rarity ladder and may partially ignore normal slot rules.

They are not just “better Mythics.”

They are bargains, mutations, scars, and dangerous shortcuts.

Possible structures:
- sacrifice maximum hull for extreme offense
- permanently weaken shields to evolve a weapon immediately
- gain a powerful extra modifier while adding a run-wide penalty
- duplicate a forbidden category at a cost
- convert one system into another
- one-time emergency transformations

Fractured cards can sometimes stack because their identity is that they break normal rules.

Their costs must remain meaningful at late waves.

---

# v1.4 — Endless Balance

Only perform the major endless-balance pass after finite build architecture exists.

Balancing the old “eventually own everything” system is mostly chasing runaway multiplication.

Key areas:

## Enemy pressure
Scale across multiple axes:
- encounter count
- simultaneous pressure
- enemy quality
- elite frequency
- accuracy / fire behavior
- composition complexity

Post-sector jumps should remain obvious.

## Sustain ceilings
Avoid effects that become stronger simply because enemy count increases.

Kill-based sustain should use mechanisms such as:
- charge thresholds
- internal cooldowns
- missing-shield scaling
- capped triggers per interval
- diminishing returns

Enemy density must not secretly become healing.

## Boss durability
Bosses should survive long enough for:
- pattern recognition
- subsystem decisions
- Phase II
- maneuvering

Avoid arbitrary invulnerability if possible. Prefer HP/shield scaling, defenses, patterns, and subsystem interactions that remain readable.

## Damage scaling
Watch multiplicative stacking across:
- rate
- damage
- projectile count
- ricochet
- pierce
- crit
- AoE
- on-hit effects

Multiplication should be exciting without becoming exponential nonsense by Wave 20.

## XP and draft pacing
Late runs should still level often enough to feel alive, but not so quickly that the player completes every upgrade tree immediately.

---

# v1.5 — Drone & Flight Expansion

The Foundation establishes the physical distinction:

## Drones
Drones orbit the flagship.

- Offensive drones orbit counter-clockwise.
- Defensive drones orbit clockwise.
- Offensive and defensive drones use separate orbital radii.
- Offensive drones fire at valid locked/proximity targets from their current orbital positions.
- Defensive drones repair, reinforce shields, intercept fire, absorb damage, or provide point defense.

Future cards can modify:
- drone count
- orbit radius
- orbit speed
- fire rate
- target radius
- projectile behavior
- interception
- repair
- shield contribution
- formation

## Support craft
Support craft remain piloted ships, not orbiting equipment.

They fly loose formation near the flagship and can:
- attack
- intercept
- repair
- perform electronic warfare
- carry heavier weapons
- provide specialized support roles

Flight Development, Hangar capacity, and crew/pilot requirements continue to govern them.

---

# v1.6+ — Content Expansion

Once the systems above are stable, expand the game outward again.

Potential areas:

- more boss archetypes
- faction-specific boss doctrine
- deeper Galactic Engineer encounters and inventory
- more support craft
- new drone chassis
- more Tactical Systems
- elite enemy variants
- faction fleet identity
- Pirate fleet variety
- Void encounters
- more evolutions
- more Fractured cards
- audio library / semantic sound mapping
- richer impact and destruction VFX
- native/mobile packaging work

Content should be added onto the stable rules rather than forcing another foundation rewrite.

---

# Design guardrails

1. **A run should have identity.**
   A late build should be describable in a sentence.

2. **Depth over inventory.**
   Upgrading and evolving chosen systems is more valuable than owning every possible system.

3. **Different modifier jobs may stack.**
   Scatter + Ricochet is valid because they occupy different subcategories.

4. **Same-job modifiers compete.**
   Two different Shot Pattern foundations should normally not coexist on the same weapon path unless an evolution explicitly allows it.

5. **Endless should feel endless without requiring literally infinite handcrafted content.**
   Deep upgrade paths, evolutions, sector escalation, bosses, Fractured cards, and changing compositions create the illusion of an expedition that can keep going.

6. **Power must create decisions.**
   The player should not automatically become stronger in every direction at once.

7. **Never balance away the spectacle.**
   Late runs should still become wild. The goal is controlled insanity, not sterile fairness.

---

# Immediate order after v1.0 Foundation

1. v1.1 Run Build Architecture
2. v1.2 Weapon Identity & Evolutions
3. v1.3 Fractured Cards
4. v1.4 Endless Balance
5. v1.5 Drone & Flight Expansion
6. v1.6+ Content Expansion

This order is intentional.

First define what a build **is**.  
Then define how it **evolves**.  
Then introduce cards that **break the rules**.  
Then tune endless progression around those rules.  
Then expand the sandbox.
