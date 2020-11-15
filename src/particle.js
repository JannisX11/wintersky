import * as THREE from 'three';
import tinycolor from 'tinycolor2';

import {MathUtil, Normals, removeFromArray} from './util';
import Wintersky from './wintersky';


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


class Particle {
	constructor(emitter, data) {
		this.emitter = emitter;
		if (!data) data = 0;

		this.geometry = new THREE.PlaneGeometry(1, 1)
		this.material = this.emitter.material;
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
			if (this.emitter.config.space_local_position && this.emitter.local_space.parent) {
				// Add the particle to the local space object if local space is enabled and used
				this.emitter.local_space.add(this.mesh);
			} else {
				// Otherwise add to global space
				this.emitter.global_space.add(this.mesh);
			}
		}

		this.age = this.loop_time = 0;
		this.current_frame = 0;
		this.random_vars = [Math.random(), Math.random(), Math.random(), Math.random()]
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

		if (this.emitter.parent_mode == 'locator') {
			this.position.x *= -1;
			this.position.y *= -1;
			this.speed.x *= -1;
			this.speed.y *= -1;
		} else if (this.emitter.config.space_local_position && !this.emitter.config.space_local_rotation) {
			this.speed.x *= -1;
			this.speed.z *= -1;
		}

		if (this.emitter.local_space.parent) {

			if (!this.emitter.config.space_local_rotation) {
				this.position.applyQuaternion(this.emitter.local_space.getWorldQuaternion(new THREE.Quaternion()))
			}
			if (!this.emitter.config.space_local_position) {
				let offset = this.emitter.local_space.getWorldPosition(new THREE.Vector3());
				this.position.addScaledVector(offset, 1/Wintersky.global_options._scale);
			}
		}

		//UV
		this.setFrame(0)

		return this.tick();
	}
	tick(jump) {
		var params = this.params()
		let {tick_rate} = Wintersky.global_options;

		//Lifetime
		this.age += 1/tick_rate;
		this.loop_time += 1/tick_rate;
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
			if (this.emitter.config.space_local_position) {
				if (this.emitter.parent_mode == 'locator') {
					this.acceleration.x *= -1;
					this.acceleration.y *= -1;
				}
			} else if (this.emitter.parent_mode != 'world') {
				this.acceleration.x *= -1;
				this.acceleration.z *= -1;
			}
			this.acceleration.addScaledVector(this.speed, -drag)
			this.speed.addScaledVector(this.acceleration, 1/tick_rate);
			this.position.addScaledVector(this.speed, 1/tick_rate);

			if (this.emitter.config.particle_lifetime_kill_plane.join('')) {
				var plane = this.emitter.calculate(this.emitter.config.particle_lifetime_kill_plane, params);
				var start_point = new THREE.Vector3().copy(this.position).addScaledVector(this.speed, -1/30);
				var line = new THREE.Line3(start_point, this.position)
				if (plane.intersectsLine(line)) {
					this.remove();
				}
			}

		} else if (this.emitter.config.particle_motion_mode === 'dynamic' && !jump) {
			if (this.emitter.config.particle_motion_relative_position.join('').length) {
				this.position.copy(this.emitter.calculate(this.emitter.config.particle_motion_relative_position, params));
			}
			if (this.emitter.config.particle_motion_direction.join('').length) {
				this.speed.copy(this.emitter.calculate(this.emitter.config.particle_motion_direction, params));
			}
		}

		// Rotation
		if (this.emitter.config.particle_rotation_mode === 'dynamic') {
			var rot_drag = this.emitter.calculate(this.emitter.config.particle_rotation_rotation_drag_coefficient, params)
			var rot_acceleration = this.emitter.calculate(this.emitter.config.particle_rotation_rotation_acceleration, params)
				rot_acceleration += -rot_drag * this.rotation_rate;
			this.rotation_rate += rot_acceleration*1/tick_rate;
			this.rotation = MathUtil.degToRad(this.initial_rotation + this.rotation_rate*this.age);

		} else if (this.emitter.config.particle_rotation_mode === 'parametric') {

			this.rotation = MathUtil.degToRad(this.emitter.calculate(this.emitter.config.particle_rotation_rotation, params));
		}
		

		if (!jump) {
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
		}

		return this;
	}
	remove() {
		removeFromArray(this.emitter.particles, this);
		if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
		this.emitter.dead_particles.push(this);
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
		this.geometry.uvsNeedUpdate = true;
	}
}
Wintersky.Particle = Particle;

export default Particle;
