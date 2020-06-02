Enums.create({
    name: 'CardinalDirections',
    items: [ 'back', 'right', 'front', 'left' ]
});

window.CardinalCellOffsetsMap = {
    [Enums.CardinalDirections.back]: [{ offsetX: 0.0, offsetZ: -CellSize }],
    [Enums.CardinalDirections.right]: [{ offsetX: CellSize, offsetZ: 0.0 }],
    [Enums.CardinalDirections.front]: [{ offsetX: 0.0, offsetZ: CellSize }],
    [Enums.CardinalDirections.left]: [{ offsetX: -CellSize, offsetZ: 0.0 }]
};

window.AlignToCell = function(alignMe) {
    return Math.round(alignMe / CellSize) * CellSize;
};

window.FloorToCell = function(alignMe) {
    return Math.floor(alignMe / CellSize) * CellSize;
};

window.CeilToCell = function(alignMe) {
    return Math.ceil(alignMe / CellSize) * CellSize;
};

//Get the closest distance to the cell from a given point.
window.CellClosestDistance = function({ cellX, cellZ, pointX, pointZ }) {
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
};

//1 means front of a horizontal line, -1 means back, and 0 means on the line.
//1 means left of a vertical line, -1 means right, and 0 means on the line.
window.SideOfLine = function({ line, pointX, pointZ }) {
    //(Line X difference * point Z difference from start of line) -
    //(line Z difference * point X difference from start of line)
    return Math.sign((line.endX - line.startX) * (pointZ - line.startZ) -
        (line.endZ - line.startZ) * (pointX - line.startX));
};

window.CalculateNumberOfExtraPathingLines = function({ xzSize }) {
    return Math.max(0, Math.round(xzSize / CellSize));
};

//Mapped by halfXZSize's then by (cardinal) traversalAngle's.
window.CardinalPathingLineOffsetsMap = {};
window.ComputePathingLineOffsets = function({
    traversalAngle, xDistance, zDistance, halfXZSize, numberOfExtraPathingLines
}) {
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
        lenientPlusOffsetZ: null,
        firstBoundingLine: null,
        lastBoundingLine: null,
        lines: []
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

    //Outermost bounds, without any leniency.
    pathingLineOffsets.firstBoundingLine = {
        startX: pathingLineOffsets.minusOffsetX,
        startZ: pathingLineOffsets.minusOffsetZ,
        endX: pathingLineOffsets.minusOffsetX + xDistance,
        endZ: pathingLineOffsets.minusOffsetZ + zDistance
    };
    pathingLineOffsets.lastBoundingLine = {
        startX: pathingLineOffsets.plusOffsetX,
        startZ: pathingLineOffsets.plusOffsetZ,
        endX: pathingLineOffsets.plusOffsetX + xDistance,
        endZ: pathingLineOffsets.plusOffsetZ + zDistance
    };

    pathingLineOffsets.lines.push([
        //X offset.
        pathingLineOffsets.lenientMinusOffsetX,
        //Z offset.
        pathingLineOffsets.lenientMinusOffsetZ,
        //Inner directions.
        []
    ]);
    //Add any inner line offsets.
    if (numberOfExtraPathingLines > 0) {
        let angleHelper = 2.0 / (numberOfExtraPathingLines + 1.0);
        let currentAngleOffset;
        for (let extraPathingLineNum = 1; extraPathingLineNum <= numberOfExtraPathingLines;
            ++extraPathingLineNum) {
            currentAngleOffset = pathingLineOffsets.plusAngle - Math.acos(1.0 - extraPathingLineNum * angleHelper);
            //Don't use leniency for the inner lines!
            pathingLineOffsets.lines.push([
                //X offset.
                pathingLineOffsets.halfXZSize * Math.cos(currentAngleOffset),
                //Z offset.
                -pathingLineOffsets.halfXZSize * Math.sin(currentAngleOffset),
                []
                //Inner directions.
            ]);
        }
    }
    pathingLineOffsets.lines.push([
        //X offset.
        pathingLineOffsets.lenientPlusOffsetX,
        //Z offset.
        pathingLineOffsets.lenientPlusOffsetZ,
        //Inner directions.
        []
    ]);

    let side1;
    let side2;
    let allPointsFit;
    for (let line of pathingLineOffsets.lines) {
        //If you can fit a cell on any cardinal side of the line and have it still
        //fit inside the outermost lines, then always path test in that currentDirection.
        for (let cardinalDirection = 0; cardinalDirection < Enums.CardinalDirections.length; ++cardinalDirection) {
            allPointsFit = true;
            for (let cellOffsetPoint of CardinalCellOffsetsMap[cardinalDirection]) {
                side1 = SideOfLine({
                    line: pathingLineOffsets.firstBoundingLine,
                    pointX: line[0] + cellOffsetPoint.offsetX,
                    pointZ: line[1] + cellOffsetPoint.offsetZ
                });
                side2 = SideOfLine({
                    line: pathingLineOffsets.lastBoundingLine,
                    pointX: line[0] + cellOffsetPoint.offsetX,
                    pointZ: line[1] + cellOffsetPoint.offsetZ
                });
                if (side1 != 0 && side2 != 0 && side1 != side2 * -1) {
                    allPointsFit = false;
                    break;
                }
            }
            if (allPointsFit) {
                line[2].push(cardinalDirection);
            }
        }
    }

    return pathingLineOffsets;
};
for (let halfXZSize of CommonUnitHalfSizes) {
    let innerMap = {};
    CardinalPathingLineOffsetsMap[halfXZSize] = innerMap;
    for (let piRatio = 0.5; piRatio >= -1.0; piRatio -= 0.5) {
        let traversalAngle = GenericRound(Math.PI * piRatio);
        innerMap[traversalAngle] = ComputePathingLineOffsets({
            traversalAngle,
            xDistance: Math.cos(traversalAngle),
            zDistance: -Math.sin(traversalAngle),
            halfXZSize,
            numberOfExtraPathingLines: CalculateNumberOfExtraPathingLines({ xzSize: halfXZSize * 2.0 })
        });
    }
}