const getCircularReplacer = () => {
const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
};
JSON.stringify(request, getCircularReplacer());



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