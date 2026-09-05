# Image slots

Every filename below is already referenced by the site. Drop a file in this
folder with the matching name and it appears on its own, with the caption and
alt text that are already written. No HTML edit needed.

Nothing breaks while a file is missing: each carousel image carries an `onerror`
that removes its slide, and a carousel left with no slides hides itself. That is
why the CubeSat, UAV and Formula Student pages currently show no image block at
all.

## Naming

`<project>-<subject>.<ext>`, all lowercase, hyphens not spaces. The prefixes in
use are `gdp-` (MotoGP), `piv-`, `f1-`, `fs-` (Formula Student), `uav-`,
`cubesat-`.

## Format and size

Export `.webp` where you can, `.jpg` otherwise. If you export a different
extension from the one listed, the reference in the HTML has to change too, so
matching the extension below is the no-work path.

Target **1600px on the long edge**. The carousel is 1009px wide on a desktop
layout and images are scaled to fill it, so anything smaller is upscaled and
looks soft. The two MotoGP renders are the current example of this: at 584px and
708px wide they upscale about 1.4x to 1.65x and are visibly soft. Re-exporting
those two larger is the single biggest visual win available.

## Wanted

### MotoGP Cornering Aerodynamics
| File | Status | What it is |
| --- | --- | --- |
| `gdp-model.webp` | present, low-res | The 50%-scale model, straight and upright |
| `gdp-model-2.webp` | present, low-res | The same model at lean, on the rig |

### Retroreflective PIV
| File | Status | What it is |
| --- | --- | --- |
| `piv-velocity-field.webp` | present | Resolved velocity field, wake and vorticity near the Gurney flap |
| `piv-setup.jpg` | missing | Water tunnel setup: camera, aerofoil section, retroreflective background |
| `piv-comparison.jpg` | missing | Retroreflective result beside the conventional laser-sheet case |

### F1 Lap-Time Simulator
| File | Status | What it is |
| --- | --- | --- |
| `correlation-plot.webp` | present | Simulated speed trace against real telemetry, Monza 2024 pole lap |
| `f1-residual.jpg` | missing | Where the residual sits around the lap |
| `f1-setup-optimiser.jpg` | missing | Optimiser output: chosen setup at Monza against the Hungaroring |

### Formula Student
| File | Status | What it is |
| --- | --- | --- |
| `formula-student.jpg` | missing | Front wing on the car. Also the card thumbnail on the home page |
| `fs-cfd.jpg` | missing | CFD pressure field on the front wing |
| `fs-car.jpg` | missing | The car assembled |

### Fixed-Wing UAV
| File | Status | What it is |
| --- | --- | --- |
| `uav.jpg` | missing | The completed UAV. Also the card thumbnail on the home page |
| `uav-cad.jpg` | missing | Wing structure in CAD |
| `uav-flight.jpg` | missing | Flight testing |

### CubeSat Mission Design
| File | Status | What it is |
| --- | --- | --- |
| `cubesat.jpg` | missing | The CubeSat design. Also the card thumbnail on the home page |
| `cubesat-architecture.jpg` | missing | System architecture diagram |
| `cubesat-orbit.jpg` | missing | Orbit and mission operations diagram |

### Portrait
| File | Status | What it is |
| --- | --- | --- |
| `mathias.jpg` | present | Hero portrait on the home page |

## The three card thumbnails

`formula-student.jpg`, `uav.jpg` and `cubesat.jpg` do double duty: they are the
first carousel slide on their project page and the thumbnail on the home page,
where they are cropped to 4:3 and centred. Pick landscape shots with the subject
near the middle so the crop does not cut anything important.

## Adding a slot that is not listed

Add another `<figure class="carousel-slide">` next to the others in that
project's carousel, copying the shape of the ones already there, including the
`onerror`. Order in the file is the order they appear.
