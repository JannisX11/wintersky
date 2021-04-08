const View = {};

async function loadJSON(path) {
	let content = await new Promise((resolve, reject) => {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', path, true);
		xhr.responseType = 'json';
		xhr.onload = function() {
			var status = xhr.status;
			if (status === 200) {
				resolve(xhr.response);
			} else {
				reject(xhr.response);
			}
		};
		xhr.send();
	})
	return content;
}

async function initializeApp() {
	View.canvas = document.getElementById('preview')
	View.camera = new THREE.PerspectiveCamera(45, 16/9, 0.1, 3000);
	View.camera.position.set(-6, 3, -6)
	View.renderer = new THREE.WebGLRenderer({
		canvas: View.canvas,
		antialias: true,
		alpha: true,
		preserveDrawingBuffer: true,
	})

	View.controls = new THREE.OrbitControls(View.camera, View.canvas);
	View.controls.target.set(0, 0.8, 0)
	View.controls.screenSpacePanning = true;
	View.controls.zoomSpeed = 1.4;

	View.scene = new THREE.Scene()

	View.helper = new THREE.AxesHelper(1);
	View.grid = new THREE.GridHelper(64, 64, '#aaaaaa', '#cccccc');
	View.grid.position.y -= 0.0005
	View.scene.add(View.helper);
	View.scene.add(View.grid);

	resizeCanvas()
	

	// Initialize Particles
	let content = await loadJSON('../examples/rainbow.particle.json');

	View.wintersky = new Wintersky()
	View.emitter = new Wintersky.Emitter(View.wintersky, content);
	View.scene.add(View.wintersky.space);

	animate();
	View.emitter.playLoop();
}

function animate() {
	requestAnimationFrame(animate);
	View.controls.update();
	// Update Particle facing rotation
	View.wintersky.updateFacingRotation(View.camera);
	// Render
	View.renderer.render(View.scene, View.camera);
}

function resizeCanvas() {
	var wrapper = View.canvas.parentNode;
	var height = wrapper.clientHeight
	var width = wrapper.clientWidth

	View.camera.aspect = width/height;
	View.camera.updateProjectionMatrix();

	View.renderer.setSize(width, height);
	View.renderer.setPixelRatio(window.devicePixelRatio);
}

window.addEventListener('resize', resizeCanvas, false);
