# PolyClone2 -- Game Mechanics Reference

Complete reference for implementing core game mechanics. Derived from extensive research of The Battle of Polytopia's forums, wikis, and community guides.

---

## 1. Combat System

### Formula (Fully Deterministic)

```
attackForce  = attacker.ATK * (attacker.currentHP / attacker.maxHP)
defenseForce = defender.DEF * (defender.currentHP / defender.maxHP) * defenseBonus
totalDamage  = attackForce + defenseForce

attackResult  = round((attackForce  / totalDamage) * attacker.ATK * 4.5)
defenseResult = round((defenseForce / totalDamage) * defender.DEF * 4.5)
```

- `attackResult` = damage dealt TO the defender
- `defenseResult` = retaliation damage dealt TO the attacker
- Damaged units attack with less force AND defend with less force
- Retaliation uses defender's DEF stat (not ATK)
- Retaliation calculated based on HP **before** the attack lands
- The 4.5 multiplier means actual damage >> raw stat values
- **Attacking from defensive terrain grants NO bonus** -- only defenders benefit

### Defense Bonuses

| Terrain / Condition | Multiplier | Notes |
|---|---|---|
| Field (open ground) | 1.0x | Default |
| Forest | 1.5x | Requires Archery tech |
| Mountain | 1.5x | Requires Climbing tech |
| Shallow Water | 1.5x | Requires Aquatism tech |
| Ocean | 1.5x | Requires Aquatism tech |
| City (no walls) | 1.5x | Unit inside a friendly city |
| City Wall | 4.0x | Requires city level 3 wall upgrade |

### Retaliation Rules

Retaliation does **NOT** occur when:
1. The defender is killed by the attack
2. The attacker is outside the defender's range (e.g., Archer attacking melee from 2 tiles)
3. The attacker is hidden by fog of war
4. The defender has the **Stiff** skill (Catapult, Mind Bender)
5. The defenseResult rounds to 0

### Worked Examples

**Swordsman (3 ATK, 3 DEF, 15/15 HP) attacks Defender (1 ATK, 3 DEF, 15/15 HP) in forest (1.5x):**
```
attackForce  = 3 * (15/15) = 3.0
defenseForce = 3 * (15/15) * 1.5 = 4.5
totalDamage  = 7.5
attackResult  = round((3.0/7.5) * 3 * 4.5) = round(5.4) = 5 damage to defender
defenseResult = round((4.5/7.5) * 3 * 4.5) = round(8.1) = 8 retaliation to swordsman
```
Result: Defender 15->10 HP, Swordsman 15->7 HP.

**Knight (3.5 ATK, 1 DEF, 10/10 HP) attacks half-health Warrior (2 ATK, 2 DEF, 5/10 HP) on field:**
```
attackForce  = 3.5 * (10/10) = 3.5
defenseForce = 2 * (5/10) * 1.0 = 1.0
totalDamage  = 4.5
attackResult  = round((3.5/4.5) * 3.5 * 4.5) = round(12.25) = 12 -> warrior dies
```
No retaliation (defender killed). Knight's Persist triggers chain attack.

---

## 2. Technology Tree

### Cost Formula

```
Tech Cost = (Technology Tier) x (Number of Cities) + 4
```

With **Literacy** (from Philosophy): costs reduced by 33% (rounded up).

| Cities | Tier 1 | Tier 2 | Tier 3 |
|--------|--------|--------|--------|
| 1 | 5 | 6 | 7 |
| 2 | 6 | 8 | 10 |
| 3 | 7 | 10 | 13 |
| 5 | 9 | 14 | 19 |
| 10 | 14 | 24 | 34 |

### Tree Structure (5 Branches, 3 Tiers)

```
CLIMBING (T1)
  |-- Mining (T2) -----------> Smithery (T3)
  |-- Meditation (T2) -------> Philosophy (T3)

HUNTING (T1)
  |-- Archery (T2) ----------> Spiritualism (T3)
  |-- Forestry (T2) ---------> Mathematics (T3)

ORGANIZATION (T1)
  |-- Farming (T2) ----------> Construction (T3)
  |-- Strategy (T2) ---------> Diplomacy (T3)

RIDING (T1)
  |-- Roads (T2) ------------> Trade (T3)
  |-- Free Spirit (T2) ------> Chivalry (T3)

FISHING (T1)
  |-- Sailing (T2) ----------> Navigation (T3)
  |-- Ramming (T2) ----------> Aquatism (T3)
```

### Detailed Tech Unlocks

#### Tier 1

| Technology | Unlocks |
|---|---|
| **Climbing** | Mountain movement, mountain defense bonus, reveals Metal |
| **Hunting** | Hunt Animals (+1 pop, 2 stars), reveals Game |
| **Organization** | Harvest Fruit (+1 pop, 2 stars), reveals Crop |
| **Riding** | Rider unit (3 stars) |
| **Fishing** | Fish action (+1 pop, 2 stars), Port, Raft, shallow water movement |

#### Tier 2

| Technology | Prerequisite | Unlocks |
|---|---|---|
| **Mining** | Climbing | Mine (5 stars, +2 pop) |
| **Meditation** | Climbing | Mountain Temple (20 stars, +1 pop) |
| **Archery** | Hunting | Archer (3 stars), forest defense bonus |
| **Forestry** | Hunting | Lumber Hut (3 stars, +1 pop), Clear Forest (+1 star) |
| **Farming** | Organization | Farm (5 stars, +2 pop) |
| **Strategy** | Organization | Defender (3 stars), Peace Treaty |
| **Roads** | Riding | Road (3 stars), city connections |
| **Free Spirit** | Riding | Temple (20 stars, +1 pop), Disband |
| **Sailing** | Fishing | Scout ship (5 star upgrade), ocean movement |
| **Ramming** | Fishing | Rammer ship (5 star upgrade) |

#### Tier 3

| Technology | Prerequisite | Unlocks |
|---|---|---|
| **Smithery** | Mining | Swordsman (5 stars), Forge (5 stars, +2 pop/adj Mine) |
| **Philosophy** | Meditation | Mind Bender (5 stars), Literacy (-33% tech costs) |
| **Spiritualism** | Archery | Forest Temple (15 stars, +1 pop), Grow Forest (5 stars) |
| **Mathematics** | Forestry | Catapult (8 stars), Sawmill (5 stars, +1 pop/adj Lumber Hut) |
| **Construction** | Farming | Windmill (5 stars, +1 pop/adj Farm), Burn Forest (5 stars) |
| **Diplomacy** | Strategy | Cloak (8 stars), Embassy (5 stars), Capital Vision |
| **Trade** | Roads | Market (5 stars) |
| **Chivalry** | Free Spirit | Knight (8 stars) |
| **Navigation** | Sailing | Bomber ship (15 star upgrade), Starfish Harvesting (+8 stars) |
| **Aquatism** | Ramming | Water Temple (20 stars, +1 pop), ocean defense bonus |

---

## 3. Units

### Standard Units

| Unit | Cost | HP | ATK | DEF | Move | Range | Skills | Tech |
|---|---|---|---|---|---|---|---|---|
| **Warrior** | 2 | 10 | 2 | 2 | 1 | 1 | Dash, Fortify | Starting |
| **Archer** | 3 | 10 | 2 | 1 | 1 | 2 | Dash, Fortify | Archery |
| **Defender** | 3 | 15 | 1 | 3 | 1 | 1 | Fortify | Strategy |
| **Rider** | 3 | 10 | 2 | 1 | 2 | 1 | Dash, Escape, Fortify | Riding |
| **Swordsman** | 5 | 15 | 3 | 3 | 1 | 1 | Dash | Smithery |
| **Mind Bender** | 5 | 10 | 0 | 1 | 1 | 1 | Heal, Convert, Stiff | Philosophy |
| **Catapult** | 8 | 10 | 4 | 0 | 1 | 3 | Stiff | Mathematics |
| **Knight** | 8 | 10 | 3.5 | 1 | 3 | 1 | Dash, Persist, Fortify | Chivalry |
| **Cloak** | 8 | 5 | 0 | 0.5 | 2 | 1 | Hide, Creep, Infiltrate, Dash, Stiff, Scout | Diplomacy |
| **Giant** | -- | 40 | 5 | 4 | 1 | 1 | -- | City level 5+ reward |

### Naval Units

| Unit | Upgrade Cost | HP | ATK | DEF | Move | Range | Skills | Tech |
|---|---|---|---|---|---|---|---|---|
| **Raft** | Free | Carried unit's | 0 | 1 | 2 | -- | Water, Carry, Stiff | Sailing (Port) |
| **Scout (Ship)** | 5 | Carried unit's | 2 | 1 | 3 | 2 | Water, Dash, Carry, Scout | Sailing |
| **Rammer** | 5 | Carried unit's | 3 | 3 | 3 | 1 | Water, Dash, Carry | Aquaculture |
| **Bomber** | 15 | Carried unit's | 3 | 2 | 2 | 3 | Water, Carry, Splash, Stiff | Navigation |

Naval HP = HP of the land unit being carried inside.

### Unit Skills Reference

**Movement:**
| Skill | Effect |
|---|---|
| **Dash** | Can attack after moving same turn |
| **Escape** | Can move after attacking same turn |
| **Persist** | Can attack again after killing an enemy (chain) |
| **Creep** | Ignores terrain movement penalties (not mountains) |
| **Air** | Ignores ALL terrain barriers; cannot use roads |

**Combat:**
| Skill | Effect |
|---|---|
| **Stiff** | Cannot retaliate when attacked |
| **Splash** | Damages adjacent enemies; splash = attackResult / 2 |
| **Convert** | Converts enemy unit to friendly |

**Utility:**
| Skill | Effect |
|---|---|
| **Fortify** | Receives terrain/city defense bonus |
| **Heal** | Heals all adjacent friendlies by up to 4 HP |
| **Hide** | Invisible to enemies until acting |
| **Infiltrate** | Enters enemy city, spawns Daggers |
| **Scout** | Reveals 5x5 area (instead of 3x3) |
| **Carry** | Transports land unit on water |
| **Static** | Cannot become a veteran |

### Veteran / Promotion System

- **3 kills** makes a unit eligible for promotion
- Player manually triggers promotion (can delay)
- Promotion: **+5 max HP** and **full heal** to new max
- Optimal strategy: delay until heavily damaged (free full heal)
- Units with **Static** skill cannot be promoted (Giants, naval units, Cloak, etc.)

### Healing

| Location | HP/Turn |
|---|---|
| Friendly territory | 4 HP |
| Neutral territory | 2 HP |
| Enemy territory | 2 HP |

- Healing consumes the unit's entire turn
- Mind Bender can heal all adjacent friendlies by 4 HP (instead of acting)

---

## 4. Star Economy

### Per-Turn Income (Stars Per Turn / SPT)

| Source | SPT |
|---|---|
| City base | 1 SPT per city level |
| Capital bonus | +1 SPT |
| Workshop (level 2 reward) | +1 SPT |
| Park (level 5+ reward) | +1 SPT |
| Market | +1 SPT per level of adjacent Sawmill/Windmill/Forge |
| Embassy | +2 SPT (both builder and host) |

### One-Time Star Gains

| Action | Stars |
|---|---|
| Clear Forest | +1 |
| Harvest Starfish | +8 |
| Level 3 city (stars choice) | +5 |
| Disband unit | Half training cost |

### AI Difficulty Bonuses

| Difficulty | AI Bonus SPT |
|---|---|
| Easy | +1 |
| Normal | +2 |
| Hard | +3 |
| Crazy | +5 |

---

## 5. City System

### Population Thresholds

| Level | Pop to Reach | Cumulative | Units Supported | SPT |
|---|---|---|---|---|
| 1 | -- | 0 | 2 | 1 (2 for capital) |
| 2 | 2 | 2 | 3 | 2 |
| 3 | 3 | 5 | 4 | 3 |
| 4 | 4 | 9 | 5 | 4 |
| 5 | 5 | 14 | 6 | 5 |

### Level-Up Rewards (Player Chooses A or B)

| Level | Option A | Option B |
|---|---|---|
| 2 | **Workshop** (+1 SPT) | **Explorer** (reveals map) |
| 3 | **City Wall** (4x defense) | **5 Stars** (immediate) |
| 4 | **Border Growth** (3x3 -> 5x5) | **Population** (+3 pop) |
| 5+ | **Park** (+1 SPT, +250 pts) | **Super Unit** (Giant) |

### Territory / Borders

- Level 1-3 cities: 3x3 area (9 tiles)
- Level 4+ with Border Growth: 5x5 area (25 tiles)

### City Connections

- Connected via roads, bridges, or ports
- Both capital and connected city gain +1 population
- Severed if road chain is broken or city captured

### Siege

- Enemy unit on city tile = city produces zero income
- City captured by moving unit onto enemy city tile

### Population Sources

| Source | Pop | Cost | Cost/Pop |
|---|---|---|---|
| Harvest Fruit | +1 | 2 | 2.0 |
| Hunt Animals | +1 | 2 | 2.0 |
| Fish | +1 | 2 | 2.0 |
| Lumber Hut | +1 | 3 | 3.0 |
| Farm | +2 | 5 | 2.5 |
| Mine | +2 | 5 | 2.5 |
| Port | +1 | 7 | 7.0 |
| City Connection | +1 each | Road cost | varies |
| Monument | +3 | Free (task) | 0 |

---

## 6. Buildings

### Resource & Production

| Building | Cost | Pop | Placement | Tech |
|---|---|---|---|---|
| Farm | 5 | +2 | Field with Crop | Farming |
| Mine | 5 | +2 | Mountain with Metal | Mining |
| Lumber Hut | 3 | +1 | Forest | Forestry |
| Sawmill | 5 | +1/adj Lumber Hut | Field | Mathematics |
| Windmill | 5 | +1/adj Farm | Field | Construction |
| Forge | 5 | +2/adj Mine | Field | Smithery |
| Market | 5 | +1 SPT/adj production bldg | Field | Trade |
| Port | 7 | +1 | Coastal | Fishing |

### Infrastructure

| Building | Cost | Function | Tech |
|---|---|---|---|
| Road | 3 | Halves movement cost; city connections | Roads |
| Bridge | 5 | Cross 1 water tile; functions as road | Roads |

### Temples (+1 pop, gain score over time)

| Temple | Cost | Placement | Tech |
|---|---|---|---|
| Temple | 20 | Field | Free Spirit |
| Forest Temple | 15 | Forest | Spiritualism |
| Mountain Temple | 20 | Mountain | Meditation |
| Water Temple | 20 | Shallow water | Aquatism |

Temples: 100 pts base, +50 pts per level (every 2 turns), max 500 pts at level 5.

### Monuments (+3 pop, 400 pts, one per game)

| Monument | Task Requirement |
|---|---|
| Grand Bazaar | Connect 5 cities to capital |
| Emperor's Tomb | Accumulate 100 stars at once |
| Tower of Wisdom | Research all technologies |
| Gate of Power | Kill 10 enemy units |
| Altar of Peace | Don't attack for 5 turns |
| Park of Fortune | Upgrade any city to level 5 |
| Eye of God | Discover all lighthouses |

---

## 7. Terrain Actions

| Action | Cost | Effect | Tech |
|---|---|---|---|
| Clear Forest | Free | Remove forest -> field, +1 star | Forestry |
| Grow Forest | 5 | Field -> forest | Spiritualism |
| Burn Forest | 5 | Forest -> field with Crop | Construction |
| Disband Unit | Free | Remove unit, refund half cost | Free Spirit |

---

## 8. Turn Structure

1. **Income Collection** (automatic): Stars collected from all sources
2. **Action Phase** (any order): Research tech, harvest resources, build, train units, move/attack, capture villages, use abilities
3. **End Turn** (manual): Resets units, advances turn counter, next player

Key: There is **no enforced action order** within a turn. The player can freely interleave all action types.

---

## 9. Win Conditions

### Perfection (Single-Player, 30-turn limit)
- Maximize score across categories: units, territory, cities, monuments, temples, science
- 3,000 pts = 1 star; 10,000 = 2 stars; 50,000 = 3 stars

### Domination (Single-Player, no turn limit)
- Last tribe standing -- capture all enemy capitals/cities

### Score Categories
- Units: 5 pts per star of cost; super units 50 pts
- Territory: 20 pts per owned tile
- Exploration: 5 pts per discovered tile
- Cities: 100 pts base + 50 pts per level above 1
- Monuments: 400 pts each
- Temples: 100-500 pts (levels)
- Tech: 100 pts per tier researched

---

## 10. Movement

### Costs

| Terrain | Cost | Notes |
|---|---|---|
| Field -> Field | 1.0 | Standard |
| Road -> Road | 0.5 | Friendly/neutral roads only |
| Entering Forest | All remaining | Unit stops (unless Creep/Air/road) |
| Entering Mountain | All remaining | Requires Climbing; stops (unless Creep/Air) |
| Bridge | 0.5 | Functions as road |

### Zone of Control

- Enemy units create ZoC on adjacent tiles
- Entering a ZoC tile = unit must stop
- Creep and Air skills ignore ZoC

### Vision

| Source | Range |
|---|---|
| Standard unit | 1 tile (3x3 area) |
| Unit on mountain | 2 tiles |
| Scout skill | 2 tiles (5x5 area) |
| City | All tiles within borders |

---

## 11. Stacking Rules

- **One unit per tile** -- strict, no exceptions for gameplay
- Naval Carry is the only "exception" (land unit carried inside naval unit = one entity)
- Cannot move through tiles with enemy units
- Cannot train a unit if city tile is occupied
