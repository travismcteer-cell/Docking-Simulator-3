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

Anchor, traffic, multiple boats, challenges, racing and challenge scoring are implemented; handling and scoring tuning remain iterative. The simplified scene keeps physics collisions at the hull's plan outline. Bobbing is cosmetic. Far shoreline scenery is decorative. Lines and fenders are tuned approximations for practice rather than an engineering model of real rope or rubber.

## Setup and touch update

The map uses SVG, with geometry drawn immediately rather than waiting for a canvas paint. Instanced perimeter trees and shore buildings provide landmarks. The largest central rectangular dock hosts the fuel building, pumps and canopy.

Current speed is adjustable from 0 to 3 kt. The existing physics applies moving-water resistance at the underwater centre, separately from wind at the air centre. Both direction dials indicate flow **toward**, not meteorological wind-from.

Play areas use touch-action:none and non-passive touch/gesture cancellation. Discrete touch buttons execute independently on pointerdown; engine holds retain per-pointer IDs. Native duplicate clicks are suppressed. Page scrolling is still available outside play areas. Browser chrome and reserved operating-system gestures require actual device verification and cannot be guaranteed suppressed.

## Compact touch controls

Steering, camera catch-up and setup sliders handle touch dragging explicitly, including when another finger holds a control. The narrow textured strip below the active helm uses native touchscreen page scrolling. There is no scripted scroll loop. Throttle and steering fit together in the available viewport, with a smaller scene on short screens. Camera catch-up is now in Practice setup. Routine contact and line status rows, Release all lines and Both neutral have been removed; individual line buttons still show their state. Startup errors remain visible if graphics initialization fails.

## Orientation controls

Portrait keeps the existing throttle/steering panel below the scene, including BOTH engine controls. Landscape moves independent port and starboard momentary throttle buttons inside the line/fender rails and places steering at bottom centre. Landscape has no BOTH engine buttons. Rotating preserves simulation and camera state while clearing held engine inputs to neutral. Camera catch-up remains in Practice setup.

## Express-33 visual

The boat uses the supplied configurator geometry and Express-33 definition, with a 31.5-foot hull, 11-foot beam and 2-foot swim platform (33.5 feet overall). Added fittings include rub rails, bow rails, cleats, cockpit seats, a wheel and instruments. Windscreen opacity defaults to 0.35 in src/graphics/boats.js. Geometry generators and the boat definition are separate modules; no external model files or extra dependencies are needed.

The convex docking collision perimeter follows the hull rail and includes the swim platform. Rope attachment positions match the visible cleats; fenders follow the new hull outline. Existing 31-foot twin-sterndrive handling calibration is retained rather than inferred from visual dimensions. All marina starts clear the enlarged outline. The berth test fixture was moved 0.2 feet inward to keep its starting position clear of the wider hull.

## Challenge scoring (version 1)

Challenges finish using their existing arrival/departure requirements, then receive a higher-is-better score out of 100: safety 70%, final control 20%, efficiency 10%. Elapsed time is informational. Races retain elapsed time plus false-start penalties; no challenge scoring is applied to races or Practice.

Safety samples up to 16 hull points at 10 Hz against nearby collision shapes. It uses closing velocity, including rotation, and relative NPC motion when the player is approaching. The initial envelope is `0.15 + 0.22 * sqrt(clearanceFeet)` knots, capped at 3 knots, sampled within 40 feet. Each sample contributes only its worst excess, so additional nearby boats do not multiply the penalty. Unsafe exposure accumulates over time; waiting cannot erase it. This is gameplay calibration, not a real-world stopping-distance rule.

Fender protection is assessed on exposed sides within four feet while closing. Missing protection deducts up to ten safety points; unnecessary fenders carry no penalty. Releasing side-on bow/stern departure lines without fenders adds a bounded preparation deduction; stern-to quay lines are excluded. Gentle protected contact costs zero, firm protected contact receives a reduced deduction, and fenders never reduce hard/crash severity for scoring. Hard impact caps overall score at 49; a crash caps it at 24. Contacts are debounced as before.

Final control averages alignment, speed and yaw during the required three-second arrival hold. Departure scoring assesses yaw at exit; existing line and anchor release conditions still apply. Efficiency counts gear-state changes and direction reversals for each engine, not raw taps, throttle changes within a gear, steering or equipment toggles. The first 12 gear changes per engine carry no shift deduction. Powered effort accumulates gently; necessary corrections should always take priority over efficiency.

Completion shows the category breakdown, gear changes, reversals, contact counts and coaching feedback. Best-score tracking and the 30-challenge progression now build on this scoring model. `SCORE_VERSION` permits future saved scores to distinguish scoring revisions. Phone/device testing is required to tune the envelope and costs against sensible docking manoeuvres.

## Thirty-challenge progression and saved bests

The original ten tasks form Group 1 (Foundations). Group 2 repeats them with the approved weather increases; Group 3 adds traffic, equipment failures or tighter clearance. Failures are present from the start and reset on returning to Practice. Failed forces are masked in physics, failed engine audio is muted, and unavailable controls are disabled (including BOTH when either engine is unavailable). A persistent notice appears at the bottom of the marina view. Challenges 29/30 require both-side fenders.

Crossing traffic repeats at the entrance approach (22) and near the west pier (24), with waits between crossings. The 40-foot gap in 26 is measured between neighbouring hulls. Close Med neighbours are placed outward from the player's berth with five-foot projected hull clearance on each side. The larger Express-33 uses a 42.65-foot finger berth in 23.

Best challenge scores and race times save locally in browser storage. Challenge bests use the highest total, then shorter elapsed time on ties. Race bests use the lowest total time including penalties. Records include score breakdown, date, challenge revision and scoring revision. They survive reloads in the same browser/device; they do not sync across devices and clearing site data removes them. Storage errors fall back to session-only records without interrupting the game.

The wind/current disc projects world-direction arrows into a water-parallel plane using the actual camera basis, including camera drag and locked views. Its position is anchored to the screen. Fixed blue wind and shorter green current arrows remain distinguishable even when directions agree. A small minimum tilt keeps the compass readable in Helm view. Zero-strength arrows are dimmed and numeric strengths remain visible. The SVG updates only when the camera or conditions change; no additional 3D render pass is used.

| Challenge | Group | Task | Boat | Wind (kt) | Current (kt) | Complication |
|---|---|---|---|---:|---:|---|
| 1 | 1 | Gas Dock Arrival | Express-33 | 0 | 0 | — |
| 2 | 1 | Crowded Gas Dock Departure | sportfisher-30 | 0 | 0 | — |
| 3 | 1 | Finger Slip Crosswind | bowrider | 3 | 0 | — |
| 4 | 1 | West Pier Cross-Current | Express-33 | 4 | 0.4 | — |
| 5 | 1 | Big Yacht Tight Departure | Motoryacht-60 | 3 | 0.6 | — |
| 6 | 1 | Gas Dock Squeeze | bowrider | 4 | 0.4 | — |
| 7 | 1 | Windy Dock Departure | Express-33 | 8 | 0.4 | — |
| 8 | 1 | Windy Med Arrival | Express-33 | 8 | 0.2 | — |
| 9 | 1 | Crowded Yacht Departure | Motoryacht-60 | 4 | 0.3 | — |
| 10 | 1 | Motor Yacht Med Arrival | Motoryacht-60 | 4 | 0.2 | — |
| 11 | 2 | Gas Dock Arrival | Express-33 | 0 | 0 | — |
| 12 | 2 | Crowded Gas Dock Departure | sportfisher-30 | 5 | 0 | — |
| 13 | 2 | Finger Slip Crosswind | bowrider | 10 | 0 | — |
| 14 | 2 | West Pier Cross-Current | Express-33 | 10 | 0.4 | — |
| 15 | 2 | Big Yacht Tight Departure | Motoryacht-60 | 14 | 0.6 | — |
| 16 | 2 | Gas Dock Squeeze | bowrider | 15 | 1 | — |
| 17 | 2 | Windy Dock Departure | Express-33 | 14 | 0.4 | — |
| 18 | 2 | Windy Med Arrival | Express-33 | 15 | 0.2 | — |
| 19 | 2 | Crowded Yacht Departure | Motoryacht-60 | 10 | 0.3 | — |
| 20 | 2 | Motor Yacht Med Arrival | Motoryacht-60 | 10 | 0.2 | — |
| 21 | 3 | Gas Dock Arrival | Express-33 | 0 | 0 | Port engine unavailable |
| 22 | 3 | Crowded Gas Dock Departure | sportfisher-30 | 5 | 0 | Crossing traffic |
| 23 | 3 | Finger Slip Crosswind | Express-33 | 6 | 0 | Starboard engine unavailable |
| 24 | 3 | West Pier Cross-Current | Express-33 | 10 | 0.4 | Crossing traffic |
| 25 | 3 | Big Yacht Tight Departure | Motoryacht-60 | 14 | 0.6 | Bow thruster unavailable |
| 26 | 3 | Gas Dock Squeeze | sportfisher-30 | 15 | 1 | 40-foot gap |
| 27 | 3 | Windy Dock Departure | Express-33 | 20 | 0.4 | — |
| 28 | 3 | Windy Med Arrival | Express-33 | 8 | 0.2 | Port engine unavailable |
| 29 | 3 | Crowded Yacht Departure | Motoryacht-60 | 4 | 0.3 | 5-foot side clearance; fenders required |
| 30 | 3 | Motor Yacht Med Arrival | Motoryacht-60 | 4 | 0.2 | 5-foot side clearance; fenders required |
