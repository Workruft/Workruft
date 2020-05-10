//A helper class to test pathing with.
//This class is designed to promote reusability.
class PathingTester {
    constructor({ map, gameModel }) {
        this.map = map;
        this.gameModel = gameModel;
    }

    setEnds({ startX, startZ, endX, endZ }) {
        this.startX = startX;
        this.startZ = startZ;
        this.endX = endX;
        this.endZ = endZ;
        this.unlimitedEndX = endX;
        this.unlimitedEndZ = endZ;
        this.xDistance = this.endX - this.startX;
        this.zDistance = this.endZ - this.startZ;
    }

    limitDistance({ maxDistance }) {
        this.maxDistance = maxDistance;
        this.euclidianDistance = Math.hypot(this.xDistance, this.zDistance);
        this.manhattanDistance = Math.abs(this.xDistance) + Math.abs(this.zDistance);
        if (this.euclidianDistance < this.maxDistance) {
            //Closer to the destination than the maximum distance.
            this.endX = this.unlimitedEndX;
            this.endZ = this.unlimitedEndZ;
            this.limitedDistance = this.euclidianDistance;
        } else {
            //Travel at the maximum distance.
            this.endX = this.startX + this.maxDistance * this.xDistance / this.manhattanDistance;
            this.endZ = this.startZ + this.maxDistance * this.zDistance / this.manhattanDistance;
            this.xDistance = this.endX - this.startX;
            this.zDistance = this.endZ - this.startZ;
            this.limitedDistance = this.maxDistance;
        }
    }

    //Create path-testing lines. The first two lines start and end at the outermost points of the circle
    //parallel to the slope of the unit's trajectory. The inner lines start at the front of the starting
    //circle and end at the back of the ending circle, evenly distributed according to the number of
    //extra pathing lines.
    computePathingLines() {
        this.traversalAngle = Math.atan2(-this.zDistance, this.xDistance);

        //TODO: Precompute cardinal offsets. Pass in an offsets object/class instance.
        //TODO: Only compute offsets when traversalAngle changes (can have different ends same traversalAngle).
        let minusAngle = this.traversalAngle - HalfPI;
        let plusAngle = this.traversalAngle + HalfPI;
        let cosMinusAngle = Math.cos(minusAngle);
        let sinMinusAngle = Math.sin(minusAngle);
        let cosPlusAngle = Math.cos(plusAngle);
        let sinPlusAngle = Math.sin(plusAngle);
        let minusOffsetX = this.gameModel.halfXZSize * cosMinusAngle;
        let minusOffsetZ = -this.gameModel.halfXZSize * sinMinusAngle;
        let plusOffsetX = this.gameModel.halfXZSize * cosPlusAngle;
        let plusOffsetZ = -this.gameModel.halfXZSize * sinPlusAngle;
        let lenientUnitRadius = this.gameModel.halfXZSize - PathTestingLeniency;
        let lenientMinusOffsetX = lenientUnitRadius * cosMinusAngle;
        let lenientMinusOffsetZ = -lenientUnitRadius * sinMinusAngle;
        let lenientPlusOffsetX = lenientUnitRadius * cosPlusAngle;
        let lenientPlusOffsetZ = -lenientUnitRadius * sinPlusAngle;

        //Outermost bounds, without any leniency.
        let firstBoundingLine = {
            startX: this.startX + minusOffsetX,
            startZ: this.startZ + minusOffsetZ,
            endX: this.endX + minusOffsetX,
            endZ: this.endZ + minusOffsetZ
        };
        let lastBoundingLine = {
            startX: this.startX + plusOffsetX,
            startZ: this.startZ + plusOffsetZ,
            endX: this.endX + plusOffsetX,
            endZ: this.endZ + plusOffsetZ
        };

        this.pathingLines = new Set();
        this.pathingLines.add(new PathingLine({
            startX: this.startX + lenientMinusOffsetX,
            startZ: this.startZ + lenientMinusOffsetZ,
            endX: this.endX + lenientMinusOffsetX,
            endZ: this.endZ + lenientMinusOffsetZ
        }));
        //Add any inner points.
        if (this.gameModel.numberOfExtraPathingLines > 0) {
            let angleHelper = 2.0 / (this.gameModel.numberOfExtraPathingLines + 1.0);
            let currentAngleOffset;
            let currentXOffset;
            let currentZOffset;
            for (let extraPathingLineNum = 1; extraPathingLineNum <= this.gameModel.numberOfExtraPathingLines;
                ++extraPathingLineNum) {
                currentAngleOffset = plusAngle - Math.acos(1.0 - extraPathingLineNum * angleHelper);
                currentXOffset = lenientUnitRadius * Math.cos(currentAngleOffset);
                currentZOffset = -lenientUnitRadius * Math.sin(currentAngleOffset);
                this.pathingLines.add(new PathingLine({
                    startX: this.startX + currentXOffset,
                    startZ: this.startZ + currentZOffset,
                    endX: this.endX + currentXOffset,
                    endZ: this.endZ + currentZOffset
                }));
            }
        }
        this.pathingLines.add(new PathingLine({
            startX: this.startX + lenientPlusOffsetX,
            startZ: this.startZ + lenientPlusOffsetZ,
            endX: this.endX + lenientPlusOffsetX,
            endZ: this.endZ + lenientPlusOffsetZ
        }));
        let side1;
        let side2;
        let allPointsFit;
        for (let pathingLine of this.pathingLines) {
            //If you can fit a cell on any cardinal side of the line and have it still
            //fit inside the outermost lines, then always path test in that currentDirection.
            for (let cardinalDirection = 0; cardinalDirection < Enums.CardinalDirections.length; ++cardinalDirection) {
                allPointsFit = true;
                for (let cellOffsetPoint of CardinalCellOffsetsMap[cardinalDirection]) {
                    side1 = SideOfLine({
                        line: firstBoundingLine,
                        pointX: pathingLine.startX + cellOffsetPoint.offsetX,
                        pointZ: pathingLine.startZ + cellOffsetPoint.offsetZ
                    });
                    side2 = SideOfLine({
                        line: lastBoundingLine,
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

            pathingLine.setupTesting({ map: this.map });
        }
    }

    //Determine the minimum distance the unit can go towards the current movement step before reaching an
    //obstruction in the path.
    computeMinPathable() {
        //Check every cell that each of the lines intersects with, to see how many cells
        //away from the unit are pathable.
        this.minPathable = {
            distance: Infinity,
            pathingLine: null
        };
        let currentDirection;
        let isCellTraversible;
        //Check one pathing line at a time, one cell at a time, in sync.
        do {
            for (let pathingLine of this.pathingLines) {
                currentDirection = pathingLine.testNextCell();
                if (currentDirection == null) {
                    this.pathingLines.delete(pathingLine);
                    continue;
                }

                //Test the traversal direction.
                isCellTraversible = this.map.isTraversible({
                    cell: pathingLine.currentCell,
                    direction: currentDirection
                });
                if (isCellTraversible) {
                    //Also test any inner directions.
                    for (let innerDirection of pathingLine.innerDirections) {
                        isCellTraversible = this.map.isTraversible({
                            cell: pathingLine.currentCell,
                            direction: innerDirection
                        });
                        if (!isCellTraversible) {
                            break;
                        }
                    }
                }
                pathingLine.currentCell = pathingLine.currentCell.neighbors[currentDirection];
                // new ColoredSquare({
                //     workruft: game,
                //     x: FloorToCell(pathingLine.currentCell.x),
                //     z: FloorToCell(pathingLine.currentCell.z),
                //     color: BlueColor
                // });
                if (!isCellTraversible) {
                    //Obstruction found!
                    pathingLine.currentDistance = CellClosestDistance({
                        cellX: pathingLine.currentCell.x,
                        cellZ: pathingLine.currentCell.z,
                        pointX: this.startX,
                        pointZ: this.startZ
                    });
                    if (pathingLine.currentDistance < this.minPathable.distance) {
                        this.minPathable.distance = pathingLine.currentDistance;
                        this.minPathable.pathingLine = pathingLine;
                    }
                    this.pathingLines.delete(pathingLine);
                    break;
                }
            }
        } while (this.pathingLines.size > 0);
    }
}