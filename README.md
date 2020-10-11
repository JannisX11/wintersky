# Wintersky
Particle effect renderer based on THREE.js

* Demo: [Wintersky Rainbow Demo](https://jannisx11.github.io/wintersky/demo/)

## Installation

`npm i wintersky`

## Usage

This is the simplest possible implementation of a Wintersky emitter into your scene

```javascript
// Import wintersky
import Wintersky from 'wintersky';
// Load JSON File
import RainbowParticle from './rainbow.particle.json';

// Setup Emitter
const emitter = new Wintersky.Emitter(RainbowParticle);
// Add emitter into Three.JS scene
scene.add(Wintersky.space);
// Play Effect
emitter.play();

// Update particle rotation in the rendering loop
Wintersky.updateFacingRotation(camera);
```

## Development

* `npm i`: Install dependencies
* `npm run watch`: Activate compiler
* `npm run build`: Build for production
