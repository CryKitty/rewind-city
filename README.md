# Rewind City

_An overcast afternoon, 1996._

The pavement is still wet. The video store lights are on. You have the whole
afternoon.

Rewind City is a small, dreamy American district you can drift through in your
browser. No objectives, characters, scores, or destinations. Just a place to
spend a little time. Inspired by the quiet procedural exploration of
[Abyssal Garden](https://github.com/Noniv/abyssal-garden).

## Try it

Download **[index.html](index.html)** and open it in desktop Chrome or Edge.
Nothing to install. The entire city lives in that one file and works offline.
You can also serve the repository with any static web server (for example,
`python3 -m http.server`) and visit it from a desktop or mobile browser.
WebGL and hardware acceleration must be available. WebGPU is never required.

Click **Step outside** to begin. This gesture enables mouse capture and the
synthesized ambience. Escape returns your cursor. If mouse capture is denied,
click the scene to try again. Touch devices use the gestures below.

## Somewhere to be

Several blocks fade into grey fog beneath a moving cloud ceiling. Fluorescent
windows, faded brick, wet asphalt, a rooftop water tower. Telephone wires sag
between wooden poles. Streetlights and traffic signals are already on.

There is **REWIND VIDEO**, **Starlight Diner**, **Groove Merchant** records, and
the pink-and-cyan **INSERT COIN** alley. A gas station, fictional roadside ads,
a chain-link schoolyard with empty swings and a basketball hoop, a striped
parking lot and a blank drive-in screen. Beyond them, the **Starlight Motel**
and its empty pool. Boxy sedans, hatchbacks and wagons sit at the curb; a few
headlights circle the block. Crows cross the sky. Occasionally, a plane.

The sound is quiet: wind, distant traffic, dripping, and occasional suggestions
of a siren, school bell, train horn or crow. Every sound is synthesized live.

## Controls

| Desktop | Action                           |
| ------- | -------------------------------- |
| Mouse   | Look (captured after entering)   |
| W A S D | Drift forward, left, back, right |
| E / Q   | Float up / down                  |
| Shift   | Move faster                      |
| 1–6     | Jump to a viewpoint              |
| Esc     | Menu / release mouse             |
| M       | Mute / unmute                    |
| H       | Performance display              |

| Touch            | Action                                                                                |
| ---------------- | ------------------------------------------------------------------------------------- |
| Drag             | Look around                                                                           |
| Hold one finger  | Drift forward after a short delay                                                     |
| Hold two fingers | Drift faster                                                                          |
| Viewpoint chips  | Main Street, Rooftop, Arcade Alley, Video Store, Schoolyard / Parking Lot, Motel Pool |
| Menu button      | Detail, sound, controls, Resume                                                       |

Movement floats without gravity. Building faces gently stop one axis at a time,
so you can glide along them. Street height, a 60-metre ceiling, and district
bounds keep you nearby. Cars and small props are memories you may drift through.

## Detail levels

Low, Medium, and High change pixel density, fog distance, visible geometry, and
mist density. The first visit chooses a conservative setting from device hints;
your selection is remembered when browser storage is available. Low caps pixel
ratio at 1; Medium at 1.35; High at 1.75. After sustained slow frames, the city
steps down automatically. A manual selection gets a 30-second grace period.

The goal is smooth desktop exploration and usable phone performance. Actual
frame rate depends on the device and its WebGL implementation; these are targets,
not measurements across hardware. Press H to see your current frame rate.

## How it works

No assets, libraries, fonts, telemetry, or network requests. Seeded procedural
geometry becomes spatial batches in an immutable WebGL buffer. Distant batches
are culled; exponential fog softens the horizon. Simple shaded shapes share
materials, windows are generated grids, and a canvas builds the sign atlas.
A shader makes the soft clouds. Small dynamic meshes animate cars, swings,
crows, a plane and fine mist. Web Audio oscillators and filtered generated noise
make the ambience after you enter. WebGL2 is preferred, with a WebGL1 renderer
fallback and an explanatory message when neither is available.

## Make it your own

Requires Node 18+ for contributors only. There are no build dependencies.

```sh
npm run build
npm run build:readable
```

Both commands assemble the same root `index.html`; the default removes comments
and indentation conservatively. Rebuild after changing source. The checked-in
HTML is ready for visitors without Node.

- `source/world.js`: district layout, shop names, seeded buildings, cars, viewpoints.
  Try changing `palette.brick` or moving a viewpoint's `p` and `target`.
- `source/renderer.js`: WebGL shaders, geometry helpers, fog and clouds.
  Change the fog's `vec3(.53,.57,.58)` (and clear/sky fog colors together),
  or the cloud color `vec3(.62,.65,.65)` for a different afternoon.
- `source/main.js`: controls, collision, detail presets, animation loop.
  The movement speeds are `16` and `6` metres per second in `move()`.
- `source/audio.js`: atmosphere and the quiet schedule of distant sounds.
- `source/style.css` and `source/shell.html`: the page and its overlays.
- `source/build.mjs`: dependency-free assembler.

`BRIEF.md` is Muse's complete original direction; `prompt.txt` is the creative
summary. No real brands appear in the generated city.

## License

[MIT](LICENSE). Copyright (c) 2026 Avary Cooney.
