(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
window.Wintersky = require('..');

},{"..":3}],2:[function(require,module,exports){
function parseColor(input) {
	if (typeof input == 'string') {
		return input;
	}
}

class Config {
	constructor(config) {
		this.reset()

		if (config && config.particle_effect) {
			this.setFromJSON(config);
		} else if (typeof config == 'object') {
			Object.assign(this, config);
		}
	}
	reset() {
		this.identifier = '';
		this.curves = [];
		this.space_local_position = false;
		this.space_local_rotation = false;
		this.variables_creation_vars = [];
		this.variables_tick_vars = [];

		this.emitter_rate_mode = '';
		this.emitter_rate_rate = '';
		this.emitter_rate_amount = '';
		this.emitter_rate_maximum = '';
		this.emitter_lifetime_mode = '';
		this.emitter_lifetime_active_time = '';
		this.emitter_lifetime_sleep_time = '';
		this.emitter_lifetime_activation = '';
		this.emitter_lifetime_expiration = '';
		this.emitter_shape_mode = '';
		this.emitter_shape_offset = '';
		this.emitter_shape_radius = '';
		this.emitter_shape_half_dimensions = '';
		this.emitter_shape_plane_normal = '';
		this.emitter_shape_surface_only = false;
		this.particle_appearance_size = '';
		this.particle_appearance_facing_camera_mode = '';
		this.particle_appearance_material = '';
		this.particle_direction_mode = '';
		this.particle_direction_direction = '';
		this.particle_motion_mode = '';
		this.particle_motion_linear_speed = '';
		this.particle_motion_linear_acceleration = '';
		this.particle_motion_linear_drag_coefficient = '';
		this.particle_motion_relative_position = '';
		this.particle_motion_direction = '';
		this.particle_rotation_mode = '';
		this.particle_rotation_initial_rotation = '';
		this.particle_rotation_rotation_rate = '';
		this.particle_rotation_rotation_acceleration = '';
		this.particle_rotation_rotation_drag_coefficient = '';
		this.particle_rotation_rotation = '';
		this.particle_lifetime_mode = '';
		this.particle_lifetime_max_lifetime = '';
		this.particle_lifetime_kill_plane = 0;
		this.particle_lifetime_expiration_expression = '';
		this.particle_lifetime_expire_in = [];
		this.particle_lifetime_expire_outside = [];
		this.particle_texture_width = 0;
		this.particle_texture_height = 0;
		this.particle_texture_path = '';
		this.particle_texture_image = '';
		this.particle_texture_mode = '';
		this.particle_texture_uv = '';
		this.particle_texture_uv_size = '';
		this.particle_texture_uv_step = '';
		this.particle_texture_frames_per_second = 0;
		this.particle_texture_max_frame = '';
		this.particle_texture_stretch_to_lifetime = false;
		this.particle_texture_loop = false;
		this.particle_color_mode = '';
		this.particle_color_static = '#fffff';
		this.particle_color_interpolant = '';
		this.particle_color_range = 0;
		this.particle_color_gradient = [];
		this.particle_color_expression = '';
		this.particle_color_light = false;
		this.particle_collision_enabled = false;
		this.particle_collision_collision_drag = 0;
		this.particle_collision_coefficient_of_restitution = 0;
		this.particle_collision_collision_radius = 0;
		this.particle_collision_expire_on_contact = false;

		return this;
	}
	setFromJSON(data) {

		var comps = data.particle_effect.components;
		var curves = data.particle_effect.curves;
		var desc = data.particle_effect.description;
		if (desc && desc.identifier) {
			this.identifier = desc.identifier;
		}
		if (desc && desc.basic_render_parameters) {
			this.particle_texture_path = desc.basic_render_parameters.texture;

			this.particle_appearance_material = desc.basic_render_parameters.material;
		}
		if (curves) {
			for (var key in curves) {
				var json_curve = curves[key];
				var new_curve = {
					id: key,
					mode: json_curve.type,
					input: json_curve.input,
					range: json_curve.horizontal_range,
					nodes: []
				};
				if (json_curve.nodes && json_curve.nodes.length) {
					json_curve.nodes.forEach(value => {
						value = parseFloat(value)||0;
						new_curve.nodes.push(value);
					})
				}
				this.curves.push(new_curve);
			}
		}

		if (comps) {
			function comp(id) {
				return comps[`minecraft:${id}`]
			}
			if (comp('emitter_initialization')) {
				var cr_v = comp('emitter_initialization').creation_expression;
				var up_v = comp('emitter_initialization').per_update_expression;
				if (typeof cr_v == 'string') {
					this.variables_creation_vars = cr_v.replace(/;+$/, '').split(';');
				}
				if (typeof up_v == 'string') {
					this.variables_tick_vars = up_v.replace(/;+$/, '').split(';');
				}
			}
			if (comp('emitter_local_space')) {
				this.space_inputs_local_position = comp('emitter_local_space').position;
				this.space_inputs_local_rotation = comp('emitter_local_space').rotation;
			}
			if (comp('emitter_rate_steady')) {
				this.emitter_rate_mode = 'steady';
				this.emitter_rate_rate = comp('emitter_rate_steady').spawn_rate;
				this.emitter_rate_maximum = comp('emitter_rate_steady').max_particles;
			}
			if (comp('emitter_rate_instant')) {
				this.emitter_rate_mode = 'instant';
				this.emitter_rate_amount = comp('emitter_rate_instant').num_particles;
			}
			if (comp('emitter_lifetime_once')) {
				this.emitter_lifetime_mode = 'once';
				this.emitter_lifetime_active_time = comp('emitter_lifetime_once').active_time;
			}
			if (comp('emitter_lifetime_looping')) {
				this.emitter_lifetime_mode = 'looping';
				this.emitter_lifetime_active_time = comp('emitter_lifetime_looping').active_time;
				this.emitter_lifetime_sleep_time = comp('emitter_lifetime_looping').sleep_time;
			}
			if (comp('emitter_lifetime_expression')) {
				this.emitter_lifetime_mode = 'expression';
				this.emitter_lifetime_activation = comp('emitter_lifetime_expression').activation_expression;
				this.emitter_lifetime_expiration = comp('emitter_lifetime_expression').expiration_expression;
			}
			var shape_component = comp('emitter_shape_point') || comp('emitter_shape_custom');
			if (shape_component) {
				this.emitter_shape_mode = 'point';
				this.emitter_shape_offset = shape_component.offset;
			}
			if (comp('emitter_shape_sphere')) {
				shape_component = comp('emitter_shape_sphere');
				this.emitter_shape_mode = 'sphere';
				this.emitter_shape_offset = shape_component.offset;
				this.emitter_shape_radius = shape_component.radius;
				this.emitter_shape_surface_only = shape_component.surface_only;
			}
			if (comp('emitter_shape_box')) {
				shape_component = comp('emitter_shape_box');
				this.emitter_shape_mode = 'box';
				this.emitter_shape_offset = shape_component.offset;
				this.emitter_shape_half_dimensions = shape_component.half_dimensions;
				this.emitter_shape_surface_only = shape_component.surface_only;
			}
			if (comp('emitter_shape_disc')) {
				shape_component = comp('emitter_shape_disc');
				this.emitter_shape_mode = 'disc';
				this.emitter_shape_offset = shape_component.offset;
				switch (shape_component.plane_normal) {
					case 'x': this.emitter_shape_plane_normal = [1, 0, 0]; break;
					case 'y': this.emitter_shape_plane_normal = [0, 1, 0]; break;
					case 'z': this.emitter_shape_plane_normal = [0, 0, 1]; break;
					default:  this.emitter_shape_plane_normal = shape_component.plane_normal; break;
				}
				this.emitter_shape_radius = shape_component.radius;
				this.emitter_shape_surface_only = shape_component.surface_only;
			}
			if (comp('emitter_shape_entity_aabb')) {
				this.emitter_shape_mode = 'entity_aabb';
				this.emitter_shape_surface_only = comp('emitter_shape_entity_aabb').surface_only;
				shape_component = comp('emitter_shape_entity_aabb');
			}
			if (shape_component && shape_component.direction) {
				if (shape_component.direction == 'inwards' || shape_component.direction == 'outwards') {
					this.particle_direction_mode = shape_component.direction;
				} else {
					this.particle_direction_mode = 'direction';
					this.particle_direction_direction = shape_component.direction;
				}
			}

			if (comp('particle_initial_spin')) {
				this.particle_rotation_initial_rotation = comp('particle_initial_spin').rotation;
				this.particle_rotation_rotation_rate = comp('particle_initial_spin').rotation_rate;
			}
			if (comp('particle_kill_plane')) {
				this.particle_lifetime_kill_plane = comp('particle_kill_plane');
			}

			if (comp('particle_motion_dynamic')) {
				this.particle_motion_mode = 'dynamic';
				this.particle_motion_linear_acceleration = comp('particle_motion_dynamic').linear_acceleration;
				this.particle_motion_linear_drag_coefficient = comp('particle_motion_dynamic').linear_drag_coefficient;
				this.particle_rotation_rotation_acceleration = comp('particle_motion_dynamic').rotation_acceleration;
				this.particle_rotation_rotation_drag_coefficient = comp('particle_motion_dynamic').rotation_drag_coefficient;
				this.particle_motion_linear_speed = 1;
			}
			if (comp('particle_motion_parametric')) {
				this.particle_motion_mode = 'parametric';
				this.particle_motion_relative_position = comp('particle_motion_parametric').relative_position;
				this.particle_motion_direction = comp('particle_motion_parametric').direction;
				this.particle_rotation_rotation = comp('particle_motion_parametric').rotation;
			}
			if (comp('particle_motion_collision')) {
				this.particle_collision_enabled = comp('particle_motion_collision').enabled || true;
				this.particle_collision_collision_drag = comp('particle_motion_collision').collision_drag;
				this.particle_collision_coefficient_of_restitution = comp('particle_motion_collision').coefficient_of_restitution;
				this.particle_collision_collision_radius = comp('particle_motion_collision').collision_radius;
				this.particle_collision_expire_on_contact = comp('particle_motion_collision').expire_on_contact;
			}
			if (comp('particle_initial_speed') !== undefined) {
				var c = comp('particle_initial_speed')
				if (typeof c !== 'object') {
					this.particle_motion_linear_speed = c;
				} else {
					this.particle_direction_mode = 'direction';
					this.particle_direction_direction = comp('particle_initial_speed');
					this.particle_motion_linear_speed = 1;
				}
			}

			if (comp('particle_lifetime_expression')) {
				this.particle_lifetime_mode = 'expression';
				if (comp('particle_lifetime_expression').expiration_expression) {
					this.particle_lifetime_mode = 'expression';
					this.particle_lifetime_expiration_expression = comp('particle_lifetime_expression').expiration_expression;
				} else {
					this.particle_lifetime_mode = 'time';
					this.particle_lifetime_max_lifetime = comp('particle_lifetime_expression').max_lifetime;
				}
			}
			if (comp('particle_expire_if_in_blocks') instanceof Array) {
				this.particle_lifetime_expire_in = comp('particle_expire_if_in_blocks');
			}
			if (comp('particle_expire_if_not_in_blocks') instanceof Array) {
				this.particle_lifetime_expire_outside = comp('particle_expire_if_not_in_blocks');
			}
			
			if (comp('particle_appearance_billboard')) {
				this.particle_appearance_size = comp('particle_appearance_billboard').size;
				this.particle_appearance_facing_camera_mode = comp('particle_appearance_billboard').facing_camera_mode;
				var uv_tag = comp('particle_appearance_billboard').uv;
				if (uv_tag) {
					if (uv_tag.texture_width) this.particle_texture_width = uv_tag.texture_width;
					if (uv_tag.texture_height) this.particle_texture_height = uv_tag.texture_height;
					if (uv_tag.flipbook) {
						this.particle_texture_mode = 'animated';
						this.particle_texture_uv = uv_tag.flipbook.base_UV;
						this.particle_texture_uv_size = uv_tag.flipbook.size_UV;
						this.particle_texture_uv_step = uv_tag.flipbook.step_UV;
						this.particle_texture_frames_per_second = uv_tag.flipbook.frames_per_second;
						this.particle_texture_max_frame = uv_tag.flipbook.max_frame;
						this.particle_texture_stretch_to_lifetime = uv_tag.flipbook.stretch_to_lifetime;
						this.particle_texture_loop = uv_tag.flipbook.loop;
					} else {
						this.particle_texture_mode = 'static';
						this.particle_texture_uv = uv_tag.uv;
						this.particle_texture_uv_size = uv_tag.uv_size;
					}
				}
			}
			if (comp('particle_appearance_lighting')) {
				this.particle_color_light = true;
			}
			if (comp('particle_appearance_tinting')) {
				var c = comp('particle_appearance_tinting').color

				if (c instanceof Array && c.length >= 3) {

					if ((typeof c[0] + typeof c[1] + typeof c[1]).includes('string')) {
						this.particle_color_mode = 'expression';
						this.particle_color_expression.splice(0, Infinity, c);

					} else {
						this.particle_color_mode = 'static';
						
						var color = '#' + [
							Math.clamp(c[0]*255, 0, 255).toString(16),
							Math.clamp(c[1]*255, 0, 255).toString(16),
							Math.clamp(c[2]*255, 0, 255).toString(16)
						].join('');
						this.particle_color_static = color;
					}
				} else if (typeof c == 'object') {
					// Gradient
					this.particle_color_mode = 'gradient';
					this.particle_color_interpolant = c.interpolant;
					this.particle_color_gradient.splice(0, Infinity)
					if (c.gradient instanceof Array) {
						let distance = 100 / (c.gradient.length-1);
						c.gradient.forEach((color, i) => {
							color = parseColor(color);
							var percent = distance * i;
							this.particle_color_gradient.push({percent, color})
						})
					} else if (typeof c.gradient == 'object') {
						let max_time = 0;
						for (var time in c.gradient) {
							max_time = Math.max(parseFloat(time), max_time)
						}
						this.particle_color_range = max_time;
						for (var time in c.gradient) {
							var color = parseColor(c.gradient[time]);
							var percent = (parseFloat(time) / max_time) * 100;
							this.particle_color_gradient.push({color, percent})
						}
					}
				}
			}
		}
	}
}
module.exports = Config;

},{}],3:[function(require,module,exports){
const Config = require("./config")

(function() {

const MathUtil = {
	roundTo(num, digits) {
		var d = Math.pow(10,digits)
		return Math.round(num * d) / d
	},
	randomab(a, b) {
		return a + Math.random() * (b-a)
	},
	radToDeg(rad) {
		return rad / Math.PI * 180
	},
	degToRad(deg) {
		return Math.PI / (180 /deg)
	},
	clamp(number, min, max) {
		if (number > max) number = max;
		if (number < min || isNaN(number)) number = min;
		return number;
	}
}
const Normals = {
	x: new THREE.Vector3(1, 0, 0),
	y: new THREE.Vector3(0, 1, 0),
	z: new THREE.Vector3(0, 0, 1),
	n: new THREE.Vector3(0, 0, 0),
}

/*
const Wintersky = {
	renderLoop: setInverval(function() {
		if (Emitter && document.hasFocus() && !Wintersky.paused) {
			Emitter.tick()
		}
	}, 1000/30),
	paused: false,
	emitters: [],
	renderUpdate() {
		this.emitters.forEach(emitter => {
			emitter.tickParticleRotation();
		})
	}
};
*/


class Wintersky {
	constructor(config) {
		this.object = new THREE.Object3D();
		this.material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			alphaTest: 0.2
		});
		Wintersky.emitters.push(this);

		this.config = config instanceof Config ? config : new Config(config);


		this.particles = [];
		this.dead_particles = [];
		this.age = 0;
		this.enabled = false;
		this.mode = 'looping';
		this.random_vars = [Math.random(), Math.random(), Math.random(), Math.random()]
		this.tick_variables = {};
		this.tick_values = {};
		this.creation_variables = {};
		this.creation_values = {};
	}
	params() {
		var obj = {
			"variable.entity_scale": 1
		};
		obj["variable.emitter_lifetime"] = this.lifetime;
		obj["variable.emitter_age"] = this.age;
		obj["variable.emitter_random_1"] = this.random_vars[0];
		obj["variable.emitter_random_2"] = this.random_vars[1];
		obj["variable.emitter_random_3"] = this.random_vars[2];
		obj["variable.emitter_random_4"] = this.random_vars[3];
		return obj;
	}
	updateMaterial() {
		var url;
		var path = Data.particle.texture.inputs.path.value;
		if (Data.particle.texture.inputs.image.image) {
			url = Data.particle.texture.inputs.image.image.data;
		} else {
			if (path == 'textures/particle/particles') {
				url = 'assets/default_particles.png';
	
			} else if (path == 'textures/flame_atlas' || path == 'textures/particle/flame_atlas') {
				url = 'assets/flame_atlas.png';
	
			} else if (path == 'textures/particle/campfire_smoke') {
				url = 'assets/campfire_smoke.png';
			} else {
				url = 'assets/missing.png';
			}
		}
		var tex = new THREE.TextureLoader().load(url, function(a, b) {
			function factorize(input, axis, factor) {
				if (!input.value || !input.value[axis]) return;
				var arr = input.value.slice()
				var val = arr[axis]
				if (isNaN(val)) {
					arr[axis] = `${factor} * (${val})`
				} else {
					arr[axis] = factor * parseFloat(val);
				}
				input.value = arr;
			}
	
			tex.magFilter = THREE.NearestFilter
			tex.minFilter = THREE.NearestFilter
			System.material.map = tex
			var x_factor = System.material.map.image.naturalWidth / this.Flipbook.width;
			var y_factor = System.material.map.image.naturalHeight / this.Flipbook.height;
			if (x_factor && x_factor != 1) {
				factorize(Data.particle.texture.inputs.uv, 0, x_factor)
				factorize(Data.particle.texture.inputs.uv_size, 0, x_factor)
				factorize(Data.particle.texture.inputs.uv_step, 0, x_factor)
			}
			if (y_factor && y_factor != 1) {
				factorize(Data.particle.texture.inputs.uv, 1, y_factor)
				factorize(Data.particle.texture.inputs.uv_size, 1, y_factor)
				factorize(Data.particle.texture.inputs.uv_step, 1, y_factor)
			}
			this.Flipbook.width = System.material.map.image.naturalWidth;
			this.Flipbook.height = System.material.map.image.naturalHeight;
			if (typeof cb === 'function') {
				cb()
			}
		})
	}
	start() {

		for (var i = this.particles.length-1; i >= 0; i--) {
			this.particles[i].remove()
		}
		this.age = 0;
		this.enabled = true;
		var params = this.params()
		this.active_time = Data.emitter.lifetime.active_time.calculate(params)
		this.sleep_time = Data.emitter.lifetime.sleep_time.calculate(params)
		this.random_vars = [Math.random(), Math.random(), Math.random(), Math.random()]
		this.creation_values = {};
		for (var key in this.creation_variables) {
			var s = this.creation_variables[key];
			this.creation_values[key] = Molang.parse(s)
		}
		if (getValue(1, 'rate', 'mode') === 'instant') {
			this.spawnParticles(Data.emitter.rate.amount.calculate(params))
		}
		return this;
	}
	tick() {
		var params = this.params()
		this.tick_values = {};
		for (var key in this.tick_variables) {
			var s = this.tick_variables[key];
			Emitter.tick_values[key] = Molang.parse(s, params)
		}
		if (this.enabled && getValue(1, 'rate', 'mode') === 'steady') {
			var p_this_tick = Data.emitter.rate.rate.calculate(params)/30
			var x = 1/p_this_tick;
			var c_f = Math.round(this.age*30)
			if (c_f % Math.round(x) == 0) {
				p_this_tick = Math.ceil(p_this_tick)
			} else {
				p_this_tick = Math.floor(p_this_tick)
			}
			this.spawnParticles(p_this_tick)
		}
		this.particles.forEach(p => {
			p.tick()
		})

		this.age += 1/30;
		var age = MathUtil.roundTo(this.age, 5);
		if (this.mode == 'looping') {
			//Looping
			if (this.enabled && age >= this.active_time) {
				this.stop()
			}
			if (!this.enabled && age >= this.sleep_time) {
				this.start()
			}
		} else if (this.mode == 'once') {
			//Once
			if (this.enabled && age >= this.active_time) {
				this.stop()
			}
		} else if (this.mode === 'expression') {
			//Expressions
			if (this.enabled && Data.emitter.lifetime.expiration.calculate(params)) {
				this.stop()
			}
			if (!this.enabled && Data.emitter.lifetime.activation.calculate(params)) {
				this.start()
			}
		}
		return this;
	}
	jumpTo(second) {
		let old_time = Math.round(second*30)
		let new_time = Math.round(this.age*30)
		if (old_time < new_time) {
			while (old_time < new_time) {
				this.tick();
				old_time++;
			}
		} else if (old_time > new_time) {

		}
	}
	tickParticleRotation() {
		this.particles.forEach(p => {

			switch (Data.particle.appearance.facing_camera_mode.value) {
				case 'lookat_xyz':
					p.mesh.lookAt(View.camera.position)
					break;
				case 'lookat_y':
					var v = new THREE.Vector3().copy(View.camera.position);
					v.y = p.position.y;
					p.mesh.lookAt(v);
					break;
				case 'rotate_xyz':
					p.mesh.rotation.copy(View.camera.rotation);
					break;
				case 'rotate_y':
					p.mesh.rotation.copy(View.camera.rotation);
					p.mesh.rotation.reorder('YXZ');
					p.mesh.rotation.x = p.mesh.rotation.z = 0;
					break;
				case 'direction':
					var q = new THREE.Quaternion().setFromUnitVectors(Normals.z, p.speed)
					p.mesh.rotation.setFromQuaternion(q);
					break;
			}
			p.mesh.rotation.z += p.rotation||0;
		})
	}
	stop() {
		this.enabled = false;
		this.age = 0;
		return this;
	}
	spawnParticles(count) {
		if (!count) return this;

		if (Data.emitter.rate.mode.value == 'steady') {
			var max = Data.emitter.rate.maximum.calculate(this.params())||0;
			max = MathUtil.clamp(max, 0, Wintersky.global_config.max_emitter_particles)
			count = MathUtil.clamp(count, 0, max-this.particles.length);
		} else {
			count = MathUtil.clamp(count, 0, Wintersky.global_config.max_emitter_particles-this.particles.length);
		}
		for (var i = 0; i < count; i++) {
			if (this.dead_particles.length) {
				var p = this.dead_particles.pop()
			} else {
				var p = new Particle()
			}
			p.add()
		}
		return count;
	}
}
Wintersky.emitters = [];
Wintersky.global_config = {
	max_emitter_particles: 10000
}

Wintersky.Particle = class {
	constructor(data) {
		if (!data) data = 0;

		this.geometry = new THREE.PlaneGeometry(1, 1)
		this.material = System.material.clone();
		this.mesh = new THREE.Mesh(this.geometry, this.material)
		this.position = this.mesh.position;

		this.speed = data.speed||new THREE.Vector3();
		this.acceleration = data.acceleration||new THREE.Vector3();

		this.add()
	}
	params() {
		var obj = Emitter.params();
		obj["variable.particle_lifetime"] = this.lifetime;
		obj["variable.particle_age"] = this.age;
		obj["variable.particle_random_1"] = this.random_vars[0];
		obj["variable.particle_random_2"] = this.random_vars[1];
		obj["variable.particle_random_3"] = this.random_vars[2];
		obj["variable.particle_random_4"] = this.random_vars[3];
		return obj;
	}
	add() {
		if (!Emitter.particles.includes(this)) {
			Emitter.particles.push(this);
			System.group.add(this.mesh)
		}

		this.age = this.loop_time = 0;
		this.current_frame = 0;
		this.random_vars = [Math.random(), Math.random(), Math.random(), Math.random()]
		this.material.copy(System.material)
		this.material.needsUpdate = true;
		var params = this.params()

		this.position.set(0, 0, 0)
		this.lifetime = Data.particle.lifetime.max_lifetime.calculate(params);
		this.initial_rotation = Data.particle.rotation.initial_rotation.calculate(params);
		this.rotation_rate = Data.particle.rotation.rotation_rate.calculate(params);
		this.rotation = 0;

		//Init Position:
		var surface = Data.emitter.shape.surface_only.value;
		if (Emitter.shape === 'box') {
			var size = Data.emitter.shape.half_dimensions.calculate(params);

			this.position.x = MathUtil.randomab(-size.x, size.x);
			this.position.y = MathUtil.randomab(-size.y, size.y);
			this.position.z = MathUtil.randomab(-size.z, size.z);

			if (surface) {
				var face = Math.floor(MathUtil.randomab(0, 3))
				var side = Math.floor(MathUtil.randomab(0, 2))
				this.position.setComponent(face, size.getComponent(face) * (side?1:-1))
			}
		} else if (Emitter.shape === 'entity_aabb') {
			var size = new THREE.Vector3(0.5, 1, 0.5);

			this.position.x = MathUtil.randomab(-size.x, size.x);
			this.position.y = MathUtil.randomab(-size.y, size.y);
			this.position.z = MathUtil.randomab(-size.z, size.z);

			if (surface) {
				var face = Math.floor(MathUtil.randomab(0, 3))
				var side = Math.floor(MathUtil.randomab(0, 2))
				this.position.setComponent(face, size.getComponent(face) * (side?1:-1))
			}
		} else if (Emitter.shape === 'sphere') {

			var radius = Data.emitter.shape.radius.calculate(params)
			if (surface) {
				this.position.x = radius
			} else {
				this.position.x = radius * Math.random()
			}
			this.position.applyEuler(THREE.getRandomEuler())
		} else if (Emitter.shape === 'disc') {
			var radius = Data.emitter.shape.radius.calculate(params)
			var ang = Math.random()*Math.PI*2
			var dis = surface ? radius : radius * Math.sqrt(Math.random())

			this.position.x = dis * Math.cos(ang)
			this.position.z = dis * Math.sin(ang)

			var normal = Data.emitter.shape.plane_normal.calculate(params)
			if (!normal.equals(Normals.n)) {
				var q = new THREE.Quaternion().setFromUnitVectors(Normals.y, normal)
				this.position.applyQuaternion(q)
			}
		}
		//Speed
			//this.speed = Data.particle.motion.direction_speed.calculate(params);
		this.speed = new THREE.Vector3()
		var dir = Data.particle.direction.mode.value;
		if (dir == 'inwards' || dir == 'outwards') {

			if (Emitter.shape === 'point') {
				this.speed.set(1, 0, 0).applyEuler(THREE.getRandomEuler())
			} else {
				this.speed.copy(this.position).normalize()
				if (dir == 'inwards') {
					this.speed.negate()
				}
			}
		} else {
			this.speed = Data.particle.direction.direction.calculate(params).normalize()
		}
		var speed = Data.particle.motion.linear_speed.calculate(params);
		this.speed.x *= speed;
		this.speed.y *= speed;
		this.speed.z *= speed;

		this.position.add(Data.emitter.shape.offset.calculate(params))

		//UV
		this.setFrame(0)

		return this.tick();
	}
	tick() {
		var params = this.params()

		//Lifetime
		this.age += 1/30;
		this.loop_time += 1/30;
		if (Data.particle.lifetime.mode.value === 'time') {
			if (this.age > this.lifetime) {
				this.remove();
			}
		} else {
			if (Data.particle.lifetime.expiration_expression.calculate(params)) {
				this.remove();
			}
		}
		//Movement
		if (Data.particle.motion.mode.value === 'dynamic') {
			//Position
			var drag = Data.particle.motion.linear_drag_coefficient.calculate(params);
			this.acceleration = Data.particle.motion.linear_acceleration.calculate(params);
			this.acceleration.addScaledVector(this.speed, -drag)
			this.speed.addScaledVector(this.acceleration, 1/30);
			this.position.addScaledVector(this.speed, 1/30);

			//Rotation
			var rot_drag = Data.particle.rotation.rotation_drag_coefficient.calculate(params)
			var rot_acceleration = Data.particle.rotation.rotation_acceleration.calculate(params)
				rot_acceleration += -rot_drag * this.rotation_rate;
			this.rotation_rate += rot_acceleration*1/30;
			this.rotation = MathUtil.degToRad(this.initial_rotation + this.rotation_rate*this.age);
		} else {
			if (Data.particle.motion.relative_position.value.join('').length) {
				this.position.copy(Data.particle.motion.relative_position.calculate(params));
			}
			this.rotation = MathUtil.degToRad(Data.particle.rotation.rotation.calculate(params));
		}

		//Size
		var size = Data.particle.appearance.size.calculate(params);
		this.mesh.scale.x = size.x*2.25 || 0.0001;
		this.mesh.scale.y = size.y*2.25 || 0.0001;

		//UV
		if (Data.particle.texture.mode.value === 'animated') {
			var max_frame = Data.particle.texture.max_frame.calculate(params);
			if (Data.particle.texture.stretch_to_lifetime.value && max_frame) {
				var fps = max_frame/this.lifetime;
			} else {
				var fps = Data.particle.texture.frames_per_second.calculate(params);
			}
			if (Math.floor(this.loop_time*fps) > this.current_frame) {
				this.current_frame = Math.floor(this.loop_time*fps);
				if (max_frame && this.current_frame > max_frame) {
					if (Data.particle.texture.loop.value) {
						this.current_frame = 0;
						this.loop_time = 0;
						this.setFrame(this.current_frame);
					}
				} else {
					this.setFrame(this.current_frame);
				}
			}
		}

		//Color (ToDo)
		if (Data.particle.color.mode.value === 'expression') {
			var c = Data.particle.color.expression.calculate(params)
			this.material.color.r = c.x;
			this.material.color.g = c.y;
			this.material.color.b = c.z;
		}

		return this;
	}
	remove() {
		Emitter.particles.remove(this)
		System.group.remove(this.mesh)
		Emitter.dead_particles.push(this)
		return this;
	}
	setFrame(n) {
		var params = this.params()
		var uv = Data.particle.texture.uv.calculate(params)
		var size = Data.particle.texture.uv_size.calculate(params)
		if (n) {
			var offset = Data.particle.texture.uv_step.calculate(params)
			uv.addScaledVector(offset, n)
		}
		this.setUV(uv.x, uv.y, size.x||Flipbook.width, size.y||Flipbook.height)
	}
	setUV(x, y, w, h) {
		var epsilon = 0.05
		var vertex_uvs = this.geometry.faceVertexUvs[0]

		w = (x+w - 2*epsilon) / Flipbook.width;
		h = (y+h - 2*epsilon) / Flipbook.height;
		x = (x + (w>0 ? epsilon : -epsilon)) / Flipbook.width;
		y = (y + (h>0 ? epsilon : -epsilon)) / Flipbook.height;

		vertex_uvs[0][0].set(x, 1-y)
		vertex_uvs[0][1].set(x, 1-h)
		vertex_uvs[0][2].set(w, 1-y)
		vertex_uvs[1][1].set(w, 1-h)

		vertex_uvs[1][0] = vertex_uvs[0][1];
		vertex_uvs[1][2] = vertex_uvs[0][2];
		this.geometry.uvsNeedUpdate = true
	}
}
Wintersky.Config = Config;

module.exports = Wintersky

})()

},{"./config":2}]},{},[1]);
