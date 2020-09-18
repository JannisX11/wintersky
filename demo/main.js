const View = {};

function initializeApp() {
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
}

function animate() {
	requestAnimationFrame(animate)
	View.controls.update()
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
