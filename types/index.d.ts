import { Object3D } from 'three'

type molang = string

type ConfigVariables = {
	identifier: string
	file_path: string
	curves: object
	space_local_position: boolean
	space_local_rotation: boolean
	space_local_velocity: boolean
	variables_creation_vars: molang[]
	variables_tick_vars: molang[]
	emitter_rate_mode: string
	emitter_rate_rate: molang
	emitter_rate_amount: molang
	emitter_rate_maximum: molang
	emitter_lifetime_mode: string
	emitter_lifetime_active_time: molang
	emitter_lifetime_sleep_time: molang
	emitter_lifetime_activation: molang
	emitter_lifetime_expiration: molang
	emitter_shape_mode: string
	emitter_shape_offset: [molang, molang, molang]
	emitter_shape_radius: molang
	emitter_shape_half_dimensions: [molang, molang, molang]
	emitter_shape_plane_normal: [molang, molang, molang]
	emitter_shape_surface_only: boolean
	particle_appearance_size: [molang, molang]
	particle_appearance_facing_camera_mode: string
	particle_appearance_material: string
	particle_direction_mode: string
	particle_direction_direction: [molang, molang, molang]
	particle_motion_mode: string
	particle_motion_linear_speed: molang
	particle_motion_linear_acceleration: [molang, molang, molang]
	particle_motion_linear_drag_coefficient: molang
	particle_motion_relative_position: [molang, molang, molang]
	particle_motion_direction: [molang, molang, molang]
	particle_rotation_mode: string
	particle_rotation_initial_rotation: molang
	particle_rotation_rotation_rate: molang
	particle_rotation_rotation_acceleration: molang
	particle_rotation_rotation_drag_coefficient: molang
	particle_rotation_rotation: molang
	particle_lifetime_mode: string
	particle_lifetime_max_lifetime: molang
	particle_lifetime_kill_plane: [molang, molang, molang, molang]
	particle_lifetime_expiration_expression: molang
	particle_lifetime_expire_in: string[]
	particle_lifetime_expire_outside: string[]
	particle_texture_size: [number, number]
	particle_texture_path: string
	particle_texture_mode: string
	particle_texture_uv: [molang, molang]
	particle_texture_uv_size: [molang, molang]
	particle_texture_uv_step: [molang, molang]
	particle_texture_frames_per_second: number
	particle_texture_max_frame: molang
	particle_texture_stretch_to_lifetime: boolean
	particle_texture_loop: boolean
	particle_color_mode: string
	particle_color_static: string
	particle_color_interpolant: molang
	particle_color_range: number
	particle_color_gradient: object
	particle_color_expression: [molang, molang, molang, molang]
	particle_color_light: boolean
	particle_collision_enabled: molang
	particle_collision_collision_drag: number
	particle_collision_coefficient_of_restitution: number
	particle_collision_collision_radius: number
	particle_collision_expire_on_contact: boolean
}

type ConfigVariableKey = keyof ConfigVariables
type ConfigTypes = {
	[key in ConfigVariableKey]: ConfigTypeObject
}
type ConfigTypeObject = {
	type: 'string' | 'molang' | 'boolean' | 'number'
	array?: boolean
	dimensions?: number
}

export interface ConfigOptions {
	/**
	 * File path of the particle file
	 */
	path: string
}

export class Config {
	[key: string]: any

	constructor(
		scene: Scene,
		config?: Config | object,
		options?: ConfigOptions
	)

	texture: THREE.Texture
	/**
	 * Resets the config to default values
	 */
	reset(): Config
	/**
	 * Sets a property of the config to a specific value
	 * @param key String Key of the value to change
	 * @param value Any Value to set
	 */
	set(key: string, value: any): Config
	/**
	 * Loads the configuration from a JSON particle file
	 * @param data Parsed JSON particle file
	 */
	setFromJSON(data: object): Config
	/**
	 * Method that runs when the texture of the config is updated. Null by default
	 */
	onTextureUpdate: null | (() => void)

	static types: ConfigTypes
}

export interface EmitterOptions {
	/**
	 * Specifies how the emitter loops
	 */
	loop_mode: 'auto' | 'once' | 'looping'
	/**
	 * Specifies in which space the emitter emits and moves particles
	 */
	parent_mode: 'world' | 'entity' | 'locator'
}

export class Emitter {
	constructor(
		scene: Scene,
		config?: Config,
		options?: EmitterOptions
	)
	config: Config
	loop_mode: 'auto' | 'once' | 'looping'
	parent_mode: 'world' | 'entity' | 'locator'
	local_space: Object3D
	global_space: Object3D
	/**
	 * Delete the emitter
	 */
	delete(): void
	/**
	 * Starts to play the particle effect using the default play loop
	 */
	playLoop(): Emitter
	/**
	 * Pause/resume the default playback loop
	 */
	toggleLoop(): Emitter
	/**
	 * Stops the default playback loop
	 */
	stopLoop(): Emitter
	/**
	 * Starts the emitter, setting the time to 0 and initializing all variables
	 */
	start(): Emitter
	/**
	 * Runs an emitter tick
	 */
	tick(): Emitter
	/**
	 * Stops the emitter
	 * @param clear_particles Whether to clear particles
	 */
	stop(clear_particles: boolean): Emitter
	/**
	 * Jumps to a specific time in the emitter. This is optimited to run as few operations as possible so you can use it to hook the emitter to a custom playback loop
	 * @param time Time in seconds
	 */
	jumpTo(time: number): Emitter
}

export interface GlobalOptions {
	/**
	 * Maximum amount of particles per emitter
	 */
	max_emitter_particles: number
	/**
	 * Emitter tick rate per second.
	 */
	tick_rate: number
	/**
	 * Default emitter loop mode
	 */
	loop_mode: 'auto' | 'once' | 'looping'
	/**
	 * Default emitter parent mode
	 */
	parent_mode: 'world' | 'entity' | 'locator'
	/**
	 * Emitter scale. The default is 1 for block space. Set to 16 to run in a pixel space environment like Blockbench.
	 */
	scale: number
}

export interface WinterskyOptions {
	/**
	 * Method to provide visuals for a texture. Null by default. Gets called by configs if the texture is updated. Should return a data URL.
	 * @param config Particle config that is requesting the texture
	 */
	fetchTexture?: null | ((config: Config) => Promise<string | undefined> | string | undefined)
}

export class Scene {
	public space: Object3D
	/**
	 * Array of all current emitters in the project
	 */
	public emitters: Emitter[]
	public global_options: GlobalOptions

	public static Emitter: typeof Emitter
	public static Config: typeof Config

	constructor(options?: WinterskyOptions)

	/**
	 * Updates the particle facing rotation
	 * @param camera THREE.JS camera to orient the particle towards
	 */
	updateFacingRotation(camera: THREE.Camera): void

	fetchTexture(config: Config): Promise<string | undefined> | string | undefined
}

export as namespace Wintersky
