let CellSize = 1.0;
let HalfCellSize = CellSize * 0.5;
let QuarterCellSize = HalfCellSize * 0.5;
let ThreeHalvesCellSize = CellSize * 1.5;
let DoubleCellSize = CellSize * 2.0;

let HalfTinySize = CellSize;
let TinySize = DoubleCellSize;
let SmallSize = TinySize * 2.0;
let BigSize = SmallSize * 2.0;

let SelectionExtraRadius = QuarterCellSize;

let MapBottomY = 0.0;
let MapMinimumHeight = 0.0;

let MinCameraHeight = 3.0;
let MaxCameraHeight = 500.0;

let GrassColor = new THREE.Color('#0c4013');
let DirtColor = new THREE.Color('#2b3c1f');
let RedColor = new THREE.Color('red');
let BlueColor = new THREE.Color('blue');

let HalfPI = Math.PI * 0.5;

Enums.create({
    name: 'CardinalDirections',
    items: [ 'back', 'right', 'front', 'left' ]
});

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

// Store all of the HTML DOM elements in the body of the page as an HTMLCollection.
// Any element with an ID can now simply be accessed by HTML.theID or HTML['theID'].
// This HTMLCollection can also be iterated through, via.: for (... of ...) { }.
// Note that this HTMLCollection is live/dynamic, it changes in sync with the DOM.
// If accessing HTML elements by class, use:
// Array.from(document.getElementsByClassName('className')).forEach(function (className) {
let HTML = document.body.getElementsByTagName('*');

//Make sure to delete it as well!
function DisposeThreeObject(disposeMe) {
    if (disposeMe == null) {
        return;
    }
    if (disposeMe.parent) {
        disposeMe.parent.remove(disposeMe);
    }
    if (disposeMe.dispose) {
        disposeMe.dispose();
    }
}

function IsUndefined(checkMe) {
    return typeof checkMe == 'undefined';
}

function IsDefined(checkMe) {
    return typeof checkMe !== 'undefined';
}

function GenericRound(roundMe) {
    return Math.round(roundMe / 0.001) * 0.001;
}

function AlignToCell(alignMe) {
    return Math.round(alignMe / CellSize) * CellSize;
}

function FloorToCell(alignMe) {
    return Math.floor(alignMe / CellSize) * CellSize;
}

function FloorToNextCell(alignMe) {
    return Math.floor(alignMe / CellSize + 1.0) * CellSize;
}

//1 means front of a horizontal line, -1 means back, and 0 means on the line.
//1 means left of a vertical line, -1 means right, and 0 means on the line.
function SideOfLine({ startX, startZ, endX, endZ, pointX, pointZ }) {
    //(Line X difference * point Z difference from start of line) -
    //(line Z difference * point X difference from start of line)
    return Math.sign((endX - startX) * (pointZ - startZ) - (endZ - startZ) * (pointX - startX));
}

function LimitDistance({ startX, startZ, endX, endZ, maxDistance }) {
    let limitedX;
    let limitedZ;
    let limitedDistance;
    let fullXDistance = endX - startX;
    let fullZDistance = endZ - startZ;
    let distance = Math.hypot(fullXDistance, fullZDistance);
    let fullManhattanDistance = Math.abs(fullXDistance) + Math.abs(fullZDistance);
    if (distance < maxDistance) {
        //Closer to the destination than the maximum distance.
        limitedX = endX;
        limitedZ = endZ;
        limitedDistance = distance;
    } else {
        //Travel at the maximum distance.
        limitedX = startX + maxDistance * fullXDistance / fullManhattanDistance;
        limitedZ = startZ + maxDistance * fullZDistance / fullManhattanDistance;
        limitedDistance = maxDistance;
    }
    return { limitedX, limitedZ, limitedDistance, fullXDistance, fullZDistance, fullManhattanDistance };
}

//Starts at the first cell past the starting cell towards the end position if any.
//Yields the direction of the cell from the previous cell. Every cell traveled is
//guaranteed to be in one of the 4 cardinal directions from the previous cell.
function* IntersectLineWithGrid({ startX, startZ, endX, endZ }) {
    let cellX = FloorToCell(startX);
    let cellZ = FloorToCell(startZ);
    let diffX = endX - startX;
    let diffZ = endZ - startZ;
    let xDirection = (Math.sign(diffX) >= 0 ? Enums.CardinalDirections.right : Enums.CardinalDirections.left);
    let yDirection = (Math.sign(diffZ) >= 0 ? Enums.CardinalDirections.front : Enums.CardinalDirections.back);

    //Straight distance to the first vertical grid boundary.
    let xOffset = endX > startX ?
        (FloorToNextCell(startX) - startX) :
        (startX - cellX);
    //Straight distance to the first horizontal grid boundary.
    let yOffset = endZ > startZ ?
        (FloorToNextCell(startZ) - startZ) :
        (startZ - cellZ);
    //Angle of ray/slope.
    let angle = Math.atan2(-diffZ, diffX);
    //Note: These can be divide by 0's, but JS just yields Infinity! :)
    //How far to move along the ray to cross the first vertical grid cell boundary.
    let tMaxX = xOffset / Math.cos(angle);
    //How far to move along the ray to cross the first horizontal grid cell boundary.
    let tMaxZ = yOffset / Math.sin(angle);
    //How far to move along the ray to move horizontally 1 grid cell.
    let tDeltaX = CellSize / Math.cos(angle);
    //How far to move along the ray to move vertically 1 grid cell.
    let tDeltaZ = CellSize / Math.sin(angle);

    //Travel one grid cell at a time.
    let manhattanDistance = Math.abs(FloorToCell(endX) - cellX) +
        Math.abs(FloorToCell(endZ) - cellZ);
    for (let t = 0; t < manhattanDistance; ++t) {
        //Only move in either X or Z coordinates, not both.
        if (Math.abs(tMaxX) < Math.abs(tMaxZ)) {
            tMaxX += tDeltaX;
            yield xDirection;
        } else {
            tMaxZ += tDeltaZ;
            yield yDirection;
        }
    }
}

//Calculate unit traversal offsets for each unit size for cardinal path finding navigation.
let UnitTraversalOffsetsMap = {};
function ComputeTraversalOffsets({ unitRadius, traversalAngle }) {
    let traversalOffsets = {
        offsetX: GenericRound(unitRadius * Math.cos(traversalAngle)),
        offsetZ: GenericRound(-unitRadius * Math.sin(traversalAngle)),
        cellOffsets: []
    };
    let numberOfCells = Math.max(2, Math.round(unitRadius * 2.0 / CellSize));
    let angleInterval = Math.PI / (numberOfCells - 1.0);
    let currentAngleOffset;
    for (let cellIndex = 0; cellIndex < numberOfCells; ++cellIndex) {
        currentAngleOffset = cellIndex * angleInterval;
        traversalOffsets.cellOffsets.push({
            offsetX: GenericRound(unitRadius * Math.cos(traversalAngle - HalfPI + currentAngleOffset)),
            offsetZ: GenericRound(-unitRadius * Math.sin(traversalAngle - HalfPI + currentAngleOffset))
        });
    }
    return traversalOffsets;
}
function GetOrCreateTraversal({ unitRadius }) {
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

//Create path-testing lines. The first two lines start and end at the outermost points of the circle
//parallel to the slope of the unit's trajectory. The inner lines start at the front of the starting
//circle and end at the back of the ending circle, evenly distributed according to the number of
//extra pathing lines.
function ComputePathTestingLines({ startX, startZ, endX, endZ, traversalAngle, unitRadius,
    numberOfExtraPathingLines, worldMap }) {
    let minusAngle = traversalAngle - HalfPI;
    let plusAngle = traversalAngle + HalfPI;
    let minusOffsetX = unitRadius * Math.cos(minusAngle);
    let minusOffsetZ = -unitRadius * Math.sin(minusAngle);
    let plusOffsetX = unitRadius * Math.cos(plusAngle);
    let plusOffsetZ = -unitRadius * Math.sin(plusAngle);
    //Outermost points.
    let firstPathingLine = {
        startX: startX + minusOffsetX,
        startZ: startZ + minusOffsetZ,
        endX: endX + minusOffsetX,
        endZ: endZ + minusOffsetZ,
        innerDirections: [],
        intersection: {
            currentCellsPathable: 0,
            currentCell: null,
            generator: null,
            intersectionResult: null,
            isObstructed: false
        }
    };
    let lastPathingLine = {
        startX: startX + plusOffsetX,
        startZ: startZ + plusOffsetZ,
        endX: endX + plusOffsetX,
        endZ: endZ + plusOffsetZ,
        innerDirections: [],
        intersection: {
            currentCellsPathable: 0,
            currentCell: null,
            generator: null,
            intersectionResult: null,
            isObstructed: false
        }
    };
    let pathingLines = new Set();
    pathingLines.add(firstPathingLine);
    //Add any inner points.
    if (numberOfExtraPathingLines > 0) {
        let angleInterval = Math.PI / (numberOfExtraPathingLines + 1.0);
        let currentAngleOffset;
        for (let extraPathingLineNum = 1; extraPathingLineNum <= numberOfExtraPathingLines; ++extraPathingLineNum) {
            currentAngleOffset = extraPathingLineNum * angleInterval;
            pathingLines.add({
                startX: startX + unitRadius * Math.cos(minusAngle + currentAngleOffset),
                startZ: startZ - unitRadius * Math.sin(minusAngle + currentAngleOffset),
                endX: endX + unitRadius * Math.cos(minusAngle + currentAngleOffset),
                endZ: endZ - unitRadius * Math.sin(minusAngle + currentAngleOffset),
                innerDirections: [],
                intersection: {
                    currentCellsPathable: 0,
                    currentCell: null,
                    generator: null,
                    intersectionResult: null,
                    isObstructed: false
                }
            });
        }
    }
    pathingLines.add(lastPathingLine);
    for (let pathingLine of pathingLines) {
        pathingLine.intersection.currentCell = worldMap.getCell({
            x: FloorToCell(pathingLine.startX),
            z: FloorToCell(pathingLine.startZ)
        });

        //If you can fit a cell on any cardinal side of the line and have it still
        //fit inside the outermost lines, then always path test in that direction.
        for (let cardinalDirection = 0; cardinalDirection < Enums.CardinalDirections.length; ++cardinalDirection) {
            let allPointsFit = true;
            for (let cellOffsetPoint of CardinalCellOffsetsMap[cardinalDirection]) {
                let side1 = SideOfLine({
                    startX: firstPathingLine.startX,
                    startZ: firstPathingLine.startZ,
                    endX: firstPathingLine.endX,
                    endZ: firstPathingLine.endZ,
                    pointX: pathingLine.startX + cellOffsetPoint.offsetX,
                    pointZ: pathingLine.startZ + cellOffsetPoint.offsetZ
                });
                let side2 = SideOfLine({
                    startX: lastPathingLine.startX,
                    startZ: lastPathingLine.startZ,
                    endX: lastPathingLine.endX,
                    endZ: lastPathingLine.endZ,
                    pointX: pathingLine.startX + cellOffsetPoint.offsetX,
                    pointZ: pathingLine.startZ + cellOffsetPoint.offsetZ
                });
                if (side1 != 0 && side2 != 0 && side1 != side2 * -1) {
                    allPointsFit = false;
                    break;
                }
            }
            if (allPointsFit) {
                pathingLine.innerDirections.push(cardinalDirection);
            }
        }

        pathingLine.intersection.generator = IntersectLineWithGrid({
            startX: pathingLine.startX, startZ: pathingLine.startZ,
            endX: pathingLine.endX, endZ: pathingLine.endZ
        });
    }
    return pathingLines;
}
//Test linear pathing for a unit and return the findings.
function ComputeMinPathable({ startX, startZ, endX, endZ, traversalAngle, unitRadius,
    numberOfExtraPathingLines, worldMap }) {
    let pathingLines = ComputePathTestingLines({
        startX, startZ, endX, endZ, traversalAngle, unitRadius, numberOfExtraPathingLines, worldMap
    });
    //Check every cell that each of the lines intersects with, to see how many cells away from the unit are pathable.
    let minPathable = {
        cellCount: Infinity,
        pathingLine: null,
        obstructedCell: null
    };
    let direction;
    let isCellTraversible;
    let pathingLinesToDelete = new Set();
    //Check one pathing line at a time, one cell at a time, in sync.
    do {
        for (let pathingLine of pathingLines) {
            pathingLine.intersection.intersectionResult = pathingLine.intersection.generator.next();
            if (pathingLine.intersection.intersectionResult.done || pathingLine.intersection.isObstructed) {
                pathingLinesToDelete.add(pathingLine);
                continue;
            }
            direction = pathingLine.intersection.intersectionResult.value;
            isCellTraversible = worldMap.isTraversible({
                cell: pathingLine.intersection.currentCell,
                direction
            });
            if (isCellTraversible) {
                for (let innerDirection of pathingLine.innerDirections) {
                    isCellTraversible = worldMap.isTraversible({
                        cell: pathingLine.intersection.currentCell,
                        direction: innerDirection
                    });
                    if (!isCellTraversible) {
                        break;
                    }
                }
            }
            if (isCellTraversible) {
                //Still pathable.
                // pathingLine.intersection.currentCell.faces.top[0].color = BlueColor;
                // pathingLine.intersection.currentCell.faces.top[1].color = BlueColor;
                pathingLine.intersection.currentCell = pathingLine.intersection.currentCell.neighbors[direction];
                ++pathingLine.intersection.currentCellsPathable;
            } else {
                //Obstruction found!
                if (IsDefined(window.redz)) {
                    window.redz.faces.top[0].color = GrassColor;
                    window.redz.faces.top[1].color = GrassColor;
                }
                window.redz = pathingLine.intersection.currentCell;
                pathingLine.intersection.currentCell.faces.top[0].color = RedColor;
                pathingLine.intersection.currentCell.faces.top[1].color = RedColor;
                if (pathingLine.intersection.currentCellsPathable < minPathable.cellCount) {
                    minPathable.cellCount = pathingLine.intersection.currentCellsPathable;
                    minPathable.pathingLine = pathingLine;
                    minPathable.obstructedCell = pathingLine.intersection.currentCell.neighbors[direction];
                }
                pathingLine.intersection.isObstructed = true;
                break;
            }
        }
        for (let pathingLine of pathingLinesToDelete) {
            pathingLines.delete(pathingLine);
        }
        pathingLinesToDelete.clear();
    } while (pathingLines.size > 0);
    worldMap.geometry.elementsNeedUpdate = true;
    return minPathable;
}