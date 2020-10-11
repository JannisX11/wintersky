import * as THREE from 'three';

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

const Normals = {
	x: new THREE.Vector3(1, 0, 0),
	y: new THREE.Vector3(0, 1, 0),
	z: new THREE.Vector3(0, 0, 1),
	n: new THREE.Vector3(0, 0, 0),
}

function removeFromArray(array, item) {
	let index = array.indexOf(item);
	if (index >= 0) {
		array.splice(index, 1);
	}
}



export {
	MathUtil,
	Normals,
	removeFromArray
};
