# Verification — ODYSSEY v2

Verified locally with Node.js and headless Microsoft Edge (Playwright).

- Production build: successful, with local textures, fonts, and rendering dependencies bundled.
- Simulation tests: **12 passed**. Includes complete six-stage runs for Earth, Moon, Mars, Vesta, and Jupiter; resource trade-offs; scanning constraints; inertia/braking; collisions/shielding/repairs; pause; save restoration; and failure/retry behavior.
- Browser interface: passed keyboard destination navigation, invalid-design launch blocking, manual thrust, pause freeze, controls dialog, power routing, camera change, saved-checkpoint reload, surface vehicle movement, and a 390 px mobile layout without horizontal page overflow.
- Full browser campaign after final resource balancing: Mars completed all six chapters, both narrative events, scans, surface collection, and recovery docking. Result: **198 science points, 73% hull, 3 collisions**. Optional guidance was enabled; interactions used keyboard controls. The test animation clock was accelerated.
- Packaged production server: loaded all requested assets without request failures; manual keyboard thrust and mute inside a dialog passed. No uncaught browser errors were reported.
- Screenshots: `previews/odyssey-final.png`, `previews/03-flight.png`, `previews/05-rover.png`, `previews/06-mobile.png`, and `previews/journey-complete.png`.

Not claimed: complete manual-path coverage, every hardware/browser combination, mobile-device performance certification, or high-fidelity aerospace validation. Speech voices depend on the device. The science/data limitations are explained in README.md, SOURCES.md, and the in-game credits.
