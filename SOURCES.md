# Sources, attribution, and authored content

## Planet textures bundled with the game

| Local asset | Source and credit |
|---|---|
| `public/textures/mars.jpg` | [NASA Mars Image Texture](https://science.nasa.gov/3d-resources/mars/). NASA / Jet Propulsion Laboratory / Caltech. Viking images processed at USGS. Direct asset: `https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/image/mars/Mars.jpg` |
| `public/textures/jupiter.jpg` | [NASA Jupiter texture](https://science.nasa.gov/3d-resources/jupiter/). Direct asset: `https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/image/jupiter/Jupiter.jpg` |
| `public/textures/earth.jpg` | [Three.js example planet textures](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets), `earth_atmos_2048.jpg`. Downloaded from the Three.js example asset host. The game does not claim this is live Earth imagery. |
| `public/textures/moon.jpg` | [Three.js example planet textures](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets), `moon_1024.jpg`. Downloaded from the Three.js example asset host. Also used as illustrative terrain for Vesta; it is not a Vesta map. |

NASA image-use information: [NASA Images and Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/). Third-party credits and usage conditions should be reviewed when preparing the team’s final public submission. No NASA logo is used in the game.

## Scientific context

- [NASA Mars](https://science.nasa.gov/mars/) — Mars and evidence of past water.
- [NASA Moon](https://science.nasa.gov/moon/) — lunar environment and polar exploration.
- [NASA Dawn](https://science.nasa.gov/mission/dawn/) — Vesta and planetary differentiation.
- [NASA Jupiter](https://science.nasa.gov/jupiter/) — gas giant environment; no solid landing surface.
- [NASA Earth](https://science.nasa.gov/earth/) — Earth observations and remote sensing.
- [NASA Space Apps Challenge](https://www.spaceappschallenge.org/2026/) — challenge context; no endorsement is implied.

Planet radius, approximate gravity, and representative orbital distance are educational context. The stated travel days are fictional scenario parameters, not calculated launch-window solutions. Mission cost, equipment mass, fuel, power, communications, science points, hazard frequency, and all vehicle performance parameters are game design values.

The displayed ideal single-stage velocity increment is `Δv = Isp × 9.80665 × ln(wet mass / dry mass)`. It neglects steering losses, gravity losses, staging, finite burn duration, launch windows, thermal constraints, and many other real mission factors.

## Original and generated content

Spacecraft, rover, station geometry, terrain, procedural material textures, HUD art, story, and sound synthesis code were created for this project. No frame from the supplied video is used as a fake interactive backdrop. The video served as a visual reference.

Browser speech synthesis uses a locally available system/browser voice. Captions remain available when voice output is unsupported.

## Software and fonts

- Three.js — MIT
- Vite — MIT
- Playwright — Apache-2.0 (development verification)
- Rajdhani, IBM Plex Mono, Inter — SIL Open Font License, distributed through Fontsource

The fonts, rendering libraries, and image files needed for gameplay are bundled into the production build. Gameplay makes no external data/API calls. External links in the credits panel open only when selected.
