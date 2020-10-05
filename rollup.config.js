import image from '@rollup/plugin-image';

export default {
	input: 'src/wintersky.js',
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
	plugins: [image()]
}
