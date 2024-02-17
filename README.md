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

// Setup Wintersky Scene
const wintersky_scene = new Wintersky.Scene();
// Setup Emitter
const emitter = new Wintersky.Emitter(wintersky_scene, RainbowParticle);
// Add emitter into Three.JS scene
threejs_scene.add(wintersky_scene.space);
// Play Effect
emitter.playLoop();

// Update particle rotation in your app's rendering loop
wintersky_scene.updateFacingRotation(camera);
```

Three.js up to version r134 is currently supported. Newer versions of three.js have an issue with updating textures on the fly if their size has changed. A workaround would be required to solve this.

# Development

* `npm i`: Install dependencies
* `npm run watch`: Activate compiler
* `npm run build`: Build for production

# API

## Scene

### `new Wintersky.Scene(options?)`

Creates a new scene, which can hold multiple emitters

* `options: Object`:
	* `fetchTexture: Function`

### Properties

* `emitters: Array` List of all emitters
* `space: three.js Object3D` Global particle space. Add this to your three.js scene.
* `global_options: Object`
	* `max_emitter_particles: Number` Maximum amount of particles per emitter
	* `tick_rate: Number` Emitter tick rate per second. 
	* `loop_mode: String` Default emitter loop mode
	* `parent_mode: String` Default emitter parent mode
	* `scale: Number` Emitter scale. The default is 1 for block space. Set to 16 to run in a pixel space environment like Blockbench.

### `WinterskyScene#updateFacingRotation(camera)`

Updates the particle facing rotation for all emitters
* `camera: Camera` three.js camera to orient the particle towards

### `WinterskyScene#fetchTexture( config )`

Method to provide visuals for a texture. Null by default. Gets called by configs if the texture is updated. Should return a data URL, or a promise resulting in a data URL.
* `config: Config` Particle config that is requesting the texture


&nbsp;
## Emitter

### `new Wintersky.Emitter(scene, config?, options?)`

Creates a new particle emitter

* `scene: Wintersky Scene`: Wintersky scene to add this emitter to
* `config: Config`: Config instance
* `scene: Scene`: Wintersky Scene
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

Configs store the configuration of an emitter. All emitters have a config by default.

### `new Wintersky.Config(scene, config, options)`

Creates a new emitter config instance

* `scene: Wintersky Scene`: Wintersky scene
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
