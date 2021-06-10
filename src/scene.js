import Wintersky from './wintersky';
import * as THREE from 'three';

class Scene {
    /**
	 *  Available options:
	 * 	- fetchTexture: (config) => Promise<string> | <string>
	 */
	constructor(options={}) {
		this.emitters = []
		this.space = new THREE.Object3D()
		this._fetchTexture = options.fetchTexture

		this.global_options = {
			max_emitter_particles: options.max_emitter_particles || 30000,
			tick_rate: options.tick_rate || 30,
			loop_mode: options.loop_mode || 'auto',
			parent_mode: options.parent_mode || 'world',
			ground_collision: options.ground_collision != false,
			_scale: 1,
		}
		Object.defineProperty(this.global_options, 'scale', {
			get: () => {
				return this.global_options._scale;
			},
			set: (val) => {
				this.global_options._scale = val;
				this.emitters.forEach(emitter => {
					emitter.local_space.scale.set(val, val, val);
					emitter.global_space.scale.set(val, val, val);
				})
				//Wintersky.space.scale.set(val, val, val);
			},
		})
	}

	fetchTexture(config) {
		if(typeof this._fetchTexture === "function") return this._fetchTexture(config)
	}
	
	updateFacingRotation(camera) {
		this.emitters.forEach(emitter => {
			emitter.updateFacingRotation(camera);
		});
	}
}

Wintersky.Scene = Scene;

export default Scene;