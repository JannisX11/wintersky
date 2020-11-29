# Wintersky [![npm version](https://img.shields.io/npm/v/wintersky)](https://www.npmjs.com/package/wintersky)

Particle effect renderer based on [three.js](https://threejs.org) and the [Minecraft Bedrock particle format](https://bedrock.dev/docs/stable/Particles).

* Demo: [Wintersky Rainbow Demo](https://jannisx11.github.io/wintersky/demo/)

# Installation

`npm i wintersky`

# Usage

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
emitter.playLoop();

// Update particle rotation in the rendering loop
Wintersky.updateFacingRotation(camera);
```

# Development

* `npm i`: Install dependencies
* `npm run watch`: Activate compiler
* `npm run build`: Build for production

# API

## Emitter

### `new Wintersky.Emitter(config?, options?)`

Creates a new particle emitter

* `config: Config`: Config instance
* `options: Object`:
	* `loop_mode: String` How the emitter loops: `auto`, `once` or `looping`. Default: `auto`
	* `loop_mode: String` How the emitter is located in the world: `world`, `entity` or `locator`. Default: `world`

### `Emitter#updateFacingRotation(camera)`

Updates the particle facing rotation
* `camera: Camera` three.js camera to orient the particle towards

### `Emitter#delete()`

Deletes the emitter

&nbsp;
## Default Playback Loop

### `Emitter#playLoop()`

Starts to play the particle effect using the default play loop

### `Emitter#toggleLoop()`

Pause/resume the default playback loop

### `Emitter#stopLoop()`

Stops the default playback loop



&nbsp;
## Control Emitter

### `Emitter#start()`

Starts the emitter, setting the time to 0 and initializing all variables

### `Emitter#tick()`

Runs an emitter tick

### `Emitter#stop(clear_particles)`

Stops the emitter

### `Emitter#jumpTo(second)`

Jumps to a specific time in the emitter. This is optimited to run as few operations as possible so you can use it to hook the emitter to a custom playback loop


&nbsp;
## Config

### `new Wintersky.Config(config, options)`

Creates a new emitter config instance

* `config: Config`: Config instance
* `options: Object`:
	* `path: String` Location of the particle file that the config is based on.

### Config#reset()

Resets the config to default values

### Config#set(key, value)

Sets a property of the config to a specific value

* `key: String` Key of the value to change
* `value: Any` Value to set

### Config#setFromJSON(data)

Loads the configuration from a JSON particle file

* `json: Object` Particle file content

### Config#onTextureUpdate()

Method that runs when the texture of the config is updated. Null by default


&nbsp;
## Wintersky

* `Wintersky.emitter: Array` List of all emitters
* `Wintersky.space: three.js Object3D` Global particle space. Add this to your scene.

### `Wintersky.updateFacingRotation(camera)`

Updates the particle facing rotation for all emitters
* `camera: Camera` three.js camera to orient the particle towards

### `Wintersky.fetchTexture( config )`

Method to provide visuals for a texture. Null by default. Gets called by configs if the texture is updated. Should return a data URL.
* `config: Config` Particle config that is requesting the texture


### Global Options

* `Wintersky.global_options`
	* `max_emitter_particles: Number` Maximum amount of particles per emitter
	* `tick_rate: Number` Emitter tick rate per second. 
	* `loop_mode: String` Default emitter loop mode
	* `parent_mode: String` Default emitter parent mode
	* `scale: Number` Emitter scale. The default is 1 for block space. Set to 16 to run in a pixel space environment like Blockbench.