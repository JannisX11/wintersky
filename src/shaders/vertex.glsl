attribute vec4 clr;

varying vec2 vUv;
varying vec4 vColor;

void main() {

	vColor = clr;
	vUv = uv;
	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	gl_Position = projectionMatrix * mvPosition;

}
