# Docking Trainer 3D — first playable

A small static web app for GitHub Pages. This is the first stage of the 2D game's migration: one 31-foot twin-sterndrive cruiser, the connected large marina from the latest 2D game, dock lines and fenders. It keeps the prototype's low chase camera and eight-second exponential catch-up for position and heading.

## Put it on GitHub Pages

1. Extract the ZIP.
2. Upload the **contents** of `docking-trainer-3d` to a new repository. `index.html`, `styles.css`, `src` and `vendor` must sit at its root. Keep the existing 2D repository as your working game.
3. In Settings → Pages, select Deploy from a branch, your main branch, and `/ (root)`.
4. Open the Pages link when GitHub finishes deployment.

No npm install, compilation, backend or paid hosting is required. Three.js is included locally, so the game has no runtime CDN dependency. JavaScript modules need HTTP hosting; double-clicking the index file from your filesystem will not work. For a local preview with Python installed, run `python -m http.server 8000` in this folder and visit `http://localhost:8000`.

## Try it

- Start at **F · Entrance** to navigate into the connected marina, or select another section directly.
- The start selector offers eight locations across sections A–F and the fuel dock. Changing the start resets the boat and releases all lines.
- Drag the scene to look around; release for a three-second exponential return. The boat chase still has an eight-second response.
- Wind speed changes surface roughness and ripple travel speed. Wind direction is explicitly the direction the wind blows toward (0° north, 90° east). Ripple motion follows the same direction as the force on the hull. Water movement is cosmetic; the boat physics applies wind forces separately.
- Orange buoys mark the original Med anchor guide locations. Anchor operation and paired Med stern lines are not included yet.
- Hold a 10 FWD, 25 FWD, 10 REV or 25 REV button to apply power. Release to return to neutral. Port and starboard can be held independently with two fingers; the BOTH column operates both engines. Keyboard users can hold Space or Enter on a focused button. The hull continues to carry momentum.
- Lines attach to a suitable fixed dock cleat within 12 feet. Forward springs lead aft; aft springs lead forward. Click the same button to release.
- Lines pull only when taut. Their visible sag changes with slack; status labels distinguish slack and taut.
- Deploy the fenders on the docking side before contact. They cushion side contact, permit sliding and allow engine/line/fender pivots. Bow and stern contact remains unprotected.
- Try a bow line with gentle reverse and steering to move the stern away. Try a spring line with a gentle forward pulse to compare the pivot.
- Switching browser tabs puts both engines in neutral.
- Scene controls: port controls sit on the left and starboard controls on the right; lines are grey and fenders white on both sides. Labels always refer to the boat, even when looking backward. Each side has independent bow, forward spring, aft spring and stern lines. Buttons show released/slack/taut. The selected side never falls back to the opposite side.
- View cycles Far, Medium and Helm. Helm looks forward from the helm and follows the boat immediately. All views allow drag-to-look. Far/Medium spring back after release; Helm holds the look angle and reverses horizontal drag. Recenter clears the look offset.
- The catch-up slider adjusts Far/Medium camera response from 0–16 seconds; Helm remains locked to heading. Boat reset preserves the chosen view and catch-up time.
- The top-right mini-map stays north-up and shows boat position/heading. Tap it to enlarge or shrink it. Wind and current controls live on the Practice setup screen, with circular direction dials. Setup pauses simulation and neutralizes engines.

## Project map

`index.html` and `styles.css` provide the shell. `src/main.js` connects independent modules:

| Folder | Responsibility |
| --- | --- |
| `src/data` | Boat parameters, hull outline, dock geometry, fixed cleats and spawns |
| `src/simulation` | State, original motion equations, collision sweep, line tension and fender forces |
| `src/graphics` | Procedural Three.js scene, chase camera, rope and fender appearance |
| `src/interface` | Inputs, start selection and status labels |
| `vendor` | Pinned Three.js 0.160.1 and its MIT licence |
| `tests` | Node tests for handling, contact, lines and camera |

Physics runs at 120 fixed steps per second; graphics run separately. Positions and speeds preserve the 2D app's simulator units. Rendering, attachment distances and contact geometry use feet; conversion is explicit. Line and fender tuning comes from version 8 of the current 2D app, adapted to this consistent coordinate system. Fixed visible dock cleats replace the 2D app's arbitrary edge attachment points. Boat side cleats follow the tapered hull.

## Validation

Run `npm test` if Node is installed; there are no dependencies to install. Browser checks cover rendering, all line controls, fenders, resets, a narrow phone layout, and loading from a repository-style subdirectory.

## Scope of this version

This is a migration foundation, not yet the full 2D game. Anchor, traffic, multiple boats, levels and scoring are still to be ported. The simplified scene keeps physics collisions at the hull's plan outline. Bobbing is cosmetic. Far shoreline scenery is decorative. Lines and fenders are tuned approximations for practice rather than an engineering model of real rope or rubber.

## Setup and touch update

The map uses SVG, with geometry drawn immediately rather than waiting for a canvas paint. Instanced perimeter trees and shore buildings provide landmarks. The largest central rectangular dock hosts the fuel building, pumps and canopy.

Current speed is adjustable from 0 to 3 kt. The existing physics applies moving-water resistance at the underwater centre, separately from wind at the air centre. Both direction dials indicate flow **toward**, not meteorological wind-from.

Play areas use touch-action:none and non-passive touch/gesture cancellation. Discrete touch buttons execute independently on pointerdown; engine holds retain per-pointer IDs. Native duplicate clicks are suppressed. Page scrolling is still available outside play areas. Browser chrome and reserved operating-system gestures require actual device verification and cannot be guaranteed suppressed.

## Compact touch controls

Steering, camera catch-up and setup sliders handle touch dragging explicitly, including when another finger holds a control. The narrow textured strip below the active helm uses native touchscreen page scrolling. There is no scripted scroll loop. Throttle and steering fit together in the available viewport, with a smaller scene on short screens. Camera catch-up is now in Practice setup. Routine contact and line status rows, Release all lines and Both neutral have been removed; individual line buttons still show their state. Startup errors remain visible if graphics initialization fails.

## Orientation controls

Portrait keeps the existing throttle/steering panel below the scene, including BOTH engine controls. Landscape moves independent port and starboard momentary throttle buttons inside the line/fender rails and places steering at bottom centre. Landscape has no BOTH engine buttons. Rotating preserves simulation and camera state while clearing held engine inputs to neutral. Camera catch-up remains in Practice setup.
