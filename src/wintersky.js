import Molang from 'molangjs';
import THREE from 'three';
import tinycolor from 'tinycolor2';

import Config from './config';
import MathUtil from './mathutil';

import MissingTex from '../assets/missing.png';
import ParticlesTex from '../assets/particles.png';
import FlameAtlasTex from '../assets/flame_atlas.png';
import SoulTex from '../assets/soul.png';
import CampfireSmokeTex from '../assets/campfire_smoke.png';



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
function calculateGradient(gradient, percent) {
	let index = 0;
	gradient.forEach((point, i) => {
		if (point.percent <= percent) index = i;
	});
	if (gradient[index] && !gradient[index+1]) {
		var color = gradient[index].color;

	} else if (!gradient[index] && gradient[index+1]) {
		var color = gradient[index+1].color;

	} else if (gradient[index] && gradient[index+1]) {
		// Interpolate
		var mix = (percent - gradient[index].percent) / (gradient[index+1].percent - gradient[index].percent)
		var color = tinycolor.mix(gradient[index].color, gradient[index+1].color, mix*100).toHexString()

	} else {
		var color = '#ffffff'
	}
	return new THREE.Color(color);
}

const Wintersky = {
	Config,
	emitters: [],
	updateFacingRotation(camera) {
		Wintersky.emitters.forEach(emitter => {
			emitter.updateFacingRotation(camera);
		});
	},
	global_config: {
		max_emitter_particles: 30000
	}
};

Wintersky.Emitter = class {
	constructor(config) {
		Wintersky.emitters.push(this);

		this.Molang = new Molang();
		this.Molang.variableHandler = (key, params) => {
			return this.creation_values[key]
				|| this.tick_values[key]
				|| (this.config.curves[key] && calculateCurve(this, this.config.curves[key], params))
		}

		this.group = new THREE.Object3D();
		this.material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			vertexColors: THREE.FaceColors,
			alphaTest: 0.2
		});
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

		this.updateMaterial();
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
	updateMaterial() {
		var scope = this;
		var url;
		var path = this.config.particle_texture_path;

		switch (path) {
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
		var tex = new THREE.TextureLoader().load(url, function(a, b) {
			tex.magFilter = THREE.NearestFilter;
			tex.minFilter = THREE.NearestFilter;
			scope.material.map = tex;
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

		for (var line of this.config.variables_creation_vars) {
			let [key, value] = line.split(/\s*=(.+)/);
			value = value.replace(/^\s*=\s*/, '');
			this.creation_values[key] = this.Molang.parse(value)
		}

		if (this.config.emitter_rate_mode === 'instant') {
			this.spawnParticles(this.calculate(this.config.emitter_rate_amount, params))
		}
		return this;
	}
	tick() {
		var params = this.params()
		this.tick_values = {};

		for (var line of this.config.variables_tick_vars) {
			let [key, value] = line.split(/\s*=(.+)/);
			value = value.replace(/^\s*=\s*/, '');
			this.tick_values[key] = this.Molang.parse(value)
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

		
		if (this.config.emitter_lifetime_mode == 'looping') {
			//Looping
			if (this.enabled && MathUtil.roundTo(this.age, 5) >= this.active_time) {
				this.stop()
			}
			if (!this.enabled && MathUtil.roundTo(this.age, 5) >= this.sleep_time) {
				this.start()
			}
		} else if (this.config.emitter_lifetime_mode == 'once') {
			//Once
			if (this.enabled && MathUtil.roundTo(this.age, 5) >= this.active_time) {
				this.stop()
			}
		} else if (this.config.emitter_lifetime_mode === 'expression') {
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
		if (this.emitter.config.emitter_shape_mode === 'box') {
			var size = this.emitter.calculate(this.emitter.config.emitter_shape_half_dimensions, params);

			this.position.x = MathUtil.randomab(-size.x, size.x);
			this.position.y = MathUtil.randomab(-size.y, size.y);
			this.position.z = MathUtil.randomab(-size.z, size.z);

			if (surface) {
				var face = Math.floor(MathUtil.randomab(0, 3))
				var side = Math.floor(MathUtil.randomab(0, 2))
				this.position.setComponent(face, size.getComponent(face) * (side?1:-1))
			}
		} else if (this.emitter.config.emitter_shape_mode === 'entity_aabb') {
			var size = new THREE.Vector3(0.5, 1, 0.5);

			this.position.x = MathUtil.randomab(-size.x, size.x);
			this.position.y = MathUtil.randomab(-size.y, size.y);
			this.position.z = MathUtil.randomab(-size.z, size.z);

			if (surface) {
				var face = Math.floor(MathUtil.randomab(0, 3))
				var side = Math.floor(MathUtil.randomab(0, 2))
				this.position.setComponent(face, size.getComponent(face) * (side?1:-1))
			}
		} else if (this.emitter.config.emitter_shape_mode === 'sphere') {

			var radius = this.emitter.calculate(this.emitter.config.emitter_shape_radius, params)
			if (surface) {
				this.position.x = radius
			} else {
				this.position.x = radius * Math.random()
			}
			this.position.applyEuler(MathUtil.getRandomEuler())
		} else if (this.emitter.config.emitter_shape_mode === 'disc') {
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
		this.speed = new THREE.Vector3()
		var dir = this.emitter.config.particle_direction_mode;
		if (dir == 'inwards' || dir == 'outwards') {

			if (this.emitter.config.emitter_shape_mode === 'point') {
				this.speed.set(1, 0, 0).applyEuler(MathUtil.getRandomEuler())
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
		} else {
			this.setFrame(0);
		}

		//Color (ToDo)
		if (this.emitter.config.particle_color_mode === 'expression') {
			var c = this.emitter.calculate(this.emitter.config.particle_color_expression, params, 'array')
			this.setColor(...c);

		} else if (this.emitter.config.particle_color_mode === 'gradient') {
			var i = this.emitter.calculate(this.emitter.config.particle_color_interpolant, params)
			var r = this.emitter.calculate(this.emitter.config.particle_color_range, params)
			var c = calculateGradient(this.emitter.config.particle_color_gradient, (i/r) * 100)
			this.setColor(c.r, c.g, c.b);

		} else {
			var c = tinycolor(this.emitter.config.particle_color_static).toRgb();
			this.setColor(c.r/255, c.g/255, c.b/255);
		}

		return this;
	}
	remove() {
		removeFromArray(this.emitter.particles, this)
		this.emitter.group.remove(this.mesh)
		this.emitter.dead_particles.push(this)
		return this;
	}
	setColor(r, g, b) {
		this.mesh.geometry.faces.forEach(face => {
			face.color.setRGB(r, g, b)
		})
		this.mesh.geometry.colorsNeedUpdate = true;
	}
	setFrame(n) {
		var params = this.params()
		var uv = this.emitter.calculate(this.emitter.config.particle_texture_uv, params)
		var size = this.emitter.calculate(this.emitter.config.particle_texture_uv_size, params)
		if (n) {
			var offset = this.emitter.calculate(this.emitter.config.particle_texture_uv_step, params)
			uv.addScaledVector(offset, n)
		}
		this.setUV(uv.x, uv.y, size.x||this.emitter.config.particle_texture_width, size.y||this.emitter.config.particle_texture_height)
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

export default Wintersky
