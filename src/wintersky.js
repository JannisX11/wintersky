// @ts-check
import * as THREE from 'three';


export default class Wintersky {
	/**
	 *  Available options:
	 * 	- fetchTexture: (config) => Promise<string> | <string>
	 */
	constructor(options={}) {
		this.emitters = []
		this.space = new THREE.Object3D()
		this._fetchTexture = options.fetchTexture

		this.global_options = {
			max_emitter_particles: 30000,
			tick_rate: 30,
			loop_mode: 'auto',
			parent_mode: 'world',
			_scale: 1,

			get scale() {
				return this._scale;
			},
			set scale(val) {
				this._scale = val;
				this.emitters.forEach(emitter => {
					emitter.local_space.scale.set(val, val, val);
					emitter.global_space.scale.set(val, val, val);
				})
				//Wintersky.space.scale.set(val, val, val);
			}
		}
	}

	fetchTexture(config) {
		if(typeof this._fetchTexture === "function") return this._fetchTexture()
	}
	
	updateFacingRotation(camera) {
		this.emitters.forEach(emitter => {
			emitter.updateFacingRotation(camera);
		});
	}
}
