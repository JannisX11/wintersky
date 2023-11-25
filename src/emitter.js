import Molang from 'molangjs';
import * as THREE from 'three';

import Wintersky from './wintersky';
import Config from './config';
import Particle from './particle';
import { MathUtil, removeFromArray, Normals } from './util';

import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'
import EventClass from './event_class';

const dummy_vec = new THREE.Vector3();
const dummy_object = new THREE.Object3D();
const materialTypes = ['particles_alpha', 'particles_opaque', 'particles_blend', 'particles_add']


function createCurveSpline(curve) {
	switch (curve.mode) {
		case 'catmull_rom':
			var vectors = [];
			curve.nodes.forEach((val, i) => {
				vectors.push(new THREE.Vector2(i-1, val))
			})
			return new THREE.SplineCurve(vectors);
		case 'bezier':
			var vectors = [];
			curve.nodes.forEach((val, i) => {
				vectors.push(new THREE.Vector2(i/3, val))
			})
			return new THREE.CubicBezierCurve(...vectors);
	}
}
function calculateCurve(emitter, curve, curve_key, params) {

	var position = emitter.Molang.parse(curve.input, params);
	var range = emitter.Molang.parse(curve.range, params);
	if (curve.mode == 'bezier_chain') range = 1;

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
		let spline = emitter._cached_curves[curve_key];
		if (!spline) {
			spline = emitter._cached_curves[curve_key] = createCurveSpline(curve);
		}
		var segments = curve.nodes.length-3;
		position *= segments
		var pso = (position+1)/(segments+2)
		return spline.getPoint(pso).y;

	} else if (curve.mode == 'bezier') {

		let spline = emitter._cached_curves[curve_key];
		if (!spline) {
			spline = emitter._cached_curves[curve_key] = createCurveSpline(curve);
		}
		return spline.getPoint(position).y;

	} else if (curve.mode == 'bezier_chain') {
		
		let sorted_nodes = curve.nodes.slice().sort((a, b) => a.time - b.time);
		let i = 0;
		while (i < sorted_nodes.length) {
			if (sorted_nodes[i].time > position) break;
			i++;
		}
		let before = sorted_nodes[i-1];
		let after = sorted_nodes[i];

		if (!before) before = {time: 0, right_value: 0, right_slope: 0}
		if (!after)  after  = {time: 1, right_value: 0, right_slope: 0}

		let time_diff = after.time - before.time;
		var vectors = [
			new THREE.Vector2(before.time + time_diff * (0/3), before.right_value),
			new THREE.Vector2(before.time + time_diff * (1/3), before.right_value + before.right_slope * (1/3)),
			new THREE.Vector2(before.time + time_diff * (2/3), after.left_value - after.left_slope * (1/3)),
			new THREE.Vector2(before.time + time_diff * (3/3), after.left_value),
		];
		var spline = new THREE.CubicBezierCurve(...vectors);

		return spline.getPoint((position-before.time) / time_diff).y;
	}
}

class Emitter extends EventClass {
	constructor(scene, config, options = 0) {
		super();
		this.scene = scene
		scene.emitters.push(this);

		this.config = config instanceof Config ? config : new Config(scene, config, options);

		this.Molang = new Molang();
		this.Molang.variableHandler = (key, params) => {
			return this.config.curves[key] && calculateCurve(this, this.config.curves[key], key, params);
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
		this.ground_collision = typeof options.ground_collision == 'boolean' ? options.ground_collision : scene.global_options.ground_collision;
		this.random_vars = [Math.random(), Math.random(), Math.random(), Math.random()]
		this.tick_values = {};
		this.creation_values = {};
		this._cached_curves = {};

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
		if (this.config.particle_appearance_facing_camera_mode.substring(0, 6) == 'rotate' || true) {
			world_quat_inverse = this.particles[0].mesh.parent.getWorldQuaternion(quat).invert();
		}

		this.particles.forEach(p => {

			if (this.config.particle_appearance_facing_camera_mode.substring(0, 9) == 'direction') {
				if (p.mesh.rotation.order !== 'YXZ') {
					p.mesh.rotation.order = 'YXZ';
				}
				vec.copy(p.facing_direction);
				
				if (vec.y == 1) {
					vec.y = -1;
				} else if (vec.y == -1) {
					vec.y = 1;
					vec.z = -0.00001;
				}
			}
			if (this.config.particle_appearance_facing_camera_mode == 'lookat_direction') {
				if (p.mesh.rotation.order !== 'XYZ') {
					p.mesh.rotation.order = 'XYZ';
				}
				vec.copy(p.facing_direction);
			}

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
					var y = Math.atan2(vec.x, vec.z);
					var z = Math.atan2(vec.y, Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.z, 2)));
					p.mesh.rotation.set(0, y - Math.PI/2, z)
					break;
				case 'direction_y':
					var y = Math.atan2(vec.x, vec.z);
					var x = Math.atan2(vec.y, Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.z, 2)));
					p.mesh.rotation.set(x - Math.PI/2, y - Math.PI, 0)
					break;
				case 'direction_z':
					var y = Math.atan2(vec.x, vec.z);
					var x = Math.atan2(vec.y, Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.z, 2)));
					p.mesh.rotation.set(-x, y, 0)
					break;
				case 'lookat_direction':
					dummy_object.position.copy(p.mesh.position)
					dummy_object.quaternion.setFromUnitVectors(Normals.x, vec);
					vec.copy(camera.position);
					p.mesh.parent.add(dummy_object);
					dummy_object.updateMatrixWorld();
					dummy_object.worldToLocal(vec);
					p.mesh.parent.remove(dummy_object);
					p.mesh.rotation.set(Math.atan2(-vec.y, vec.z), 0, 0, 'XYZ');
					p.mesh.quaternion.premultiply(dummy_object.quaternion);
					break;
				case 'emitter_transform_xy':
					p.mesh.rotation.set(0, 0, 0);
					break;
				case 'emitter_transform_xz':
					p.mesh.rotation.set(-Math.PI/2, 0, 0);
					break;
				case 'emitter_transform_yz':
					p.mesh.rotation.set(0, Math.PI/2, 0);
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
		var params = this.params();
		this.Molang.resetVariables();
		this.active_time = this.calculate(this.config.emitter_lifetime_active_time, params)
		this.sleep_time = this.calculate(this.config.emitter_lifetime_sleep_time, params)
		this.random_vars = [Math.random(), Math.random(), Math.random(), Math.random()]
		this.creation_values = {};

		for (var line of this.config.variables_creation_vars) {
			this.Molang.parse(line);
		}

		this.dispatchEvent('start', {params})

		if (this.config.emitter_rate_mode === 'instant') {
			this.spawnParticles(this.calculate(this.config.emitter_rate_amount, params))
		}
		return this;
	}
	tick(jump) {
		let params = this.params()
		let { tick_rate } = this.scene.global_options;
		this._cached_curves = {};

		// Calculate tick values
		for (var line of this.config.variables_tick_vars) {
			this.Molang.parse(line);
		}
		if (this.config.particle_update_expression.length) {
			this.particles.forEach(p => {
				let particle_params = p.params();
				for (var entry of this.config.particle_update_expression) {
					this.Molang.parse(entry, particle_params);
				}
			})
		}
		this.dispatchEvent('tick', {params})

		// Material
		if (!jump) {
			let material = this.config.particle_appearance_material;
			this.material.uniforms.materialType.value = materialTypes.indexOf(material);
			this.material.side = (material === 'particles_blend' || material === 'particles_add') ? THREE.DoubleSide : THREE.FrontSide;
			this.material.blending = material === 'particles_add' ? THREE.AdditiveBlending : THREE.NormalBlending;
		}
		// Tick particles
		this.particles.forEach(p => {
			p.tick(jump)
		})

		this.age += 1/tick_rate;
		this.view_age += 1/tick_rate;

		// Spawn steady particles
		if (this.enabled && this.config.emitter_rate_mode === 'steady') {
			var p_this_tick = this.calculate(this.config.emitter_rate_rate, params)/tick_rate
			var x = 1/p_this_tick;
			var c_f = Math.round(this.age*tick_rate);
			if (c_f % Math.round(x) == 0) {
				p_this_tick = Math.ceil(p_this_tick)
			} else {
				p_this_tick = Math.floor(p_this_tick)
			}
			this.spawnParticles(p_this_tick)
		}
		this.dispatchEvent('ticked', {params, tick_rate})

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
		this.dispatchEvent('stop', {})
		return this;
	}
	jumpTo(second) {
		let {tick_rate} = this.scene.global_options;
		let old_time = Math.round(this.view_age * tick_rate)
		let new_time = Math.round(second * tick_rate);
		if (this.loop_mode == 'looping' || (this.loop_mode == 'auto' && this.config.emitter_lifetime_mode == 'looping')) {
			new_time = new_time % (Math.round(this.active_time * tick_rate) - 1);
		}
		if (old_time == new_time) return;
		if (new_time < old_time) {
			this.stop(true).start();
		} else if (!this.initialized) {
			this.start();
		}
		let last_view_age = this.view_age;
		while (Math.round(this.view_age * tick_rate) < new_time-1) {
			this.tick(true);
			if (this.view_age <= last_view_age) break;
			last_view_age = this.view_age;
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
