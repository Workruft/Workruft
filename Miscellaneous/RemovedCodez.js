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

game.world.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0.0, 0.01, 0.0),
    new THREE.Vector3(CellSize, 0.01, CellSize)
]), new THREE.LineBasicMaterial({ color: 'orange' })));

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

function CalculatePathingStartPoints({ numberOfExtraPoints, traversalAngle, offsetX, offsetZ, radius }) {
    let pathingStartPoints = [];

    let minusAngle = traversalAngle - HalfPI;
    let plusAngle = traversalAngle + HalfPI;
    let minusOffsetX = radius * Math.cos(minusAngle);
    let minusOffsetZ = -radius * Math.sin(minusAngle);
    let plusOffsetX = radius * Math.cos(plusAngle);
    let plusOffsetZ = -radius * Math.sin(plusAngle);
    pathingStartPoints.push({ offsetX: offsetX + minusOffsetX, offsetZ: offsetZ - minusOffsetZ });
    pathingStartPoints.push({ offsetX: offsetX + plusOffsetX, offsetZ: offsetZ - plusOffsetZ });

    let angleHelper = 2.0 / (numberOfExtraPoints + 1.0);
    let currentAngleOffset;
    for (let innerPointNum = 1; innerPointNum <= numberOfExtraPoints; ++innerPointNum) {
        currentAngleOffset = plusAngle - Math.acos(1.0 - innerPointNum * angleHelper);
        pathingStartPoints.push({
            offsetX: offsetX + radius * Math.cos(currentAngleOffset),
            offsetZ: offsetZ - radius * Math.sin(currentAngleOffset)
        });
    }

    return pathingStartPoints;
}

//Calculate unit traversal offsets for each unit size for cardinal path finding navigation.
let UnitTraversalOffsetsMap = {};
function ComputeTraversalOffsets({ unitRadius, traversalAngle }) {
    let traversalOffsets = {
        offsetX: GenericRound(unitRadius * Math.cos(traversalAngle)),
        offsetZ: GenericRound(-unitRadius * Math.sin(traversalAngle)),
        cellOffsets: null
    };
    traversalOffsets.cellOffsets = CalculatePathingStartPoints({
        numberOfExtraPoints: Math.ceil(unitRadius * 2.0 / CellSize) + 2,
        traversalAngle,
        offsetX: traversalOffsets.offsetX,
        offsetZ: traversalOffsets.offsetZ,
        radius: unitRadius
    });
    return traversalOffsets;
}
function GetOrCreateTraversalOffsets({ unitRadius }) {
    if (IsUndefined(UnitTraversalOffsetsMap[unitRadius])) {
        UnitTraversalOffsetsMap[unitRadius] = {
            [Enums.CardinalDirections.back]: ComputeTraversalOffsets({
                unitRadius, traversalAngle: Math.PI * 0.5
            }),
            [Enums.CardinalDirections.right]: ComputeTraversalOffsets({
                unitRadius, traversalAngle: 0.0
            }),
            [Enums.CardinalDirections.front]: ComputeTraversalOffsets({
                unitRadius, traversalAngle: Math.PI * 1.5
            }),
            [Enums.CardinalDirections.left]: ComputeTraversalOffsets({
                unitRadius, traversalAngle: Math.PI
            })
        };
    }
    return UnitTraversalOffsetsMap[unitRadius];
}


/* cursor: url('Icons/icons8-ramp-32.png'), default; */




window.ForEachBorderCell = function(workruft, cellX, cellZ, latSize, longSize, callback) {
    let forEachObject = {
        halfLatSize: latSize * 0.5,
        halfLongSize: longSize * 0.5
    };
    forEachObject.floorHalfLatSize = FloorToCell(forEachObject.halfLatSize);
    forEachObject.ceilHalfLatSize = CeilToCell(forEachObject.halfLatSize);
    forEachObject.floorHalfLongSize = FloorToCell(forEachObject.halfLongSize);
    forEachObject.ceilHalfLongSize = CeilToCell(forEachObject.halfLongSize);
    //Border rows (except corners).
    for (forEachObject.xOffset = -forEachObject.floorHalfLatSize + CellSize;
        forEachObject.xOffset < forEachObject.ceilHalfLatSize;
        forEachObject.xOffset += CellSize) {
        for (forEachObject.zOffset = -forEachObject.floorHalfLongSize;
            forEachObject.zOffset < forEachObject.ceilHalfLongSize;
            forEachObject.zOffset += longSize - CellSize) {
            callback(forEachObject);
        }
    }
    //Border columns (except corners).
    for (forEachObject.zOffset = -forEachObject.floorHalfLongSize + CellSize;
        forEachObject.zOffset < forEachObject.ceilHalfLongSize;
        forEachObject.zOffset += CellSize) {
        for (forEachObject.xOffset = -forEachObject.floorHalfLatSize;
            forEachObject.xOffset < forEachObject.ceilHalfLatSize;
            forEachObject.xOffset += latSize - CellSize) {
            callback(forEachObject);
        }
    }
    //Corners.
    for (forEachObject.xOffset = -forEachObject.floorHalfLatSize;
        forEachObject.xOffset < forEachObject.ceilHalfLatSize;
        forEachObject.xOffset += latSize) {
        for (forEachObject.zOffset = -forEachObject.floorHalfLongSize;
            forEachObject.zOffset < forEachObject.ceilHalfLongSize;
            forEachObject.zOffset += longSize - CellSize) {
            callback(forEachObject);
        }
    }
    return forEachObject;
};