const View = {};

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
	View.controls.zoomSpeed = 1.4

	View.scene = new THREE.Scene()

	View.helper = new THREE.AxesHelper(1);
	View.grid = new THREE.GridHelper(64, 64, '#aaaaaa', '#cccccc');
	View.grid.position.y -= 0.0005
	View.scene.add(View.helper);
	View.scene.add(View.grid);

	resizeCanvas()
	animate()

	// Initialize Particles
	let content = await new Promise((resolve, reject) => {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', '../examples/trail.particle.json', true);
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
	View.wintersky = new Wintersky.Emitter(content);
	View.scene.add(View.wintersky.group)
	View.wintersky.start()

	setInterval(function() {
		if (!View.wintersky.paused) View.wintersky.tick()
	}, 1000/30)
}

function animate() {
	requestAnimationFrame(animate);
	View.controls.update();
	Wintersky.updateFacingRotation(View.camera);
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
