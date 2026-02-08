# PolyClone2 -- Map Generation Reference

---

## 1. Map Sizes

| Size | Dimensions | Tiles | Usage |
|------|-----------|-------|-------|
| Tiny | 11x11 | 121 | 1 opponent |
| Small | 14x14 | 196 | 2 opponents |
| Normal | 16x16 | 256 | 3 opponents (Perfection default) |
| Large | 18x18 | 324 | 4+ opponents |

**Scaling (Domination mode):** Map size scales with opponent count automatically.
**Perfection mode:** Always Normal (256 tiles).

---

## 2. Water Levels

| Type | Water % | Description |
|------|---------|-------------|
| Drylands | 0-10% | Minimal water |
| Lakes | 25-30% | Small inland bodies |
| Continents | 40-70% | Multiple landmasses |
| Pangea | 40-60% | One large central landmass |
| Archipelago | 60-80% | Many small islands |
| Water World | 90-100% | Almost all water |

---

## 3. Capital Placement (Quadrant System)

| Player Count | Domains | Layout |
|---|---|---|
| 1-4 | 4 quadrants | 2x2 grid |
| 5-9 | 9 quadrants | 3x3 grid |
| 10-16 | 16 quadrants | 4x4 grid |

Each capital is placed within a separate quadrant to ensure reasonable starting separation.

**Exception:** Continents and Pangea modes skip quadrants. Capitals are converted from existing villages, prioritizing maximum separation and coastal adjacency.

---

## 4. Village Placement

### Suburbs (Lakes and Archipelago only)
- Up to 2 "suburb" villages placed near each capital before terrain generation
- 0-2 suburbs per capital possible

### Pre-terrain Villages
- Formula: `((map_width / 3)^2 - capitals_and_suburbs) * density_coefficient`
- Density: 0.3 for Lakes/Archipelago, 0.1 for Water World
- Minimum 2 tiles apart

### Post-terrain Villages
- Minimum 2 tiles from other villages
- Minimum 3 tiles from map edges
- No more than 1 village per 3x3 area

### Continents/Pangea
- Skip suburbs and pre-terrain villages
- Place fixed count on land, convert some to capitals
- Island villages: Small=1, Normal=2, Large=3

---

## 5. Terrain Generation Process

1. Place capitals using quadrant system
2. Place suburbs (Lakes/Archipelago)
3. Place pre-terrain villages
4. Generate water tiles per map type's wetness %
5. Assign terrain types (field, forest, mountain) per tribe spawn rates
6. Place resources on terrain within 2 tiles of cities/villages
7. Place post-terrain villages
8. Scatter ruins and starfish

---

## 6. Terrain Spawn Rates

### Base Rates (Luxidoor/Default)

| Terrain | Rate |
|---|---|
| Field | 48% |
| Forest | 38% |
| Mountain | 14% |

### Tribe Modifiers (Starter Tribes)

| Tribe | Forest | Mountain | Fruit | Crop | Animal | Metal | Fish |
|---|---|---|---|---|---|---|---|
| Xin-Xi | 1.0x | 1.5x | 1.0x | 1.0x | 1.0x | 1.5x | 1.0x |
| Imperius | 1.0x | 1.0x | 2.0x | 1.0x | 0.5x | 1.0x | 1.0x |
| Bardur | ~0.8x | 1.0x | 1.5x | 0x | 1.0x | 1.0x | 1.0x |
| Oumaji | 0.2x | 0.5x | 1.0x | 1.0x | 0.2x | 1.0x | 1.0x |

### Resource Rules
- All resources spawn only within 2 tiles of cities/villages
- Fish: ~50% of shallow water tiles
- Guaranteed minimum near capital (~2 fruit, ~2 animals, ~1 crop, ~2 fish, ~1 metal) adjusted by tribe modifiers

---

## 7. Ruins

### Count by Map Size

| Size | Ruins |
|---|---|
| Tiny | ~4 |
| Small | ~6-8 |
| Normal | ~8-10 |
| Large | ~12-15 |

### Placement Rules
- Not adjacent to capitals
- Not adjacent to other ruins
- Any terrain except shallow water
- Cannot develop tile until ruin examined

### Ruin Rewards (Equal Probability)
1. **Resources**: 10 stars
2. **Scrolls of Wisdom**: Free technology
3. **Population**: +3 pop to capital
4. **Explorer**: Free Explorer unit
5. **New Friends**: Veteran Swordsman (land ruins)
6. **Rammer**: Veteran Rammer with Warrior (water ruins)

---

## 8. Starfish

- ~1 per 25 water tiles
- Not adjacent to other starfish, lighthouses, or cities
- Harvest: move unit onto tile, spend turn, get 8-10 stars
- Requires Navigation tech

---

## 9. Lighthouses

- Pre-placed in the 4 corners of every map
- Discovering one adds +1 population to capital
- Finding all 4 unlocks Eye of God monument

---

## 10. Terrain Types

### Land

| Type | Move Cost | Defense | Resources | Notes |
|---|---|---|---|---|
| **Field** | 1.0 | None | Fruit, Crop | Default; most buildings built here |
| **Forest** | All remaining (stops unit) | 1.5x (Archery) | Animals | Clear/Burn possible; road negates penalty |
| **Mountain** | All remaining (stops unit) | 1.5x (Climbing) | Metal | Impassable without Climbing; +2 vision |

### Water

| Type | Definition | Defense | Notes |
|---|---|---|---|
| **Shallow Water** | Shares edge with land | 1.5x (Aquatism) | Bridges; basic naval |
| **Ocean** | No edge with land | 1.5x (Aquatism) | Requires Navigation |

### Fog of War (Cloud)
- Covers all unexplored tiles
- 3 states: unexplored (cloud), explored-not-visible (terrain shown, units hidden), visible (full info)
- Once terrain revealed, stays revealed
