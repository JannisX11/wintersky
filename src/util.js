import * as THREE from 'three';

export const MathUtil = {
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

export function getRandomFromWeightedList(list) {
	let total_weight = list.reduce((sum, option) => sum + option.weight || 1, 0);
	let random_value = Math.random() * total_weight;
	let cumulative_weight = 0;
	for (let option of list) {
		cumulative_weight += (option.weight || 1);
		if (random_value <= cumulative_weight) {
			return option;
		}
	}
}

export const Normals = {
	x: new THREE.Vector3(1, 0, 0),
	y: new THREE.Vector3(0, 1, 0),
	z: new THREE.Vector3(0, 0, 1),
	n: new THREE.Vector3(0, 0, 0),
}

export function removeFromArray(array, item) {
	let index = array.indexOf(item);
	if (index >= 0) {
		array.splice(index, 1);
	}
}

