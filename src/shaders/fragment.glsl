varying vec2 vUv;
varying vec4 vColor;

uniform sampler2D map;
uniform int materialType;

void main(void) {
	
	vec4 tColor = texture2D(map, vUv);

	if (materialType == 0) {
		if (tColor.a < 0.5) discard;
		tColor.a = 1.0;

	} else if (materialType == 1) {
		tColor.a = tColor.a * vColor.a;
		
	} else {
		tColor.a = 1.0;
	}
	
	gl_FragColor = vec4(tColor.rgb * vColor.rgb, tColor.a);
	
}
