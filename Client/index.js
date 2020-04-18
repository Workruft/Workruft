let scene = new THREE.Scene();

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 30);
camera.lookAt(0, 0, 0);

function createCube() {
    return new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ color: 'green' }));
}
let cubes = [];
for (let x = -5; x < 5; ++x) {
    for (let y = -5; y < 5; ++y) {
        let cube = createCube();
        cube.position.set(x * 2, y * 2, 0);
        cubes.push(cube);
        scene.add(cube);
    }
}

function createLines() {
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-10, 0, 1),
        new THREE.Vector3(0, 10, 1),
        new THREE.Vector3(10, 0, 1)
    ]), new THREE.LineBasicMaterial({ color: 'blue' }));
}
let lines = createLines();
scene.add(lines);

// function createGround() {
//     let groundGeo = new THREE.PlaneBufferGeometry(10000, 10000);
//     let groundMat = new THREE.MeshLambertMaterial({ color: 'white' });
//     groundMat.color.setHSL(0.095, 1, 0.75);
//     let ground = new THREE.Mesh(groundGeo, groundMat);
//     ground.position.y = -33;
//     ground.position.x = -Math.PI / 2;
//     ground.position.z = -5;
//     ground.receiveShadow = true;
//     return ground;
// }
// let ground = createGround();
// scene.add(ground);

function createHemisphereLight() {
    let hemiLight = new THREE.HemisphereLight('white', 'white', 0.6);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    return hemiLight;
}
let hemiLight = createHemisphereLight();
scene.add(hemiLight);

function animate() {
    requestAnimationFrame(animate);
    for (let i = 0; i < cubes.length; ++i) {
        cubes[i].rotation.x += 0.01;
        cubes[i].rotation.y += 0.01;
    }
    renderer.render(scene, camera);
}
animate();

const socket = new WebSocket('ws://localhost:1337');

socket.onopen = function() {
    alert('connected!');
    socket.send(Date.now());
};

socket.onclose = function() {
    alert('disconnected!');
};

socket.onmessage = function(message) {
    alert('message received: ' + message.data + ', ' + message.origin + ', ' + message.lastEventId + ', ' + message.source + ', ' + message.ports);
};