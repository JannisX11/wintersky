import THREE from 'three';

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
	},
	roundTo(num, digits) {
		var d = Math.pow(10,digits)
		return Math.round(num * d) / d
	},
	getRandomEuler() {
		return new THREE.Euler(
			MathUtil.randomab(-Math.PI, Math.PI),
			MathUtil.randomab(-Math.PI, Math.PI),
			MathUtil.randomab(-Math.PI, Math.PI)
		)
	}
}
export default MathUtil;
