import * as THREE from 'three';
import tinycolor from 'tinycolor2';

import {MathUtil, Normals, removeFromArray} from './util';
import Wintersky from './wintersky';

const defaultColor = {r: 255, r: 255, b: 255, a: 1};
const collisionPlane = new THREE.Plane().setComponents(0, 1, 0, 0);

function calculateGradient(gradient, percent) {
	let index = 0;
	gradient.forEach((point, i) => {
		if (point.percent <= percent) index = i;
	});
	if (gradient[index] && !gradient[index+1]) {
		return tinycolor(gradient[index].color).toRgb();

	} else if (!gradient[index] && gradient[index+1]) {
		return tinycolor(gradient[index+1].color).toRgb();

	} else if (gradient[index] && gradient[index+1]) {
		// Interpolate
		var mix = (percent - gradient[index].percent) / (gradient[index+1].percent - gradient[index].percent)
		return tinycolor.mix(gradient[index].color, gradient[index+1].color, mix*100).toRgb()

	} else {
		return defaultColor;
	}
}


class Particle {
	constructor(emitter) {
		this.emitter = emitter;

		this.geometry = new THREE.PlaneGeometry(2, 2)
		this.material = this.emitter.material;
		this.mesh = new THREE.Mesh(this.geometry, this.material)
		this.position = this.mesh.position;
		
		let colors = new Float32Array(16).fill(1);
		this.geometry.setAttribute('clr', new THREE.BufferAttribute(colors, 4));

		this.speed = new THREE.Vector3();
		this.acceleration = new THREE.Vector3();
		this.facing_direction = new THREE.Vector3();

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
			this.emitter.getActiveSpace().add(this.mesh);
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
		this.speed.set(0, 0, 0);
		var dir = this.emitter.config.particle_direction_mode;
		if (dir == 'outwards' && this.emitter.inherited_particle_speed) {
			this.speed.copy(this.emitter.inherited_particle_speed);

		} else {
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
			let linear_speed = this.emitter.calculate(this.emitter.config.particle_motion_linear_speed, params);
			this.speed.x *= linear_speed;
			this.speed.y *= linear_speed;
			this.speed.z *= linear_speed;
		}

		this.position.add(this.emitter.calculate(this.emitter.config.emitter_shape_offset, params))

		if (this.emitter.parent_mode == 'locator') {
			this.position.x *= -1;
			this.position.y *= -1;
			this.speed.x *= -1;
			this.speed.y *= -1;
		}
		if (this.emitter.parent_mode != 'world' && this.emitter.config.space_local_position && !this.emitter.config.space_local_rotation) {
			this.speed.x *= -1;
			this.speed.z *= -1;
		}
		
		if (this.emitter.config.emitter_shape_mode === 'entity_aabb') {
			this.position.x += 1;
		}

		if (this.emitter.local_space.parent) {
			if (this.emitter.parent_mode == 'locator') {
				this.speed.applyQuaternion(this.emitter.local_space.getWorldQuaternion(new THREE.Quaternion()))
			}
			if (!this.emitter.config.space_local_rotation) {
				this.position.applyQuaternion(this.emitter.local_space.getWorldQuaternion(new THREE.Quaternion()))
			}
			if (!this.emitter.config.space_local_position) {
				let offset = this.emitter.local_space.getWorldPosition(new THREE.Vector3());
				this.position.addScaledVector(offset, 1/this.emitter.scene.global_options._scale);
			}
		}

		//UV
		this.setFrame(0);

		// Creation event
		for (let event of this.emitter.config.particle_events_creation) {
			this.emitter.runEvent(event, this);
		}

		return this.tick();
	}
	tick(jump) {
		var params = this.params()
		let step = 1 / this.emitter.scene.global_options.tick_rate;

		for (var entry of this.emitter.config.particle_render_expression) {
			this.emitter.Molang.parse(entry, params);
		}

		//Lifetime
		let last_age = this.age;
		this.age += step;
		this.loop_time += step;
		if (this.lifetime && this.age > this.lifetime) {
			this.expire();
		}
		if (this.emitter.calculate(this.emitter.config.particle_lifetime_expiration_expression, params)) {
			this.expire();
		}
		
		//Movement
		if (this.emitter.config.particle_motion_mode === 'dynamic') {
			//Position
			var drag = this.emitter.calculate(this.emitter.config.particle_motion_linear_drag_coefficient, params);
			this.acceleration.copy(this.emitter.calculate(this.emitter.config.particle_motion_linear_acceleration, params));
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
			this.speed.addScaledVector(this.acceleration, step);
			this.position.addScaledVector(this.speed, step);

			if (this.emitter.config.particle_lifetime_kill_plane.find(v => v)) {
				// Kill Plane
				var plane = this.emitter.calculate(this.emitter.config.particle_lifetime_kill_plane, params);
				var start_point = new THREE.Vector3().copy(this.position).addScaledVector(this.speed, -step);
				var end_point = new THREE.Vector3().copy(this.position);
				if (this.emitter.config.space_local_position && this.emitter.parent_mode == 'locator') {
					start_point.x *= -1;
					start_point.y *= -1;
					end_point.x *= -1;
					end_point.y *= -1;
				}
				var line = new THREE.Line3(start_point, end_point);
				if (plane.intersectsLine(line)) {
					this.expire();
					return this;
				}
			}
			if (
				this.emitter.ground_collision && this.emitter.config.particle_collision_toggle &&
				(!this.emitter.config.particle_collision_enabled || this.emitter.calculate(this.emitter.config.particle_collision_enabled, params))
			) {
				// Collision
				let drag = this.emitter.config.particle_collision_collision_drag;
				let bounce = this.emitter.config.particle_collision_coefficient_of_restitution;
				let radius = Math.max(this.emitter.config.particle_collision_collision_radius, 0.0001);

				let plane = collisionPlane;
				let sphere = new THREE.Sphere(this.position, radius);
				let previous_pos = new THREE.Vector3().copy(this.position).addScaledVector(this.speed, -step);
				let line = new THREE.Line3(previous_pos, this.position);

				let intersects_line = plane.intersectsLine(line)
				if (intersects_line) {
					plane.intersectLine(line, this.position);
				}

				if (intersects_line || plane.intersectsSphere(sphere)) {
					// Collide
					if (this.emitter.config.particle_collision_events.length) {
						let speed = this.speed.length();
						for (let event of this.emitter.config.particle_collision_events) {
							if (typeof event != 'object' || !event.event) continue;
							if (event.min_speed && event.min_speed > speed) continue;
							this.emitter.runEvent(event.event, this);
						}
					}
					if (this.emitter.config.particle_collision_expire_on_contact) {
						this.expire();
						return this;
					}
					this.position.y = radius * Math.sign(previous_pos.y)

					this.speed.reflect(plane.normal);
					this.speed.y *= bounce;
					this.speed.x = Math.sign(this.speed.x) * MathUtil.clamp(Math.abs(this.speed.x) - drag * step, 0, Infinity);
					this.speed.z = Math.sign(this.speed.z) * MathUtil.clamp(Math.abs(this.speed.z) - drag * step, 0, Infinity);
				}
			}

		} else if (this.emitter.config.particle_motion_mode === 'parametric' && !jump) {
			if (this.emitter.config.particle_motion_relative_position.join('').length) {
				this.position.copy(this.emitter.calculate(this.emitter.config.particle_motion_relative_position, params));
			}
			if (this.emitter.config.particle_motion_direction.join('').length) {
				this.speed.copy(this.emitter.calculate(this.emitter.config.particle_motion_direction, params));
			}
			if (this.emitter.config.space_local_position) {
				if (this.emitter.parent_mode == 'locator') {
					this.position.x *= -1;
					this.position.y *= -1;
				}
			}
		}

		// Rotation
		if (this.emitter.config.particle_rotation_mode === 'dynamic') {
			var rot_drag = this.emitter.calculate(this.emitter.config.particle_rotation_rotation_drag_coefficient, params)
			var rot_acceleration = this.emitter.calculate(this.emitter.config.particle_rotation_rotation_acceleration, params)
				rot_acceleration += -rot_drag * this.rotation_rate;
			this.rotation_rate += rot_acceleration*step;
			this.rotation = MathUtil.degToRad(this.initial_rotation + this.rotation_rate*this.age);

		} else if (this.emitter.config.particle_rotation_mode === 'parametric') {

			this.rotation = MathUtil.degToRad(this.emitter.calculate(this.emitter.config.particle_rotation_rotation, params));
		}
		
		// Facing Direction
		if (this.emitter.config.particle_appearance_facing_camera_mode.substr(0, 9) == 'direction' || this.emitter.config.particle_appearance_facing_camera_mode == 'lookat_direction') {
			if (this.emitter.config.particle_appearance_direction_mode == 'custom') {
				this.facing_direction.copy(this.emitter.calculate(this.emitter.config.particle_appearance_direction, params)).normalize();

			} else if (this.speed.length() >= (this.emitter.config.particle_appearance_speed_threshold || 0.01)) {
				this.facing_direction.copy(this.speed).normalize();
			}
		}

		if (!jump) {
			//Size
			var size = this.emitter.calculate(this.emitter.config.particle_appearance_size, params);
			this.mesh.scale.x = size.x || 0.0001;
			this.mesh.scale.y = size.y || 0.0001;


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
					if (max_frame && this.current_frame >= max_frame) {
						if (this.emitter.config.particle_texture_loop) {
							this.current_frame = 0;
							this.loop_time = 0;
							this.setFrame(0);
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
				this.setColor(c.r/255, c.g/255, c.b/255, c.a);

			} else {
				var c = tinycolor(this.emitter.config.particle_color_static).toRgb();
				this.setColor(c.r/255, c.g/255, c.b/255, c.a);
			}
		}

		// Event timeline
		for (let key in this.emitter.config.particle_events_timeline) {
			let time = parseFloat(key);
			if (time >= last_age && time < this.age) {
				this.emitter.runEvent(this.emitter.config.particle_events_timeline[key], this);
			}
		}

		return this;
	}
	expire() {
		for (let event_id of this.emitter.config.particle_events_expiration) {
			this.emitter.runEvent(event_id, this);
		}
		this.remove();
	}
	remove() {
		removeFromArray(this.emitter.particles, this);
		if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
		this.emitter.dead_particles.push(this);
		return this;
	}
	delete() {
		if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
		this.geometry.dispose();
	}
	setColor(r, g, b, a = 1) {
		let attribute = this.geometry.getAttribute('clr');
		attribute.array.set([
			r, g, b, a,
			r, g, b, a,
			r, g, b, a,
			r, g, b, a,
		]);
		attribute.needsUpdate = true;
	}
	setFrame(n) {
		if (this.emitter.config.particle_texture_mode === 'full') {
			this.setUV(0, 0, this.emitter.config.particle_texture_size[0], this.emitter.config.particle_texture_size[1])
			return;
		}
		var params = this.params()
		var uv = this.emitter.calculate(this.emitter.config.particle_texture_uv, params)
		var size = this.emitter.calculate(this.emitter.config.particle_texture_uv_size, params)
		if (n) {
			var offset = this.emitter.calculate(this.emitter.config.particle_texture_uv_step, params)
			uv.addScaledVector(offset, n)
		}
		this.setUV(uv.x, uv.y, size.x||this.emitter.config.particle_texture_size[0], size.y||this.emitter.config.particle_texture_size[1])
	}
	setUV(x, y, w, h) {
		var epsilon = 0.0;
		let attribute = this.geometry.getAttribute('uv');

		w = (x+w - 2*epsilon) / this.emitter.config.particle_texture_size[0];
		h = (y+h - 2*epsilon) / this.emitter.config.particle_texture_size[1];
		x = (x + (w>0 ? epsilon : -epsilon)) / this.emitter.config.particle_texture_size[0];
		y = (y + (h>0 ? epsilon : -epsilon)) / this.emitter.config.particle_texture_size[1];

		attribute.array.set([
			x, 1-y,
			w, 1-y,
			x, 1-h,
			w, 1-h,
		]);
		attribute.needsUpdate = true;
	}
}
Wintersky.Particle = Particle;

export default Particle;
