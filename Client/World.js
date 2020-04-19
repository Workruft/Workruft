//Directions:
//  -Z    /\+Y
//-X  +X  ||
//  +Z    \/-Y

class World {
    constructor(chat, onUpdate) {
        this.chat = chat;
        this.onUpdate = onUpdate;
        this.boundGraphicsLoop = this.graphicsLoop.bind(this);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        let fieldOfView = 75;
        let aspectRatio = window.innerWidth / window.innerHeight;
        let near = 0.1;
        let far = 1000;
        this.camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, near, far);
        this.camera.position.set(0, 0, 30);
        this.camera.lookAt(0, 0, 0);

        let cubeGeometry = new THREE.Geometry();
        //Corners:
        //  6----7
        // /|   /|
        //2----3 |
        //| |  | |
        //| 4--|-5
        //|/   |/
        //0----1
        cubeGeometry.vertices.push(
            //In order from 0-7:
            new THREE.Vector3(-1, -1,  1),
            new THREE.Vector3( 1, -1,  1),
            new THREE.Vector3(-1,  1,  1),
            new THREE.Vector3( 1,  1,  1),
            new THREE.Vector3(-1, -1, -1),
            new THREE.Vector3( 1, -1, -1),
            new THREE.Vector3(-1,  1, -1),
            new THREE.Vector3( 1,  1, -1)
        );
        //Faces. Must be in counter-clockwise direction to be facing outside.
        //Each integer is merely referencing a corner vertex.
        cubeGeometry.faces.push(
            //Front.
            new THREE.Face3(0, 3, 2),
            new THREE.Face3(0, 1, 3),
            //Right.
            new THREE.Face3(1, 7, 3),
            new THREE.Face3(1, 5, 7),
            //Back.
            new THREE.Face3(5, 6, 7),
            new THREE.Face3(5, 4, 6),
            //Left.
            new THREE.Face3(4, 2, 6),
            new THREE.Face3(4, 0, 2),
            //Top.
            new THREE.Face3(2, 7, 6),
            new THREE.Face3(2, 3, 7),
            //Bottom.
            new THREE.Face3(4, 1, 0),
            new THREE.Face3(4, 5, 1),
        );
        //For lighting.
        cubeGeometry.computeFaceNormals();
        function createCustomCube() {
            return new THREE.Mesh(cubeGeometry, new THREE.MeshPhongMaterial({ color: 'green' }));
        }
        let customCubes = [];
        for (let x = -5; x <= 5; ++x) {
            for (let y = -5; y <= 5; ++y) {
                let customCube = createCustomCube();
                customCube.position.set(x * 2, y * 2, -10);
                customCubes.push(customCube);
                this.scene.add(customCube);
            }
        }

        function createSphere() {
            return new THREE.Mesh(new THREE.SphereBufferGeometry(1, 15, 15), new THREE.MeshPhongMaterial({ color: 'yellow' }));
        }
        let sphere = createSphere();
        this.scene.add(sphere);

        let ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        this.scene.add(ambientLight);

        let directionalLight = new THREE.DirectionalLight('white', 0.5);
        directionalLight.position.set(100, 100, 100);
        this.scene.add(directionalLight);

        let pointLight = new THREE.PointLight('blue', 5, 20);
        pointLight.position.set(0, 0, 1, 0.5);
        this.scene.add(pointLight);
    }

    graphicsLoop(elapsedTime) {
        this.renderer.render(this.scene, this.camera);
        this.onUpdate(elapsedTime);
        requestAnimationFrame(this.boundGraphicsLoop);
    }
}