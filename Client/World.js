//Directions:
//  -Z    /\+Y
//-X  +X  ||
//  +Z    \/-Y

class World {
    constructor(chat, onUpdate) {
        this.chat = chat;
        this.onUpdate = onUpdate;
        this.boundGraphicsLoop = this.graphicsLoop.bind(this);

        //WebGL.
        this.renderer = new THREE.WebGLRenderer();
        this.onResize();
        window.addEventListener('resize', this.onResize);
        document.body.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        //Lights.
        this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.0);
        this.scene.add(this.ambientLight);
        //"Sun".
        this.directionalLight = new THREE.DirectionalLight('white', 1.0);
        this.directionalLight.position.set(0, 100, 0);
        this.scene.add(this.directionalLight);

        //Camera.
        let fieldOfView = 75;
        let near = 0.1;
        let far = 1000;
        this.camera = new THREE.PerspectiveCamera(fieldOfView, this.aspectRatio, near, far);

        //Action.
        // this.customCubes = [];
        // for (let x = -5; x <= 5; ++x) {
        //     for (let y = -5; y <= 5; ++y) {
        //         let customCube = createCustomCube('green');
        //         customCube.position.set(x * 2, y * 2, -10);
        //         this.customCubes.push(customCube);
        //         this.scene.add(customCube);
        //     }
        // }
        this.sphere = createSphere('#777');
        this.sphere.position.y = 5.0;
        this.scene.add(this.sphere);
        this.map = new Map(150, 150);
        this.scene.add(this.map.mesh);
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.aspectRatio = window.innerWidth / window.innerHeight;
    }

    graphicsLoop(elapsedTimeMS) {
        if (elapsedTimeMS == null) {
            elapsedTimeMS = 0.0;
        }
        this.renderer.render(this.scene, this.camera);
        this.onUpdate(elapsedTimeMS);
        requestAnimationFrame(this.boundGraphicsLoop);
    }
}