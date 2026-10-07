# Expanded Mars campaign

Start a **new Mars mission** for the expanded experience. Other destinations retain their six-chapter expeditions. Old checkpoints continue their original campaign.

## Implemented flow

1. Assemble four modular subsystems in the 3D hangar. An animated service arm follows installation. The chosen model persists into flight.
2. Select Reserve First, Balanced Transfer or Rapid Response. These authored profiles change macro-burn fuel, housekeeping power and debris density.
3. Fly the departure and transfer corridors. During transfer, isolate the storm-damaged science bus and switch backup power in a safe order. Alternatively, preserve power with 20% slower scanning.
4. Download three survey packets. Tune and acquire two synthetic mineral-band guides. Compare three sites and commit a landing choice.
5. Land using relative-position and speed guidance. Proximity tones assist the approach.
6. Drive the rover to the selected mineral site, record geological context and recover the station archive. Site selection changes the first traverse coordinates and its power allocation.
7. Submit a scientific interpretation. Unsupported biological or global claims earn less interpretation credit and are corrected in the record.
8. Choose complete-archive recovery or preserve return reserves, then dock at Earth.
9. Read the engineering debrief or export mission JSON, including the plan and scientific decisions.

## Controls and accessibility

Tab/Shift+Tab and Enter operate interface controls. Keys 1–4 select hangar sockets. Native arrow keys adjust the wavelength slider. The existing flight manual documents flight keys. All operations provide textual feedback; sound is optional. Mobile layouts stack operation cards and preserve access to actions through scrolling.

## Science and data

The mineral investigation is informed by NASA's report on Curiosity's clay/sulfate transition observations:
https://www.nasa.gov/missions/mars-science-laboratory/curiosity-rover/cracks-in-ancient-martian-mud-surprise-nasas-curiosity-rover-team/

The article informs the connection between minerals and changing water-related environments. **No measured spectra or abundances are imported.** The displayed curves, indices, uncertainty ranges, candidate sites and schedules are synthetic educational values. Guide wavelengths simplify mineral identification. Actual analysis needs calibration, reference spectra and multiple diagnostic bands. Challenge resource-pack integration remains a future data step.

Planning reserves exclude manual maneuvers, optional operations and recovery. Mean solar distances assume illumination and Sun tracking. Flight acceleration, energy reserves and auxiliary descent are scaled or fictional for play.

## Code

- `src/campaign.js`: route profiles, site choices, operation resolution and decision records.
- `src/mission-ui.js`: planning, circuit procedure, spectral tuning, interpretation and debrief.
- `src/simulation.js`: consequences, operation gates, persistence and campaign flow.
- `src/assembly.js` / `src/vehicle.js`: hangar and shared modular geometry.

## Verification

Run `npm test` for 22 simulation checks. With production preview at port 4174, run `node tests/browser-campaign.mjs` and `node tests/browser-assembly.mjs`.

The campaign browser check uses actual interface/keyboard actions, optional guidance and an accelerated test clock. It completes all six chapters, circuit restoration, both spectral acquisitions, site selection, interpretation, archive recovery and final docking. Production time remains unchanged. Keyboard, removal/reinstallation, power-deficit gating, mobile layout and campaign checkpoint restoration are checked separately.

The recorded browser run finished with 236 science, 83% hull, two collisions and zero page errors. This does not replace feedback from first-time human players or exhaustive hardware compatibility testing.
