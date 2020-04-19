let cubeGeometry = new THREE.Geometry();
//Corners:
//    Top
//  6----7
// /|   /|
//2----3 | Right
//| |  | |
//| 4--|-5
//|/   |/ Right
//0----1
//Front
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
function createCustomCube(color) {
    return new THREE.Mesh(cubeGeometry,
        new THREE.MeshPhongMaterial({ color }));
}

function createSphere(color) {
    return new THREE.Mesh(
        new THREE.SphereBufferGeometry(1, 15, 15),
        new THREE.MeshPhongMaterial({ color }));
}