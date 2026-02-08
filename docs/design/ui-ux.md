# PolyClone2 -- UI/UX Reference

---

## 1. Visual Style

### Low-Poly Aesthetic
- All models use simple geometric shapes with flat shading (no textures/gradients)
- Blocky, minimalist, colorful "toy-like" / "diorama" feel
- Vivid, saturated colors
- Each tribe has a distinct primary color

### Grid Appearance
- Square grid viewed from isometric (3/4 top-down) angle
- Grid lines are NOT drawn -- tiles are distinct raised square platforms with beveled edges
- Variable tile height: mountains taller, water lower, creating 3D terrain relief
- Map edge drops off into void/clouds

### Tribe Visual Differentiation
Each tribe has unique cosmetic designs for:
- Terrain (ground textures, tree types, decorative elements)
- Units (same types, different character models)
- Buildings (architecture varies)
- Cities (grow in tribe-specific styles)

### Territory Appearance
- Borders shown as colored regions matching tribe color
- Capturing territory transforms terrain aesthetic to match your tribe
- Bottom/base color of tiles indicates controlling tribe

---

## 2. In-Game UI Layout

### Top Bar (Always Visible)
- **Star Counter**: Current stars + income: e.g., "23 (+8)"
- **Turn Counter**: "Turn X" or "X/30" in Perfection
- **Score** (Perfection/Glory): Real-time updating
- **Tech Tree Button**: Top-right, opens overlay
- **Settings/Menu**: Gear icon
- **Game Stats**: Player rankings, city counts, scores

### Main View (Center)
- Isometric square grid
- Camera: pan (drag/swipe), zoom (pinch/scroll)
- **No rotation** -- fixed isometric angle
- City names float above tiles with population bars
- Territory borders as colored ground shading

### Bottom Area
- **End Turn Button**: Bottom-right, glows when all actions complete
- **Context-sensitive action panel**: Appears on unit/city selection
- **Notifications**: City level-ups, ruins, encounters

---

## 3. Selection & Interaction

### Unit Selection
- Tap friendly unit to select
- Blue-highlighted tiles show valid movement destinations
- Action icons appear (attack, special abilities)
- Tap highlighted tile to move
- Tap enemy in range to attack

### City Selection
- Tap friendly city to open action menu:
  - Available unit types with star costs
  - Available buildings to construct
  - Harvestable resources in borders
- Grayed out if insufficient stars or no valid tiles

### Battle Preview
- Long-press enemy with friendly unit selected
- Shows predicted damage to both sides
- Sweat drops on enemy = they will die
- Black/red ring on your unit = your unit dies from retaliation

### End Turn Button
- Glows/pulses when all units moved and no remaining useful actions
- Does not glow if units remain unmoved
- Long-press: highlights next unmoved unit

---

## 4. City Display

### On-Map Elements
- City buildings grow visually with level
- **City name** floats above in tribe color
- **Population bars** below name:
  - Blue/filled = current population
  - Empty = needed for next level
  - Red = negative population (reduces income)
- Connected cities show road symbol next to name

### Level-Up
- Modal popup with two large option buttons
- "Pop" animation as city grows

### Borders
- Level 1-3: 3x3 colored region
- Level 4+ with Border Growth: 5x5 colored region
- Clear visual demarcation between tribe territories

---

## 5. Animations & Feedback

### Movement
- Units slide/hop from tile to tile along path
- Road movement visually faster
- Naval units glide across water

### Combat
- Melee: attacker bounces/lunges, hit effect, damage shown
- Ranged: projectile arcs from attacker to defender
- Death: unit shrinks/pops with particle effect
- Retaliation: counter-bounce animation

### Star Collection (Turn Start)
- Stars fly from income sources toward star counter
- "Ping" sound per star arrival
- High income creates satisfying cascade

### City Level-Up
- Buildings "pop" into larger form
- Reward selection popup
- New buildings have pop-in animation

### Resource Harvesting
- Brief removal/collection animation
- Popup confirms population gain

### Tech Research
- Notification showing what was unlocked
- Tech tree updates visually

---

## 6. Game Setup Flow

### Main Menu
- Single Player -> Mode Selection
- Settings
- Large tappable buttons, low-poly aesthetic

### Setup Sequence
1. **Mode**: Perfection, Domination, Creative
2. **Tribe Selection**: Grid of tribe heads (circular icons in signature colors)
3. **Difficulty**: Easy, Normal, Hard, Crazy
4. **Opponent Count**: 1-4 for initial implementation
5. **Map Config** (Creative): Size, Water Level
6. **Start**: Procedural map generates, camera zooms to capital

---

## 7. Mobile Touch Patterns

| Gesture | Action |
|---|---|
| **Tap empty tile** | Deselect; show terrain info |
| **Tap friendly unit** | Select; show movement/actions |
| **Tap highlighted tile** | Move selected unit |
| **Tap enemy** (unit selected, in range) | Attack |
| **Tap friendly city** | Open city action menu |
| **Tap resource** (in borders) | Harvest confirmation |
| **Long-press enemy** | Battle preview |
| **Long-press End Turn** | Highlight next unmoved unit |
| **Drag/Swipe** | Pan camera |
| **Pinch** | Zoom in/out |

---

## 8. Score Display

### In-Game
- Star counter always visible (current + income)
- Turn counter (with /30 in Perfection)
- Score updates real-time in Perfection

### Game Stats Screen
- All known tribes with cities, score
- Ordered by score/power

### End-of-Game
- Full score breakdown by category
- Difficulty bonus applied
- Star rating (1-3 or halo)
- Personal best comparison

---

## 9. Audio Design

- Minimal ambient music (calm, meditative)
- Tribe-specific selection jingles
- UI click sounds
- Combat hit sounds
- Star ping cascade at turn start
- Chiptune/blippy aesthetic matching low-poly visuals

---

## 10. Keyboard Shortcuts (Desktop Enhancement)

- Enter / 4: End Turn
- Esc: Deselect / Close menu
- Arrow keys / WASD: Pan camera
- +/-: Zoom
- Undo: Single-player unit movement (before further actions)
