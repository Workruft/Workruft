//A path tester, using multiple PathingLines, one direction at a time.
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

    //Call once this.xDistance and this.zDistance are what they should be.
    updateTraversalAngle() {
        let lastTraversalAngle = this.traversalAngle;
        this.traversalAngle = GenericRound(Math.atan2(-this.zDistance, this.xDistance));
        //Only compute offsets when traversalAngle changes (can have different ends but the same traversalAngle).
        if (this.traversalAngle != lastTraversalAngle) {
            //Only compute offsets when traversalAngle is not a cardinal angle.
            if (IsDefined(CardinalPathingLineOffsetsMap[this.gameModel.halfXZSize]) &&
                IsDefined(CardinalPathingLineOffsetsMap[this.gameModel.halfXZSize][this.traversalAngle])) {
                this.pathingLineOffsets = CardinalPathingLineOffsetsMap[this.gameModel.halfXZSize][this.traversalAngle];
            } else {
                this.pathingLineOffsets = computePathingLineOffsets({
                    traversalAngle: this.traversalAngle,
                    halfXZSize: this.gameModel.halfXZSize
                });
            }
        }
    }

    //Create path-testing lines. The first two lines start and end at the outermost points of the circle
    //parallel to the slope of the unit's trajectory. The inner lines start at the front of the starting
    //circle and end at the back of the ending circle, evenly distributed according to the number of
    //extra pathing lines.
    //Call once this.traversalAngle is what it should be.
    computePathingLines() {
        //Outermost bounds, without any leniency.
        let firstBoundingLine = {
            startX: this.startX + this.pathingLineOffsets.minusOffsetX,
            startZ: this.startZ + this.pathingLineOffsets.minusOffsetZ,
            endX: this.endX + this.pathingLineOffsets.minusOffsetX,
            endZ: this.endZ + this.pathingLineOffsets.minusOffsetZ
        };
        let lastBoundingLine = {
            startX: this.startX + this.pathingLineOffsets.plusOffsetX,
            startZ: this.startZ + this.pathingLineOffsets.plusOffsetZ,
            endX: this.endX + this.pathingLineOffsets.plusOffsetX,
            endZ: this.endZ + this.pathingLineOffsets.plusOffsetZ
        };

        this.pathingLines = new Set();
        this.pathingLines.add(new PathingLine({
            startX: this.startX + this.pathingLineOffsets.lenientMinusOffsetX,
            startZ: this.startZ + this.pathingLineOffsets.lenientMinusOffsetZ,
            endX: this.endX + this.pathingLineOffsets.lenientMinusOffsetX,
            endZ: this.endZ + this.pathingLineOffsets.lenientMinusOffsetZ
        }));
        //Add any inner points.
        if (this.gameModel.numberOfExtraPathingLines > 0) {
            let angleHelper = 2.0 / (this.gameModel.numberOfExtraPathingLines + 1.0);
            let currentAngleOffset;
            let currentXOffset;
            let currentZOffset;
            for (let extraPathingLineNum = 1; extraPathingLineNum <= this.gameModel.numberOfExtraPathingLines;
                ++extraPathingLineNum) {
                currentAngleOffset = this.pathingLineOffsets.plusAngle -
                    Math.acos(1.0 - extraPathingLineNum * angleHelper);
                currentXOffset = this.pathingLineOffsets.lenientUnitRadius * Math.cos(currentAngleOffset);
                currentZOffset = -this.pathingLineOffsets.lenientUnitRadius * Math.sin(currentAngleOffset);
                this.pathingLines.add(new PathingLine({
                    startX: this.startX + currentXOffset,
                    startZ: this.startZ + currentZOffset,
                    endX: this.endX + currentXOffset,
                    endZ: this.endZ + currentZOffset
                }));
            }
        }
        this.pathingLines.add(new PathingLine({
            startX: this.startX + this.pathingLineOffsets.lenientPlusOffsetX,
            startZ: this.startZ + this.pathingLineOffsets.lenientPlusOffsetZ,
            endX: this.endX + this.pathingLineOffsets.lenientPlusOffsetX,
            endZ: this.endZ + this.pathingLineOffsets.lenientPlusOffsetZ
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