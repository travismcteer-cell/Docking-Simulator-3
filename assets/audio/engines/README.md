# Marine engine audio pack

Nine mono, 44.1 kHz, 16-bit PCM WAV loops, six seconds each. Created from the three supplied profiles using Engine Pulse Lab v9. Layer settings are preserved; listening volume is ignored, matching the configurator's export convention. A shared 0.9 export gain preserves relative levels across clips. No individual loudness normalization.

Idle RPM: diesel 640, gas V8 900, outboard 940. Working and high anchors: 1800 and 3000 RPM. These are sound-design anchors, not engine specifications or maximum operating RPM. Higher-RPM race/outboard operation needs additional validation or recordings.

## Audition
Extract this ZIP, then open audition.html. Each audio player loops its recording. Listening in the game is still needed: files have numerical checks for clipping and boundary continuity but have not been auditioned by the assistant.

## Integration
Use manifest.json for the exact file names, recorded RPM, and loop duration. Fetch and decode WAVs into Web Audio AudioBuffers once, preferably only for the selected engine family. Set AudioBufferSourceNode.loop = true, loopStart = 0 and loopEnd to the manifest duration. Playback starts only after a user gesture. Stop/suspend audio when the page is hidden.

For a target RPM, select the two nearest recorded RPM anchors and set each source's playbackRate to targetRPM / recordedRPM. Blend their gains smoothly across the interval. Tune crossfades by ear: the sources share tonal content, so phase interference or level changes are possible. Avoid abrupt gain or playback-rate steps; apply short ramps. A separate gain controls load/overall loudness. Above 3000 RPM, modest pitch shifting of the high loop is a provisional fallback only.

Twin engines can share decoded buffers but require separate playback sources and RPM control. Start with a reduced master level for twins. Never decode files in the frame loop. This pack requires no procedural synthesis during gameplay.

## Loop preparation
Two-second synthesis warm-up. Loop length is an integral number of four-stroke cycles. A raised-cosine overlap blends a matching-cycle continuation into the start, avoiding a fade-to-silence at the wrap. Random noise and independent induction phase are blended across the seam. Numerical checks show no clipping and wrap steps below 0.0011 full scale. This is not a guarantee of perceptual seamlessness on every playback system.

## Rebuild
With Node.js installed, run `node render.cjs` from this directory. Source profiles and the exact synthesizer snapshot are included. This does not modify the game or hosted configurator.

## Docking game first-pass playback

Enable engine sound in Home → Settings → Engine sound; sound defaults off at 50% listening volume. Automatic assignment: Express-33, sportfisher-30 and deadrise-40 use gas; Motoryacht-60 uses diesel; bowrider uses outboard. The Engine type selector overrides this assignment. NPC boats are silent.

Neutral plays the idle anchor. 10% ahead/astern pitch-shifts only the idle recording to idle + 200 RPM, with a small gain increase (0.55 to 0.62). 25% ahead/astern uses the 1800 RPM working recording. Full racing power uses the 3000 RPM high recording. Between those controls the audio curve blends continuously; 50% racing power falls between working and high. This is an audio response curve, not a physics or engine specification change. Reverse uses the same audio response as forward. Adjacent loops use equal-power crossfades and pitch adjustment; twin engines have independent sources and slightly different starting phase, sharing decoded buffers.

Audio control updates run at no more than 20 Hz, outside the physics loop. The selected family is fetched/decode-cached once. Menus, completion, disabled sound, zero volume and hidden tabs stop sources and suspend the audio context. The next gameplay interaction can unlock/resume audio if required by the browser. Device listening is needed to tune blend, timbre and race RPM.

The deadrise workboat additionally smooths its audio RPM: throttle supplies 78% of the rise above idle, and boat speed adds up to the remaining 22% by 20 knots. RPM approaches its target with a 0.9-second acceleration / 0.35-second deceleration response. Neutral returns toward idle regardless of coasting speed. This is a first-pass audio calibration, not a propeller or engine model. The calculation shares the existing 20 Hz audio control update and adds no audio sources.
