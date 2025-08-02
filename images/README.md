# Image Filesystem Organization

This directory contains all images used by the BazaarGen application, organized by purpose and function.

## Directory Structure

### `/favicon/`
Website favicon and icon files
- `favicon.ico` - Main website favicon
- `favicon-16x16.png` - Small favicon
- `favicon-32x32.png` - Medium favicon
- `android-chrome-192x192.png` - Android Chrome icon
- `android-chrome-512x512.png` - Android Chrome icon (large)
- `apple-touch-icon.png` - Apple touch icon

### `/skill-frames/`
Skill card border and frame images
- `/borders/` - Main border images for skill cards (used with border-image CSS)
  - `bronze_frame.png`
  - `silver_frame.png`
  - `gold_frame.png`
  - `diamond_frame.png`
  - `legendary_frame.png`
- `/dividers/` - Divider lines between skill sections
  - `bronze_divider.png`
  - `silver_divider.png`
  - `gold_divider.png`
  - `diamond_divider.png`
- `/icon-overlays/` - Skill icon border overlays
  - `Skill_Frame_Bronze.png`
  - `Skill_Frame_Silver.png`
  - `Skill_Frame_Gold.png`
  - `Skill_Frame_Diamond.png`
  - `Skill_Frame_Legendary.png`

### `/skill-content/`
Content-related skill images
- `/skill-borders/` - Legacy frame system (if still needed)
  - `/bronze/` - Bronze frame variations (s, m, l)
  - `/silver/` - Silver frame variations (s, m, l)
  - `/gold/` - Gold frame variations (s, m, l)
  - `/diamond/` - Diamond frame variations (s, m, l)
  - `/legendary/` - Legendary frame variations (s, m, l)
- `/cooldown/` - Cooldown indicator images
  - `Bronze_Cooldown.png`
  - `Silver_Cooldown.png`
  - `Gold_Cooldown.png`
  - `Diamond_Cooldown.png`
  - `Legendary_Cooldown.png`

### `/keywords/`
Keyword and effect icons
- `/effects/` - Effect type icons (used in skill descriptions)
  - `ammo.png` - Ammunition icon
  - `burn.PNG` - Burn effect icon
  - `charge.PNG` - Charge effect icon
  - `crit.PNG` - Critical hit icon
  - `Damage.PNG` - Damage icon
  - `destroy.PNG` - Destroy effect icon
  - `freeze.PNG` - Freeze effect icon
  - `Haste.PNG` - Haste effect icon
  - `heal.PNG` - Heal effect icon
  - `lifesteal.PNG` - Lifesteal effect icon
  - `multicast.PNG` - Multicast effect icon
  - `poison.PNG` - Poison effect icon
  - `Regen.PNG` - Regeneration icon
  - `slow.PNG` - Slow effect icon
  - `transform.PNG` - Transform effect icon
  - `value.PNG` - Value icon
- `/keytext/` - Keyword text icons (used in skill text processing)
  - Various keyword icons for text replacement

### `/ui/`
User interface elements
- `/arrows/` - Arrow and navigation icons
  - `use-arrow.png` - Use arrow icon
- `/previews/` - Preview and display images
  - `site-preview.PNG` - Site preview image

### `/characters/`
Character portraits and default images
- `jules.PNG` - Jules character portrait
- `mak.png` - Mak character portrait
- `neutral.png` - Neutral character portrait
- `pyg.png` - Pyg character portrait
- `stelle.png` - Stelle character portrait
- `dooly.png` - Dooly character portrait
- `vampire.png` - Vampire character portrait
- `Vanessa.PNG` - Vanessa character portrait
- `default.png` - Default character image
- `Cooldown.PNG` - Default cooldown icon

## Usage Guidelines

### Skill Frames
- Use `/skill-frames/borders/` for main skill card borders (border-image CSS)
- Use `/skill-frames/icon-overlays/` for skill icon borders
- Use `/skill-frames/dividers/` for section dividers

### Keywords
- Use `/keywords/effects/` for effect icons in skill descriptions
- Use `/keywords/keytext/` for text replacement icons

### Characters
- Use `/characters/` for all character portraits and default images

### UI Elements
- Use `/ui/arrows/` for navigation arrows
- Use `/ui/previews/` for preview images

## File Naming Conventions

- **Frames**: `{rarity}_frame.png` (e.g., `gold_frame.png`)
- **Dividers**: `{rarity}_divider.png` (e.g., `silver_divider.png`)
- **Icon Overlays**: `Skill_Frame_{Rarity}.png` (e.g., `Skill_Frame_Gold.png`)
- **Effects**: Lowercase with descriptive names (e.g., `burn.PNG`, `heal.PNG`)
- **Characters**: Character names (e.g., `jules.PNG`, `mak.png`)

## Maintenance

When adding new images:
1. Place them in the appropriate category directory
2. Follow the existing naming conventions
3. Update this README if adding new categories
4. Ensure file extensions are consistent (.png vs .PNG) 