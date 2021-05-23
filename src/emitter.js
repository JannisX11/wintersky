import Molang from 'molangjs';
import * as THREE from 'three';

import Wintersky from './wintersky';
import Config from './config';
import Particle from './particle';
import { MathUtil, Normals, removeFromArray } from './util';

import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'

const dummy_vec = new THREE.Vector3();
const materialTypes = ['particles_alpha', 'particles_blend', 'particles_opaque']

function calculateCurve(emitter, curve, params) {

	var position = emitter.Molang.parse(curve.input, params);
	var range = emitter.Molang.parse(curve.range, params);

	position = (position/range) || 0;
	if (position === Infinity) position = 0;

	if (curve.mode == 'linear') {

		var segments = curve.nodes.length-1;
		position *= segments
		var index = Math.floor(position);
		var blend = position%1;
		var difference = curve.nodes[index+1] - curve.nodes[index];
		var value = curve.nodes[index] + difference * blend;
		return value;

	} else if (curve.mode == 'catmull_rom') {
		var vectors = [];
		curve.nodes.forEach((val, i) => {
			vectors.push(new THREE.Vector2(i-1, val))
		})
		var spline = new THREE.SplineCurve(vectors);

		var segments = curve.nodes.length-3;
		position *= segments
		var pso = (position+1)/(segments+2)
		return spline.getPoint(pso).y;
	}
}


class Emitter {
	constructor(scene, config, options = 0) {
		this.scene = scene
		scene.emitters.push(this);

		this.config = config instanceof Config ? config : new Config(scene, config, options);

		this.Molang = new Molang();
		this.Molang.variableHandler = (key, params) => {
			return this.config.curves[key] && calculateCurve(this, this.config.curves[key], params);
		}

		let global_scale = scene.global_options._scale;
		this.local_space = new THREE.Object3D();
		this.local_space.scale.set(global_scale, global_scale, global_scale);
		this.global_space = new THREE.Object3D();
		this.global_space.scale.set(global_scale, global_scale, global_scale);
		this.material = new THREE.ShaderMaterial({
			uniforms: {
				map: {
					type: 't',
					value: this.config.texture
				},
				materialType: {
					type: 'int',
					value: 1
				}
			},
			vertexShader,
			fragmentShader,
			vertexColors: THREE.FaceColors,
			transparent: true,
			alphaTest: 0.2
		});

		this.particles = [];
		this.dead_particles = [];
		this.age = 0;
		this.view_age = 0;
		this.enabled = false;
		this.loop_mode = options.loop_mode || scene.global_options.loop_mode;
		this.parent_mode = options.parent_mode || scene.global_options.parent_mode;
		this.random_vars = [Math.random(), Math.random(), Math.random(), Math.random()]
		this.tick_values = {};
		this.creation_values = {};

		this.updateMaterial();
	}
	clone() {
		let clone = new Wintersky.Emitter(this.scene, this.config);
		clone.loop_mode = this.loop_mode;
		return clone;
	}
	params() {
		var obj = {
			"variable.entity_scale": 1
		};
		obj["variable.emitter_lifetime"] = this.active_time;
		obj["variable.emitter_age"] = this.age;
		obj["variable.emitter_random_1"] = this.random_vars[0];
		obj["variable.emitter_random_2"] = this.random_vars[1];
		obj["variable.emitter_random_3"] = this.random_vars[2];
		obj["variable.emitter_random_4"] = this.random_vars[3];
		return obj;
	}
	calculate(input, variables, datatype) {

		let getV = v => this.Molang.parse(v, variables)
		var data;
	
		if (input instanceof Array) {
			if (datatype == 'array') {
				data = [];
				input.forEach(source => {
					data.push(getV(source));
				})

			} else if (input.length === 4) {
				data = new THREE.Plane().setComponents(
					getV(input[0]),
					getV(input[1]),
					getV(input[2]),
					getV(input[3])
				)
			} else if (input.length === 3) {
				data = new THREE.Vector3(
					getV(input[0]),
					getV(input[1]),
					getV(input[2])
				)
			} else if (input.length === 2) {
				data = new THREE.Vector2(
					getV(input[0]),
					getV(input[1])
				)
			}
		} else if (datatype == 'color') {
			
		} else {
			data = getV(input)
		}
		return data;
	}
	updateConfig() {
		this.updateMaterial();
	}
	updateMaterial() {
		this.config.updateTexture();
	}
	updateFacingRotation(camera) {
		if (this.particles.length == 0) return;

		const quat = new THREE.Quaternion();
		const vec = new THREE.Vector3();

		let world_quat_inverse;
		if (this.config.particle_appearance_facing_camera_mode.substr(0, 6) == 'rotate') {
			world_quat_inverse = this.particles[0].mesh.parent.getWorldQuaternion(quat).inverse();
		}

		this.particles.forEach(p => {

			switch (this.config.particle_appearance_facing_camera_mode) {
				case 'lookat_xyz':
					p.mesh.lookAt(camera.position)
					break;
				case 'lookat_y':
					var v = vec.copy(camera.position);
					dummy_vec.set(0, 0, 0);
					p.mesh.localToWorld(dummy_vec);
					v.y = dummy_vec.y;
					p.mesh.lookAt(v);
					break;
				case 'rotate_xyz':
					p.mesh.rotation.copy(camera.rotation);
					p.mesh.quaternion.premultiply(world_quat_inverse);
					break;
				case 'rotate_y':
					p.mesh.rotation.copy(camera.rotation);
					p.mesh.rotation.reorder('YXZ');
					p.mesh.rotation.x = p.mesh.rotation.z = 0;
					p.mesh.quaternion.premultiply(world_quat_inverse);
					break;
				case 'direction_x':
					var q = quat.setFromUnitVectors(Normals.x, vec.copy(p.speed).normalize())
					p.mesh.rotation.setFromQuaternion(q);
					break;
				case 'direction_y':
					var q = quat.setFromUnitVectors(Normals.y, vec.copy(p.speed).normalize())
					p.mesh.rotation.setFromQuaternion(q);
					break;
				case 'direction_z':
					var q = quat.setFromUnitVectors(Normals.z, vec.copy(p.speed).normalize())
					p.mesh.rotation.setFromQuaternion(q);
					break;
			}
			p.mesh.rotation.z += p.rotation||0;
		})
	}

	// Controls
	start() {
		this.age = 0;
		this.view_age = 0;
		this.enabled = true;
		this.initialized = true;
		this.scene.space.add(this.global_space);
		var params = this.params()
		this.active_time = this.calculate(this.config.emitter_lifetime_active_time, params)
		this.sleep_time = this.calculate(this.config.emitter_lifetime_sleep_time, params)
		this.random_vars = [Math.random(), Math.random(), Math.random(), Math.random()]
		this.creation_values = {};

		for (var line of this.config.variables_creation_vars) {
			this.Molang.parse(line);
		}

		if (this.config.emitter_rate_mode === 'instant') {
			this.spawnParticles(this.calculate(this.config.emitter_rate_amount, params))
		}
		return this;
	}
	tick(jump) {
		let params = this.params()
		let { tick_rate } = this.scene.global_options;

		// Calculate tick values
		for (var line of this.config.variables_tick_vars) {
			this.Molang.parse(line);
		}
		// Spawn steady particles
		if (this.enabled && this.config.emitter_rate_mode === 'steady') {
			var p_this_tick = this.calculate(this.config.emitter_rate_rate, params)/tick_rate
			var x = 1/p_this_tick;
			var c_f = Math.round(this.age*tick_rate)
			if (c_f % Math.round(x) == 0) {
				p_this_tick = Math.ceil(p_this_tick)
			} else {
				p_this_tick = Math.floor(p_this_tick)
			}
			this.spawnParticles(p_this_tick)
		}
		// Material
		if (!jump) {
			this.material.uniforms.materialType.value = materialTypes.indexOf(this.config.particle_appearance_material)
		}
		// Tick particles
		this.particles.forEach(p => {
			p.tick(jump)
		})

		this.age += 1/tick_rate;
		this.view_age += 1/tick_rate;

		if (this.config.emitter_lifetime_mode === 'expression') {
			//Expressions
			if (this.enabled && this.calculate(this.config.emitter_lifetime_expiration, params)) {
				this.stop();
			}
			if (!this.enabled && this.calculate(this.config.emitter_lifetime_activation, params)) {
				this.start()
			}
		} else if (this.loop_mode == 'looping' || (this.loop_mode == 'auto' && this.config.emitter_lifetime_mode == 'looping')) {
			//Looping
			if (this.enabled && MathUtil.roundTo(this.age, 5) >= this.active_time) {
				this.stop()
			}
			if (!this.enabled && MathUtil.roundTo(this.age, 5) >= this.sleep_time) {
				this.start()
			}
		} else {
			//Once
			if (this.enabled && MathUtil.roundTo(this.age, 5) >= this.active_time) {
				this.stop()
			}
		}
		return this;
	}
	stop(clear_particles = false) {
		this.enabled = false;
		this.age = 0;
		if (clear_particles) {
			this.particles.slice().forEach(particle => {
				particle.remove();
			});
		}
		return this;
	}
	jumpTo(second) {
		let {tick_rate} = this.scene.global_options;
		let old_time = Math.round(this.view_age * tick_rate)
		let new_time = Math.round(second * tick_rate);
		if (this.loop_mode != 'once') {
			new_time = Math.clamp(new_time, 0, Math.round(this.active_time * tick_rate) - 1);
		}
		if (old_time == new_time) return;
		if (new_time < old_time) {
			this.stop(true).start();
		} else if (!this.initialized) {
			this.start();
		}
		while (Math.round(this.view_age * tick_rate) < new_time-1) {
			this.tick(true);
		}
		this.tick(false);
		return this;
	}

	// Playback Loop
	playLoop() {
		if (!this.initialized || this.age == 0) {
			this.start();
		}
		this.paused = false;
		clearInterval(this.tick_interval);
		this.tick_interval = setInterval(() => {
			this.tick()
		}, 1000 / this.scene.global_options.tick_rate)
		return this;
	}
	toggleLoop() {
		this.paused = !this.paused;
		if (this.paused) {
			clearInterval(this.tick_interval);
			delete this.tick_interval;
		} else {
			this.playLoop();
		}
		return this;
	}
	stopLoop() {
		clearInterval(this.tick_interval);
		delete this.tick_interval;
		this.stop(true);
		this.paused = true;
		return this;
	}
	
	spawnParticles(count) {
		if (!count) return this;

		if (this.config.emitter_rate_mode == 'steady') {
			var max = this.calculate(this.config.emitter_rate_maximum, this.params())||0;
			max = MathUtil.clamp(max, 0, this.scene.global_options.max_emitter_particles)
			count = MathUtil.clamp(count, 0, max-this.particles.length);
		} else {
			count = MathUtil.clamp(count, 0, this.scene.global_options.max_emitter_particles-this.particles.length);
		}
		for (var i = 0; i < count; i++) {
			if (this.dead_particles.length) {
				var p = this.dead_particles.pop()
			} else {
				var p = new Particle(this)
			}
			p.add()
		}
		return count;
	}
	delete() {
		[...this.particles, ...this.dead_particles].forEach(particle => {
			if (particle.mesh.parent) particle.mesh.parent.remove(particle.mesh);
		})
		this.particles.splice(0, Infinity);
		this.dead_particles.splice(0, Infinity);
		if (this.local_space.parent) this.local_space.parent.remove(this.local_space);
		if (this.global_space.parent) this.global_space.parent.remove(this.global_space);
		removeFromArray(this.scene.emitters, this);
	}
}
Wintersky.Emitter = Emitter;

export default Emitter;
