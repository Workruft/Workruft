let scene = new THREE.Scene();

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//Directions:
//  -Z    /\+Y
//-X  +X  ||
//  +Z    \/-Y

let fieldOfView = 75;
let aspectRatio = window.innerWidth / window.innerHeight;
let near = 0.1;
let far = 1000;
let camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, near, far);
camera.position.set(0, 0, 30);
camera.lookAt(0, 0, 0);

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
for (let x = -5; x < 5; ++x) {
    for (let y = -5; y < 5; ++y) {
        let customCube = createCustomCube();
        customCube.position.set(x * 2, y * 2, 0);
        customCubes.push(customCube);
        scene.add(customCube);
    }
}

let ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
scene.add(ambientLight);
let directionalLight = new THREE.DirectionalLight('white', 0.5);
directionalLight.position.set(100, 100, 100);
scene.add(directionalLight);


function animate() {
    requestAnimationFrame(animate);
    for (let i = 0; i < customCubes.length; ++i) {
        customCubes[i].rotation.x += 0.01;
        customCubes[i].rotation.y += 0.01;
    }
    renderer.render(scene, camera);
}
animate();



Chat.print({ message: 'Herro!' });
//Chat.clear();

const socket = new WebSocket('ws://localhost:1337');

socket.onopen = function() {
    Chat.print({ message: 'Connected to server!' });
    socket.send(Date.now());
};

socket.onmessage = function(message) {
    Chat.print({ message: 'Server message received: ' + message.data });
};

socket.onclose = function() {
    Chat.print({ message: 'Disconnected from server!' });
};

socket.onerror = function() {
    Chat.print({ message: 'Server connection error encountered!' });
};