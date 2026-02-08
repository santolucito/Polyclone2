# PolyClone2 -- Tribe Definitions

## Scope

For the initial implementation, we build **4 starter tribes** matching Polytopia's free tribes. Special tribes (Aquarion, Elyrion, Polaris, Cymanti) and additional regular tribes are deferred.

---

## Starter Tribes

### 1. Xin-Xi

| Property | Value |
|---|---|
| **Color** | Red (#d13440) |
| **Starting Tech** | Climbing |
| **Starting Unit** | Warrior |
| **Theme** | East Asian (Japanese/Chinese) -- cherry blossoms, Mt. Fuji-like mountains, kabuto helmets |

**Terrain Spawn Modifiers:**

| Terrain/Resource | Multiplier |
|---|---|
| Forest | 1.0x |
| Mountain | 1.5x |
| Fruit | 1.0x |
| Crop | 1.0x |
| Animals | 1.0x |
| Metal | 1.5x |
| Fish | 1.0x |

**Gameplay:** Mountain access from turn 0. Extended vision on mountains. Strong early mining economy path (Climbing -> Mining -> Smithery). Can rush Swordsmen faster than other tribes.

---

### 2. Imperius

| Property | Value |
|---|---|
| **Color** | Blue (#3f51b5) |
| **Starting Tech** | Organization |
| **Starting Unit** | Warrior |
| **Theme** | Classical Greco-Roman -- cypress trees, columned buildings, toga-clad citizens |

**Terrain Spawn Modifiers:**

| Terrain/Resource | Multiplier |
|---|---|
| Forest | 1.0x |
| Mountain | 1.0x |
| Fruit | 2.0x |
| Crop | 1.0x |
| Animals | 0.5x |
| Metal | 1.0x |
| Fish | 1.0x |

**Gameplay:** Abundant fruit enables reliable turn-0 capital upgrade. Organization leads to Farming for strong economy. Well-rounded generalist tribe. Good for beginners.

---

### 3. Bardur

| Property | Value |
|---|---|
| **Color** | Dark Brown (#795548) |
| **Starting Tech** | Hunting |
| **Starting Unit** | Warrior |
| **Theme** | Norse/Scandinavian -- snowy pine forests, Viking helmets, wolves |

**Terrain Spawn Modifiers:**

| Terrain/Resource | Multiplier |
|---|---|
| Forest | ~0.8x |
| Mountain | 1.0x |
| Fruit | 1.5x |
| Crop | 0x (none!) |
| Animals | 1.0x |
| Metal | 1.0x |
| Fish | 1.0x |

**Gameplay:** Dense forests + animals. Hunting enables turn-0 capital upgrade. Path to Forestry (Lumber Huts) then Mathematics (Sawmill) for powerful forest economy. **Cannot farm** (zero crop spawn) -- compensated by forest-based economy. Considered the strongest tribe competitively.

---

### 4. Oumaji

| Property | Value |
|---|---|
| **Color** | Yellow (#ffc107) |
| **Starting Tech** | Riding |
| **Starting Unit** | Rider (not Warrior!) |
| **Theme** | Arabian/Egyptian desert -- palm oases, pyramids, sand dunes |

**Terrain Spawn Modifiers:**

| Terrain/Resource | Multiplier |
|---|---|
| Forest | 0.2x |
| Mountain | 0.5x |
| Fruit | 1.0x |
| Crop | 1.0x |
| Animals | 0.2x |
| Metal | 1.0x |
| Fish | 1.0x |

**Gameplay:** Starts with a Rider (2 movement, Dash, Escape). Sparse terrain -- mostly open desert fields. Excellent early exploration and rush potential. Weak economy due to few forests/animals. Roads tech is a natural next step for mobility.

---

## Baseline Terrain Rates (Reference: Luxidoor)

All tribe modifiers are applied against these base percentages:

| Terrain Type | Inner City | Outer City |
|---|---|---|
| Field | 48% | 48% |
| Forest | 38% | 38% |
| Mountain | 14% | 14% |

"Inner city" = tiles adjacent to a city/village. "Outer city" = tiles not adjacent to any city/village.

Resource spawn rates:
- Fish: ~50% of shallow water tiles
- All resources spawn **only within 2 tiles of cities/villages**
- Guaranteed minimum resources near each capital: ~2 fruit, ~2 animals, ~1 crop, ~2 fish (on water), ~1 metal (on mountain) -- modified by tribe multipliers

---

## Starting Conditions (All Tribes)

Every player begins with:
- 1 Capital City (Level 1), producing 2 SPT (1 base + 1 capital bonus)
- 1 Starting Unit on or adjacent to capital
- 1 Starting Technology
- Territory: 3x3 area around capital
- Visibility: territory revealed; rest is fog of war
- ~5 starting stars

---

## Future Tribes (Deferred)

These tribes are documented in the research files but not implemented in the initial release:

**Regular:** Kickoo, Hoodrick, Luxidoor, Vengir, Zebasi, Ai-Mo, Quetzali, Yadakk

**Special (unique mechanics):**
- Aquarion (amphibious units, water building)
- Elyrion (animal enchanting, dragons)
- Polaris (ice/freeze mechanics)
- Cymanti (poison, algae, fungi)
