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
		this.curves = {};
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
		this.emitter_shape_offset = [0, 0, 0];
		this.emitter_shape_radius = '';
		this.emitter_shape_half_dimensions = [0, 0, 0];
		this.emitter_shape_plane_normal = [0, 0, 0];
		this.emitter_shape_surface_only = false;
		this.particle_appearance_size = [0, 0];
		this.particle_appearance_facing_camera_mode = '';
		this.particle_appearance_material = '';
		this.particle_direction_mode = '';
		this.particle_direction_direction = [0, 0, 0];
		this.particle_motion_mode = '';
		this.particle_motion_linear_speed = '';
		this.particle_motion_linear_acceleration = [0, 0, 0];
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
		this.particle_lifetime_kill_plane = [0, 0, 0, 0];
		this.particle_lifetime_expiration_expression = '';
		this.particle_lifetime_expire_in = [];
		this.particle_lifetime_expire_outside = [];
		this.particle_texture_width = 0;
		this.particle_texture_height = 0;
		this.particle_texture_path = '';
		this.particle_texture_image = '';
		this.particle_texture_mode = '';
		this.particle_texture_uv = [0, 0];
		this.particle_texture_uv_size = [0, 0];
		this.particle_texture_uv_step = [0, 0];
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
				this.curves[key] = new_curve;
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
const Config = require("./config");

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
function removeFromArray(array, item) {
	let index = array.indexOf(item);
	if (index >= 0) {
		array.splice(index, 1);
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
function calculateCurve(emitter, curve, params) {

	var position = emitter.Molang.parse(curve.input, params);
	var range = emitter.Molang.parse(curve.range, params);

	position = (position/range) || 0;
	if (position === Infinity) position = 0;

	if (curve.mode.value == 'linear') {

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


class Wintersky {
	constructor(config) {
		// this.Molang = new Molang()
		this.Molang = Molang;
		Molang.variableHandler = (key, params) => {
			return this.creation_values[key]
				|| this.tick_values[key]
				|| (this.config.curves[key] && calculateCurve(this, this.config.curves[key], params))
		}

		this.object = new THREE.Object3D();
		this.material = new THREE.MeshNormalMaterial({
			color: 0xffffff,
			transparent: true,
			alphaTest: 0.2
		});
		Wintersky.emitters.push(this);

		this.config = config instanceof Config ? config : new Config(config);

		this.group = new THREE.Object3D();

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
	calculate(input, variables, datatype) {

		let getV = v => this.Molang.parse(v, variables)
		var data;
	
		if (input instanceof Array) {
			if (input.length === 4) {
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
			var val = (this.value && this.value.hsl) ? this.value.hex : this.value;
			var c = tinycolor(val).toHex();
			data = new THREE.Color('#'+c)
		} else {
			data = getV(input)
		}
		return data;
	}
	updateMaterial() {
		var scope = this;
		var url;
		var path = this.config.particle_texture_inputs.path;
		if (this.config.particle_texture_inputs.image.image) {
			url = this.config.particle_texture_inputs.image.image.data;
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
			/*
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
			}*/
	
			tex.magFilter = THREE.NearestFilter
			tex.minFilter = THREE.NearestFilter
			scope.material.map = tex
			/*
			var x_factor = System.material.map.image.naturalWidth / this.this.config.particle_texture_width;
			var y_factor = System.material.map.image.naturalHeight / this.this.config.particle_texture_height;

			if (x_factor && x_factor != 1) {
				factorize(this.config.particle_texture_inputs.uv, 0, x_factor)
				factorize(this.config.particle_texture_inputs.uv_size, 0, x_factor)
				factorize(this.config.particle_texture_inputs.uv_step, 0, x_factor)
			}
			if (y_factor && y_factor != 1) {
				factorize(this.config.particle_texture_inputs.uv, 1, y_factor)
				factorize(this.config.particle_texture_inputs.uv_size, 1, y_factor)
				factorize(this.config.particle_texture_inputs.uv_step, 1, y_factor)
			}*/
			this.this.config.particle_texture_width = scope.material.map.image.naturalWidth;
			this.this.config.particle_texture_height = scope.material.map.image.naturalHeight;
			if (typeof cb === 'function') {
				cb()
			}
		})
	}
	start() {
		/*
		for (var i = this.particles.length-1; i >= 0; i--) {
			this.particles[i].remove()
		}*/
		this.age = 0;
		this.enabled = true;
		var params = this.params()
		this.active_time = this.calculate(this.config.emitter_lifetime_active_time, params)
		this.sleep_time = this.calculate(this.config.emitter_lifetime_sleep_time, params)
		this.random_vars = [Math.random(), Math.random(), Math.random(), Math.random()]
		this.creation_values = {};
		for (var key in this.creation_variables) {
			var s = this.creation_variables[key];
			this.creation_values[key] = Molang.parse(s)
		}
		if (this.config.emitter_rate_mode === 'instant') {
			this.spawnParticles(this.calculate(this.config.emitter_rate_amount, params))
		}
		return this;
	}
	tick() {
		var params = this.params()
		this.tick_values = {};
		for (var key in this.tick_variables) {
			var s = this.tick_variables[key];
			this.tick_values[key] = Molang.parse(s, params)
		}
		if (this.enabled && this.config.emitter_rate_mode === 'steady') {
			var p_this_tick = this.calculate(this.config.emitter_rate_rate, params)/30
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
			if (this.enabled && this.calculate(this.config.emitter_lifetime_expiration, params)) {
				this.stop()
			}
			if (!this.enabled && this.calculate(this.config.emitter_lifetime_activation, params)) {
				this.start()
			}
		}
		return this;
	}
	jumpTo(second) {
		let old_time = Math.round(this.age*30)
		let new_time = Math.round(second*30)
		if (old_time == new_time) return;
		if (new_time < old_time) {
			this.stop().start();
		}
		while (Math.round(this.age*30) < new_time) {
			this.tick();
		}
		return this;
	}
	updateFacingRotation(camera) {
		this.particles.forEach(p => {

			switch (this.config.particle_appearance_facing_camera_mode) {
				case 'lookat_xyz':
					p.mesh.lookAt(camera.position)
					break;
				case 'lookat_y':
					var v = new THREE.Vector3().copy(camera.position);
					v.y = p.position.y;
					p.mesh.lookAt(v);
					break;
				case 'rotate_xyz':
					p.mesh.rotation.copy(camera.rotation);
					break;
				case 'rotate_y':
					p.mesh.rotation.copy(camera.rotation);
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

		if (this.config.emitter_rate_mode == 'steady') {
			var max = this.calculate(this.config.emitter_rate_maximum, this.params())||0;
			max = MathUtil.clamp(max, 0, Wintersky.global_config.max_emitter_particles)
			count = MathUtil.clamp(count, 0, max-this.particles.length);
		} else {
			count = MathUtil.clamp(count, 0, Wintersky.global_config.max_emitter_particles-this.particles.length);
		}
		for (var i = 0; i < count; i++) {
			if (this.dead_particles.length) {
				var p = this.dead_particles.pop()
			} else {
				var p = new Wintersky.Particle(this)
			}
			p.add()
		}
		return count;
	}
}
Wintersky.emitters = [];
Wintersky.updateFacingRotation = function(camera) {
	Wintersky.emitters.forEach(emitter => {
		emitter.updateFacingRotation(camera);
	});
}
Wintersky.global_config = {
	max_emitter_particles: 10000
}

Wintersky.Particle = class {
	constructor(emitter, data) {
		this.emitter = emitter;
		if (!data) data = 0;

		this.geometry = new THREE.PlaneGeometry(1, 1)
		this.material = this.emitter.material.clone();
		this.mesh = new THREE.Mesh(this.geometry, this.material)
		this.position = this.mesh.position;

		this.speed = data.speed||new THREE.Vector3();
		this.acceleration = data.acceleration||new THREE.Vector3();

		this.add()
	}
	params() {
		var obj = this.emitter.params();
		obj["variable.particle_lifetime"] = this.lifetime;
		obj["variable.particle_age"] = this.age;
		obj["variable.particle_random_1"] = this.random_vars[0];
		obj["variable.particle_random_2"] = this.random_vars[1];
		obj["variable.particle_random_3"] = this.random_vars[2];
		obj["variable.particle_random_4"] = this.random_vars[3];
		return obj;
	}
	add() {
		if (!this.emitter.particles.includes(this)) {
			this.emitter.particles.push(this);
			this.emitter.group.add(this.mesh)
		}

		this.age = this.loop_time = 0;
		this.current_frame = 0;
		this.random_vars = [Math.random(), Math.random(), Math.random(), Math.random()]
		this.material.copy(this.emitter.material)
		this.material.needsUpdate = true;
		var params = this.params()

		this.position.set(0, 0, 0)
		this.lifetime = this.emitter.calculate(this.emitter.config.particle_lifetime_max_lifetime, params);
		this.initial_rotation = this.emitter.calculate(this.emitter.config.particle_rotation_initial_rotation, params);
		this.rotation_rate = this.emitter.calculate(this.emitter.config.particle_rotation_rotation_rate, params);
		this.rotation = 0;

		//Init Position:
		var surface = this.emitter.config.emitter_shape_surface_only;
		if (this.emitter.shape === 'box') {
			var size = this.emitter.calculate(this.emitter.config.emitter_shape_half_dimensions, params);

			this.position.x = MathUtil.randomab(-size.x, size.x);
			this.position.y = MathUtil.randomab(-size.y, size.y);
			this.position.z = MathUtil.randomab(-size.z, size.z);

			if (surface) {
				var face = Math.floor(MathUtil.randomab(0, 3))
				var side = Math.floor(MathUtil.randomab(0, 2))
				this.position.setComponent(face, size.getComponent(face) * (side?1:-1))
			}
		} else if (this.emitter.shape === 'entity_aabb') {
			var size = new THREE.Vector3(0.5, 1, 0.5);

			this.position.x = MathUtil.randomab(-size.x, size.x);
			this.position.y = MathUtil.randomab(-size.y, size.y);
			this.position.z = MathUtil.randomab(-size.z, size.z);

			if (surface) {
				var face = Math.floor(MathUtil.randomab(0, 3))
				var side = Math.floor(MathUtil.randomab(0, 2))
				this.position.setComponent(face, size.getComponent(face) * (side?1:-1))
			}
		} else if (this.emitter.shape === 'sphere') {

			var radius = this.emitter.calculate(this.emitter.config.emitter_shape_radius, params)
			if (surface) {
				this.position.x = radius
			} else {
				this.position.x = radius * Math.random()
			}
			this.position.applyEuler(THREE.getRandomEuler())
		} else if (this.emitter.shape === 'disc') {
			var radius = this.emitter.calculate(this.emitter.config.emitter_shape_radius, params)
			var ang = Math.random()*Math.PI*2
			var dis = surface ? radius : radius * Math.sqrt(Math.random())

			this.position.x = dis * Math.cos(ang)
			this.position.z = dis * Math.sin(ang)

			var normal = this.emitter.calculate(this.emitter.config.emitter_shape_plane_normal, params)
			if (!normal.equals(Normals.n)) {
				var q = new THREE.Quaternion().setFromUnitVectors(Normals.y, normal)
				this.position.applyQuaternion(q)
			}
		}
		//Speed
			//this.speed = this.emitter.calculate(this.emitter.config.particle_motion_direction_speed, params);
		this.speed = new THREE.Vector3()
		var dir = this.emitter.config.particle_direction_mode;
		if (dir == 'inwards' || dir == 'outwards') {

			if (this.emitter.shape === 'point') {
				this.speed.set(1, 0, 0).applyEuler(THREE.getRandomEuler())
			} else {
				this.speed.copy(this.position).normalize()
				if (dir == 'inwards') {
					this.speed.negate()
				}
			}
		} else {
			this.speed = this.emitter.calculate(this.emitter.config.particle_direction_direction, params).normalize()
		}
		var speed = this.emitter.calculate(this.emitter.config.particle_motion_linear_speed, params);
		this.speed.x *= speed;
		this.speed.y *= speed;
		this.speed.z *= speed;

		this.position.add(this.emitter.calculate(this.emitter.config.emitter_shape_offset, params))

		//UV
		this.setFrame(0)

		return this.tick();
	}
	tick() {
		var params = this.params()

		//Lifetime
		this.age += 1/30;
		this.loop_time += 1/30;
		if (this.emitter.config.particle_lifetime_mode === 'time') {
			if (this.age > this.lifetime) {
				this.remove();
			}
		} else {
			if (this.emitter.calculate(this.emitter.config.particle_lifetime_expiration_expression, params)) {
				this.remove();
			}
		}
		//Movement
		if (this.emitter.config.particle_motion_mode === 'dynamic') {
			//Position
			var drag = this.emitter.calculate(this.emitter.config.particle_motion_linear_drag_coefficient, params);
			this.acceleration = this.emitter.calculate(this.emitter.config.particle_motion_linear_acceleration, params);
			this.acceleration.addScaledVector(this.speed, -drag)
			this.speed.addScaledVector(this.acceleration, 1/30);
			this.position.addScaledVector(this.speed, 1/30);

			//Rotation
			var rot_drag = this.emitter.calculate(this.emitter.config.particle_rotation_rotation_drag_coefficient, params)
			var rot_acceleration = this.emitter.calculate(this.emitter.config.particle_rotation_rotation_acceleration, params)
				rot_acceleration += -rot_drag * this.rotation_rate;
			this.rotation_rate += rot_acceleration*1/30;
			this.rotation = MathUtil.degToRad(this.initial_rotation + this.rotation_rate*this.age);
		} else {
			if (this.emitter.config.particle_motion_relative_position.join('').length) {
				this.position.copy(this.emitter.calculate(this.emitter.config.particle_motion_relative_position, params));
			}
			this.rotation = MathUtil.degToRad(this.emitter.calculate(this.emitter.config.particle_rotation_rotation, params));
		}

		//Size
		var size = this.emitter.calculate(this.emitter.config.particle_appearance_size, params);
		//console.log(this.emitter.config.particle_appearance_size, size)
		this.mesh.scale.x = size.x*2.25 || 0.0001;
		this.mesh.scale.y = size.y*2.25 || 0.0001;

		//UV
		if (this.emitter.config.particle_texture_mode === 'animated') {
			var max_frame = this.emitter.calculate(this.emitter.config.particle_texture_max_frame, params);
			if (this.emitter.config.particle_texture_stretch_to_lifetime && max_frame) {
				var fps = max_frame/this.lifetime;
			} else {
				var fps = this.emitter.calculate(this.emitter.config.particle_texture_frames_per_second, params);
			}
			if (Math.floor(this.loop_time*fps) > this.current_frame) {
				this.current_frame = Math.floor(this.loop_time*fps);
				if (max_frame && this.current_frame > max_frame) {
					if (this.emitter.config.particle_texture_loop) {
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
		if (this.emitter.config.particle_color_mode === 'expression') {
			var c = this.emitter.calculate(this.emitter.config.particle_color_expression, params)
			this.material.color.r = c.x;
			this.material.color.g = c.y;
			this.material.color.b = c.z;
		}

		return this;
	}
	remove() {
		removeFromArray(this.emitter.particles, this)
		this.emitter.group.remove(this.mesh)
		this.emitter.dead_particles.push(this)
		return this;
	}
	setFrame(n) {
		var params = this.params()
		var uv = this.emitter.calculate(this.emitter.config.particle_texture_uv, params)
		var size = this.emitter.calculate(this.emitter.config.particle_texture_uv_size, params)
		if (n) {
			var offset = this.emitter.calculate(this.emitter.config.particle_texture_uv_step, params)
			uv.addScaledVector(offset, n)
		}
		this.setUV(uv.x, uv.y, size.x||this.emitter.config.particle_texture_width, this.emitter.config.particle_texture_height||this.emitter.config.particle_texture_height)
	}
	setUV(x, y, w, h) {
		var epsilon = 0.05
		var vertex_uvs = this.geometry.faceVertexUvs[0]

		w = (x+w - 2*epsilon) / this.emitter.config.particle_texture_width;
		h = (y+h - 2*epsilon) / this.emitter.config.particle_texture_height;
		x = (x + (w>0 ? epsilon : -epsilon)) / this.emitter.config.particle_texture_width;
		y = (y + (h>0 ? epsilon : -epsilon)) / this.emitter.config.particle_texture_height;

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
