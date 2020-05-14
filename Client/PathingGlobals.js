Enums.create({
    name: 'CardinalDirections',
    items: [ 'back', 'right', 'front', 'left' ]
});

let CardinalCellOffsetsMap = {
    [Enums.CardinalDirections.back]: [{ offsetX: 0.0, offsetZ: -CellSize }],
    [Enums.CardinalDirections.right]: [{ offsetX: CellSize, offsetZ: 0.0 }],
    [Enums.CardinalDirections.front]: [{ offsetX: 0.0, offsetZ: CellSize }],
    [Enums.CardinalDirections.left]: [{ offsetX: -CellSize, offsetZ: 0.0 }]
};

function AlignToCell(alignMe) {
    return Math.round(alignMe / CellSize) * CellSize;
}

function FloorToCell(alignMe) {
    return Math.floor(alignMe / CellSize) * CellSize;
}

function CeilToCell(alignMe) {
    return Math.ceil(alignMe / CellSize) * CellSize;
}

//Get the closest distance to the cell from a given point.
function CellClosestDistance({ cellX, cellZ, pointX, pointZ }) {
    //Check to see if the point is inside the cell.
    if (pointX >= cellX && pointX <= cellX + CellSize &&
        pointZ >= cellZ && pointZ <= cellZ + CellSize) {
        //Point inside the cell.
        return 0.0;
    } else {
        //Point outside the cell.
        let diffX = cellX - pointX;
        let diffZ = cellZ - pointZ;
        return Math.hypot(
            Math.min(diffX, diffX + CellSize),
            Math.min(diffZ, diffZ + CellSize)
        );
    }
}

//1 means front of a horizontal line, -1 means back, and 0 means on the line.
//1 means left of a vertical line, -1 means right, and 0 means on the line.
function SideOfLine({ line, pointX, pointZ }) {
    //(Line X difference * point Z difference from start of line) -
    //(line Z difference * point X difference from start of line)
    return Math.sign((line.endX - line.startX) * (pointZ - line.startZ) -
        (line.endZ - line.startZ) * (pointX - line.startX));
}

//Mapped by halfXZSize's then by (cardinal) traversalAngle's.
let CardinalPathingLineOffsetsMap = {};
function computePathingLineOffsets({ traversalAngle, halfXZSize }) {
    //Keep the same structure for efficiency.
    const pathingLineOffsets = {
        traversalAngle,
        halfXZSize,
        minusAngle: null,
        plusAngle: null,
        cosMinusAngle: null,
        sinMinusAngle: null,
        cosPlusAngle: null,
        sinPlusAngle: null,
        minusOffsetX: null,
        minusOffsetZ: null,
        plusOffsetX: null,
        plusOffsetZ: null,
        lenientUnitRadius: null,
        lenientMinusOffsetX: null,
        lenientMinusOffsetZ: null,
        lenientPlusOffsetX: null,
        lenientPlusOffsetZ: null
    };
    pathingLineOffsets.minusAngle = traversalAngle - HalfPI;
    pathingLineOffsets.plusAngle = traversalAngle + HalfPI;
    pathingLineOffsets.cosMinusAngle = Math.cos(pathingLineOffsets.minusAngle);
    pathingLineOffsets.sinMinusAngle = Math.sin(pathingLineOffsets.minusAngle);
    pathingLineOffsets.cosPlusAngle = Math.cos(pathingLineOffsets.plusAngle);
    pathingLineOffsets.sinPlusAngle = Math.sin(pathingLineOffsets.plusAngle);
    pathingLineOffsets.minusOffsetX = halfXZSize * pathingLineOffsets.cosMinusAngle;
    pathingLineOffsets.minusOffsetZ = -halfXZSize * pathingLineOffsets.sinMinusAngle;
    pathingLineOffsets.plusOffsetX = halfXZSize * pathingLineOffsets.cosPlusAngle;
    pathingLineOffsets.plusOffsetZ = -halfXZSize * pathingLineOffsets.sinPlusAngle;
    pathingLineOffsets.lenientUnitRadius = halfXZSize - PathTestingLeniency;
    pathingLineOffsets.lenientMinusOffsetX = pathingLineOffsets.lenientUnitRadius *
        pathingLineOffsets.cosMinusAngle;
    pathingLineOffsets.lenientMinusOffsetZ = -pathingLineOffsets.lenientUnitRadius *
        pathingLineOffsets.sinMinusAngle;
    pathingLineOffsets.lenientPlusOffsetX = pathingLineOffsets.lenientUnitRadius *
        pathingLineOffsets.cosPlusAngle;
    pathingLineOffsets.lenientPlusOffsetZ = -pathingLineOffsets.lenientUnitRadius *
        pathingLineOffsets.sinPlusAngle;
    return pathingLineOffsets;
}
for (let halfXZSize of CommonUnitHalfSizes) {
    let innerMap = {};
    CardinalPathingLineOffsetsMap[halfXZSize] = innerMap;
    for (let piRatio = 0.5; piRatio >= -1.0; piRatio -= 0.5) {
        let traversalAngle = GenericRound(Math.PI * piRatio);
        innerMap[traversalAngle] = computePathingLineOffsets({ traversalAngle, halfXZSize });
    }
}