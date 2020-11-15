import * as THREE from 'three';

const Wintersky = {
	emitters: [],
	space: new THREE.Object3D(),
	updateFacingRotation(camera) {
		Wintersky.emitters.forEach(emitter => {
			emitter.updateFacingRotation(camera);
		});
	},
	fetchTexture: null,
	global_options: {
		max_emitter_particles: 30000,
		tick_rate: 30,
		loop_mode: 'auto', // looping, once
		parent_mode: 'world', // entity, locator
		get scale() {
			return Wintersky.global_options._scale;
		},
		set scale(val) {
			Wintersky.global_options._scale = val;
			Wintersky.emitters.forEach(emitter => {
				emitter.local_space.scale.set(val, val, val);
				emitter.global_space.scale.set(val, val, val);
			})
			//Wintersky.space.scale.set(val, val, val);
		},
		_scale: 1
	}
};

export default Wintersky
