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

let SquareGeometry = new THREE.ShapeBufferGeometry(new THREE.Shape([
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(CellSize, 0.0),
    new THREE.Vector2(CellSize, CellSize),
    new THREE.Vector2(0.0, CellSize)
]));



let CardinalCellOffsetsDistance = CellSize;
let DoubleCardinalCellOffsetsDistance = CardinalCellOffsetsDistance * 2.0;
let CardinalCellOffsetsMap = {
    [Enums.CardinalDirections.back]: [
        { offsetX: 0.0, offsetZ: -CardinalCellOffsetsDistance },
        { offsetX: CardinalCellOffsetsDistance, offsetZ: -CardinalCellOffsetsDistance },
        { offsetX: CardinalCellOffsetsDistance, offsetZ: 0.0 },
        { offsetX: 0.0, offsetZ: 0.0 }
    ],
    [Enums.CardinalDirections.right]: [
        { offsetX: CardinalCellOffsetsDistance, offsetZ: 0.0 },
        { offsetX: DoubleCardinalCellOffsetsDistance, offsetZ: 0.0 },
        { offsetX: DoubleCardinalCellOffsetsDistance, offsetZ: CardinalCellOffsetsDistance },
        { offsetX: CardinalCellOffsetsDistance, offsetZ: CardinalCellOffsetsDistance }
    ],
    [Enums.CardinalDirections.front]: [
        { offsetX: 0.0, offsetZ: CardinalCellOffsetsDistance },
        { offsetX: CardinalCellOffsetsDistance, offsetZ: CardinalCellOffsetsDistance },
        { offsetX: CardinalCellOffsetsDistance, offsetZ: DoubleCardinalCellOffsetsDistance },
        { offsetX: 0.0, offsetZ: DoubleCardinalCellOffsetsDistance }
    ],
    [Enums.CardinalDirections.left]: [
        { offsetX: -CardinalCellOffsetsDistance, offsetZ: 0.0 },
        { offsetX: 0.0, offsetZ: 0.0 },
        { offsetX: 0.0, offsetZ: CardinalCellOffsetsDistance },
        { offsetX: -CardinalCellOffsetsDistance, offsetZ: CardinalCellOffsetsDistance }
    ]
};