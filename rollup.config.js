import image from '@rollup/plugin-image';
import glslify from 'rollup-plugin-glslify';
import { terser } from "rollup-plugin-terser";

const production = !process.env.ROLLUP_WATCH;

export default {
	input: 'src/entry.js',
	output: [
		{
			file: 'dist/wintersky.cjs.js',
			format: 'cjs'
		},
		{
			file: 'dist/wintersky.esm.js',
			format: 'esm'
		},
		{
			name: 'Wintersky',
			file: 'dist/wintersky.umd.js',
			format: 'umd',
			globals: {
				molangjs: 'Molang',
				three: 'THREE',
				tinycolor2: 'tinycolor'
			}
		}
	],
	external: ['molangjs', 'three', 'tinycolor2'],
	plugins: [
		image(),
		glslify(),
		production && terser()
	]
}
