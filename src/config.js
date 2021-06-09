import tinycolor from 'tinycolor2'
import Wintersky from './wintersky';
import * as THREE from 'three';

import MissingTex from '../assets/missing.png';
import ParticlesTex from '../assets/particles.png';
import FlameAtlasTex from '../assets/flame_atlas.png';
import SoulTex from '../assets/soul.png';
import CampfireSmokeTex from '../assets/campfire_smoke.png';

function parseColor(input) {
	if (typeof input == 'string' && input[0] == '#') {
		if (input.length < 9) {
			input = '#ff' + input.substr(1, 6);
		}
	} else {
		input = new tinycolor(input).toHex8String();
	}
	return '#' + input.substr(3, 6) + input.substr(1, 2);
}

class Config {
	constructor(scene, config, options = 0) {
		this.scene = scene
		this.texture = new THREE.Texture(new Image());
		this.texture.image.onload = () => {
			this.texture.needsUpdate = true;
			if (typeof this.onTextureUpdate == 'function') {
				this.onTextureUpdate();
			}
		}
		this.reset()
		this.onTextureUpdate = null;

		if (config && config.particle_effect) {
			this.setFromJSON(config);
		} else if (typeof config == 'object') {
			Object.assign(this, config);
		}
		if (options.path) this.set('file_path', options.path);
	}
	reset() {
		this.texture.image.src = MissingTex;
		this.texture.magFilter = THREE.NearestFilter;
		this.texture.minFilter = THREE.NearestFilter;

		for (var key in Config.types) {
			var type = Config.types[key];
			var value;
			switch (type.type) {
				case 'string': value = ''; break;
				case 'molang': value = ''; break;
				case 'number': value = 0; break;
				case 'boolean': value = false; break;
				case 'color': value = '#ffffff'; break;
				case 'object': value = {}; break;
			}
			if (type.array) {
				this[key] = [];
				if (type.dimensions) {
					for (var i = 0; i < type.dimensions; i++) {
						if (type.type == 'object') value = {};
						this[key].push(value);
					}
				}
			} else {
				this[key] = value;
			}
		}
		this.emitter_rate_mode = 'steady';
		this.emitter_lifetime_mode = 'looping';
		this.emitter_shape_mode = 'point';
		this.particle_appearance_material = 'particles_alpha';
		this.particle_appearance_facing_camera_mode = 'rotate_xyz';
		this.particle_appearance_direction_mode = 'derive_from_velocity';
		this.particle_appearance_speed_threshold = 0.01;
		this.particle_direction_mode = 'outwards';
		this.particle_motion_mode = 'dynamic';
		this.particle_rotation_mode = 'dynamic';
		this.particle_texture_mode = 'static';
		this.particle_lifetime_mode = 'time';
		this.particle_color_mode = 'static';

		this.emitter_rate_rate = '1';
		this.emitter_rate_maximum = '100';
		this.emitter_lifetime_active_time = '1';
		this.particle_appearance_size = ['0.2', '0.2'];
		this.particle_lifetime_max_lifetime = '1';
		this.particle_texture_size = [16, 16];

		return this;
	}
	set(key, val) {
		if (Config.types[key] == undefined || val == undefined || val == null) return;

		if (Config.types[key].array && val instanceof Array) {
			if (Config.types[key].type == 'molang') {
				val = val.map(v => v.toString());
			}
			this[key].splice(0, Infinity, ...val);
		} else if (typeof this[key] == 'string') {
			this[key] = val.toString();
		} else if (Config.types[key].type == 'number' && typeof val == 'number') {
			this[key] = val;
		} else if (Config.types[key].type == 'boolean') {
			this[key] = !!val;
		}
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
			this.set('particle_texture_path', desc.basic_render_parameters.texture);

			this.set('particle_appearance_material', desc.basic_render_parameters.material);
		}
		if (curves) {
			for (var key in curves) {
				var json_curve = curves[key];
				var new_curve = {
					id: key,
					mode: json_curve.type,
					input: (json_curve.input || 0).toString(),
					range: (json_curve.horizontal_range || 0).toString(),
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
				this.space_local_position = comp('emitter_local_space').position;
				this.space_local_rotation = comp('emitter_local_space').rotation;
				this.space_local_velocity = comp('emitter_local_space').velocity;
			}
			if (comp('emitter_rate_steady')) {
				this.set('emitter_rate_mode',  'steady');
				this.set('emitter_rate_rate',  comp('emitter_rate_steady').spawn_rate);
				this.set('emitter_rate_maximum',  comp('emitter_rate_steady').max_particles);
			}
			if (comp('emitter_rate_instant')) {
				this.set('emitter_rate_mode',  'instant');
				this.set('emitter_rate_amount',  comp('emitter_rate_instant').num_particles);
			}
			if (comp('emitter_lifetime_once')) {
				this.set('emitter_lifetime_mode',  'once');
				this.set('emitter_lifetime_active_time',  comp('emitter_lifetime_once').active_time);
			}
			if (comp('emitter_lifetime_looping')) {
				this.set('emitter_lifetime_mode',  'looping');
				this.set('emitter_lifetime_active_time',  comp('emitter_lifetime_looping').active_time);
				this.set('emitter_lifetime_sleep_time',  comp('emitter_lifetime_looping').sleep_time);
			}
			if (comp('emitter_lifetime_expression')) {
				this.set('emitter_lifetime_mode',  'expression');
				this.set('emitter_lifetime_activation',  comp('emitter_lifetime_expression').activation_expression);
				this.set('emitter_lifetime_expiration',  comp('emitter_lifetime_expression').expiration_expression);
			}
			var shape_component = comp('emitter_shape_point') || comp('emitter_shape_custom');
			if (shape_component) {
				this.set('emitter_shape_mode',  'point');
				this.set('emitter_shape_offset',  shape_component.offset);
			}
			if (comp('emitter_shape_sphere')) {
				shape_component = comp('emitter_shape_sphere');
				this.set('emitter_shape_mode',  'sphere');
				this.set('emitter_shape_offset',  shape_component.offset);
				this.set('emitter_shape_radius',  shape_component.radius);
				this.set('emitter_shape_surface_only',  shape_component.surface_only);
			}
			if (comp('emitter_shape_box')) {
				shape_component = comp('emitter_shape_box');
				this.set('emitter_shape_mode',  'box');
				this.set('emitter_shape_offset',  shape_component.offset);
				this.set('emitter_shape_half_dimensions',  shape_component.half_dimensions);
				this.set('emitter_shape_surface_only',  shape_component.surface_only);
			}
			if (comp('emitter_shape_disc')) {
				shape_component = comp('emitter_shape_disc');
				this.set('emitter_shape_mode',  'disc');
				this.set('emitter_shape_offset',  shape_component.offset);
				switch (shape_component.plane_normal) {
					case 'x': this.set('emitter_shape_plane_normal',  [1, 0, 0]); break;
					case 'y': this.set('emitter_shape_plane_normal',  [0, 1, 0]); break;
					case 'z': this.set('emitter_shape_plane_normal',  [0, 0, 1]); break;
					default:  this.set('emitter_shape_plane_normal',  shape_component.plane_normal); break;
				}
				this.set('emitter_shape_radius',  shape_component.radius);
				this.set('emitter_shape_surface_only',  shape_component.surface_only);
			}
			if (comp('emitter_shape_entity_aabb')) {
				this.set('emitter_shape_mode',  'entity_aabb');
				this.set('emitter_shape_surface_only',  comp('emitter_shape_entity_aabb').surface_only);
				shape_component = comp('emitter_shape_entity_aabb');
			}
			if (shape_component && shape_component.direction) {
				if (shape_component.direction == 'inwards' || shape_component.direction == 'outwards') {
					this.set('particle_direction_mode', shape_component.direction);
				} else {
					this.set('particle_direction_mode', 'direction');
					this.set('particle_direction_direction', shape_component.direction);
				}
			}

			if (comp('particle_initial_spin')) {
				this.set('particle_rotation_initial_rotation', comp('particle_initial_spin').rotation);
				this.set('particle_rotation_rotation_rate', comp('particle_initial_spin').rotation_rate);
			}
			if (comp('particle_kill_plane')) {
				this.set('particle_lifetime_kill_plane', comp('particle_kill_plane'));
			}


			if (comp('particle_motion_dynamic')) {
				//this.set('particle_motion_mode', 'dynamic');
				let linear_acceleration = comp('particle_motion_dynamic').linear_acceleration;
				let linear_drag_coefficient = comp('particle_motion_dynamic').linear_drag_coefficient;
				let rotation_acceleration = comp('particle_motion_dynamic').rotation_acceleration;
				let rotation_drag_coefficient = comp('particle_motion_dynamic').rotation_drag_coefficient;

				if (linear_acceleration != undefined || linear_drag_coefficient != undefined) {
					this.set('particle_motion_mode', 'dynamic');
					this.set('particle_motion_linear_acceleration', linear_acceleration);
					this.set('particle_motion_linear_drag_coefficient', linear_drag_coefficient);
					this.set('particle_motion_linear_speed', 1);
				}
				if (linear_acceleration != undefined || linear_drag_coefficient != undefined) {
					this.set('particle_rotation_mode', 'dynamic');
					this.set('particle_rotation_rotation_acceleration', rotation_acceleration);
					this.set('particle_rotation_rotation_drag_coefficient', rotation_drag_coefficient);
				}
			}
			if (comp('particle_motion_parametric')) {
				let relative_position = comp('particle_motion_parametric').relative_position;
				let direction = comp('particle_motion_parametric').direction;
				let rotation = comp('particle_motion_parametric').rotation;

				if (relative_position != undefined || direction != undefined) {
					this.set('particle_motion_mode', 'parametric');
					this.set('particle_motion_relative_position', relative_position);
					this.set('particle_motion_direction', direction);
				}
				if (rotation != undefined) {
					this.set('particle_rotation_mode', 'parametric');
					this.set('particle_rotation_rotation', rotation);
				}
			}




			if (comp('particle_motion_collision')) {
				this.set('particle_collision_enabled', comp('particle_motion_collision').enabled);
				this.set('particle_collision_collision_drag', comp('particle_motion_collision').collision_drag);
				this.set('particle_collision_coefficient_of_restitution', comp('particle_motion_collision').coefficient_of_restitution);
				this.set('particle_collision_collision_radius', comp('particle_motion_collision').collision_radius);
				this.set('particle_collision_expire_on_contact', comp('particle_motion_collision').expire_on_contact);
			}
			if (comp('particle_initial_speed') !== undefined) {
				var c = comp('particle_initial_speed')
				if (typeof c !== 'object') {
					this.set('particle_motion_linear_speed', c);
				} else {
					this.set('particle_direction_mode', 'direction');
					this.set('particle_direction_direction', comp('particle_initial_speed'));
					this.set('particle_motion_linear_speed', 1);
				}
			}

			if (comp('particle_lifetime_expression')) {
				this.set('particle_lifetime_mode', 'expression');
				if (comp('particle_lifetime_expression').expiration_expression) {
					this.set('particle_lifetime_mode', 'expression');
					this.set('particle_lifetime_expiration_expression', comp('particle_lifetime_expression').expiration_expression);
				} else {
					this.set('particle_lifetime_mode', 'time');
					this.set('particle_lifetime_max_lifetime', comp('particle_lifetime_expression').max_lifetime);
				}
			}
			if (comp('particle_expire_if_in_blocks') instanceof Array) {
				this.set('particle_lifetime_expire_in', comp('particle_expire_if_in_blocks'));
			}
			if (comp('particle_expire_if_not_in_blocks') instanceof Array) {
				this.set('particle_lifetime_expire_outside', comp('particle_expire_if_not_in_blocks'));
			}
			
			if (comp('particle_appearance_billboard')) {
				this.set('particle_appearance_size', comp('particle_appearance_billboard').size);
				this.set('particle_appearance_facing_camera_mode', comp('particle_appearance_billboard').facing_camera_mode);

				var {direction, uv} = comp('particle_appearance_billboard');

				if (direction) {
					this.set('particle_appearance_direction_mode', direction.mode);
					this.set('particle_appearance_speed_threshold', direction.min_speed_threshold);
					this.set('particle_appearance_direction', direction.custom_direction);
				}

				if (uv) {
					if (uv.texture_width) {
						this.set('particle_texture_size', [uv.texture_width, uv.texture_height]);
					}
					if (uv.flipbook) {
						this.set('particle_texture_mode', 'animated');
						this.set('particle_texture_uv', uv.flipbook.base_UV);
						this.set('particle_texture_uv_size', uv.flipbook.size_UV);
						this.set('particle_texture_uv_step', uv.flipbook.step_UV);
						this.set('particle_texture_frames_per_second', uv.flipbook.frames_per_second);
						this.set('particle_texture_max_frame', uv.flipbook.max_frame);
						this.set('particle_texture_stretch_to_lifetime', uv.flipbook.stretch_to_lifetime);
						this.set('particle_texture_loop', uv.flipbook.loop);
					} else {
						this.set('particle_texture_mode', 'static');
						this.set('particle_texture_uv', uv.uv);
						this.set('particle_texture_uv_size', uv.uv_size);
					}
				}
			}
			if (comp('particle_appearance_lighting')) {
				this.set('particle_color_light', true);
			}
			if (comp('particle_appearance_tinting')) {
				var c = comp('particle_appearance_tinting').color

				if (typeof c == 'string') {
					this.set('particle_color_static', parseColor(c));

				} else if (c instanceof Array && c.length >= 3) {
					if ((typeof c[0] + typeof c[1] + typeof c[2] + typeof c[3]).includes('string')) {
						this.set('particle_color_mode', 'expression');
						this.set('particle_color_expression', c);

					} else {
						this.set('particle_color_mode', 'static');
						
						var color = new tinycolor({
							r: c[0] * 255,
							g: c[1] * 255,
							b: c[2] * 255,
							a: c[3],
						}).toHex8String();
						this.set('particle_color_static', color);
					}
				} else if (typeof c == 'object') {
					// Gradient
					this.set('particle_color_mode', 'gradient');
					this.set('particle_color_interpolant', c.interpolant);
					let gradient_points = [];
					if (c.gradient instanceof Array) {
						let distance = 100 / (c.gradient.length-1);
						c.gradient.forEach((color, i) => {
							color = parseColor(color);
							var percent = distance * i;
							gradient_points.push({percent, color})
						})
					} else if (typeof c.gradient == 'object') {
						let max_time = 0;
						for (var time in c.gradient) {
							max_time = Math.max(parseFloat(time), max_time)
						}
						this.set('particle_color_range', max_time);
						for (var time in c.gradient) {
							var color = parseColor(c.gradient[time]);
							var percent = (parseFloat(time) / max_time) * 100;
							gradient_points.push({color, percent})
						}
					}
					this.set('particle_color_gradient', gradient_points)
				}
			}
		}

		this.updateTexture();
		return this;
	}
	updateTexture() {

		let continueLoading = url => {
			if (!url) {
				switch (this.particle_texture_path) {
					case 'textures/particle/particles':
						url = ParticlesTex;
						break;
					case 'textures/flame_atlas': case 'textures/particle/flame_atlas':
						url = FlameAtlasTex;
						break;
					case 'textures/particle/soul':
						url = SoulTex;
						break;
					case 'textures/particle/campfire_smoke':
						url = CampfireSmokeTex;
						break;
					default:
						url = MissingTex;
						break;
				}
			}
			this.texture.image.src = url;
		}

		if (typeof this.scene.fetchTexture == 'function') {
			let result = this.scene.fetchTexture(this);
			if (result instanceof Promise) {
				result.then(result2 => {
					continueLoading(result2);
				});
			} else {
				continueLoading(result);
			}
		} else {
			continueLoading();
		}
		return this;
	}
}
Config.types = {

	identifier: {type: 'string'},
	file_path: {type: 'string'},
	curves: {type: 'object'},
	space_local_position: {type: 'boolean'},
	space_local_rotation: {type: 'boolean'},
	space_local_velocity: {type: 'boolean'},
	variables_creation_vars: {type: 'string', array: true},
	variables_tick_vars: {type: 'string', array: true},
	emitter_rate_mode: {type: 'string'},
	emitter_rate_rate: {type: 'molang'},
	emitter_rate_amount: {type: 'molang'},
	emitter_rate_maximum: {type: 'molang'},
	emitter_lifetime_mode: {type: 'string'},
	emitter_lifetime_active_time: {type: 'molang'},
	emitter_lifetime_sleep_time: {type: 'molang'},
	emitter_lifetime_activation: {type: 'molang'},
	emitter_lifetime_expiration: {type: 'molang'},
	emitter_shape_mode: {type: 'string'},
	emitter_shape_offset: {type: 'molang', array: true, dimensions: 3},
	emitter_shape_radius: {type: 'molang'},
	emitter_shape_half_dimensions: {type: 'molang', array: true, dimensions: 3},
	emitter_shape_plane_normal: {type: 'molang', array: true, dimensions: 3},
	emitter_shape_surface_only: {type: 'boolean'},
	particle_appearance_size: {type: 'molang', array: true, dimensions: 2},
	particle_appearance_material: {type: 'string'},
	particle_appearance_facing_camera_mode: {type: 'string'},
	particle_appearance_direction_mode: {type: 'string'},
	particle_appearance_speed_threshold: {type: 'number'},
	particle_appearance_direction: {type: 'molang', array: true, dimensions: 3},
	particle_direction_mode: {type: 'string'},
	particle_direction_direction: {type: 'molang', array: true, dimensions: 3},
	particle_motion_mode: {type: 'string'},
	particle_motion_linear_speed: {type: 'molang'},
	particle_motion_linear_acceleration: {type: 'molang', array: true, dimensions: 3},
	particle_motion_linear_drag_coefficient: {type: 'molang'},
	particle_motion_relative_position: {type: 'molang', array: true, dimensions: 3},
	particle_motion_direction: {type: 'molang', array: true, dimensions: 3},
	particle_rotation_mode: {type: 'string'},
	particle_rotation_initial_rotation: {type: 'molang'},
	particle_rotation_rotation_rate: {type: 'molang'},
	particle_rotation_rotation_acceleration: {type: 'molang'},
	particle_rotation_rotation_drag_coefficient: {type: 'molang'},
	particle_rotation_rotation: {type: 'molang'},
	particle_lifetime_mode: {type: 'string'},
	particle_lifetime_max_lifetime: {type: 'molang'},
	particle_lifetime_kill_plane: {type: 'number', array: true, dimensions: 4},
	particle_lifetime_expiration_expression: {type: 'molang'},
	particle_lifetime_expire_in: {type: 'string', array: true},
	particle_lifetime_expire_outside: {type: 'string', array: true},
	particle_texture_size: {type: 'number', array: true, dimensions: 2},
	particle_texture_height: {type: 'number'},
	particle_texture_path: {type: 'string'},
	particle_texture_mode: {type: 'string'},
	particle_texture_uv: {type: 'molang', array: true, dimensions: 2},
	particle_texture_uv_size: {type: 'molang', array: true, dimensions: 2},
	particle_texture_uv_step: {type: 'molang', array: true, dimensions: 2},
	particle_texture_frames_per_second: {type: 'number'},
	particle_texture_max_frame: {type: 'molang'},
	particle_texture_stretch_to_lifetime: {type: 'boolean'},
	particle_texture_loop: {type: 'boolean'},
	particle_color_mode: {type: 'string'},
	particle_color_static: {type: 'color'},
	particle_color_interpolant: {type: 'molang'},
	particle_color_range: {type: 'number'},
	particle_color_gradient: {type: 'object', array: true},
	particle_color_expression: {type: 'molang', array: true, dimensions: 4},
	particle_color_light: {type: 'boolean'},
	particle_collision_enabled: {type: 'molang'},
	particle_collision_collision_drag: {type: 'number'},
	particle_collision_coefficient_of_restitution: {type: 'number'},
	particle_collision_collision_radius: {type: 'number'},
	particle_collision_expire_on_contact: {type: 'boolean'},
};
Wintersky.Config = Config;

export default Config;
