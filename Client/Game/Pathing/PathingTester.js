//A path tester, using multiple PathingLines, one direction at a time.
//This class is designed to promote reusability.
class PathingTester {
    constructor({ workruft, gameModel }) {
        this.workruft = workruft;
        this.gameModel = gameModel;
    }

    setEnds({ startX, startZ, endX, endZ }) {
        this.startX = startX;
        this.startZ = startZ;
        this.endX = endX;
        this.endZ = endZ;
        this.xDistance = this.endX - this.startX;
        this.zDistance = this.endZ - this.startZ;
    }

    limitDistance({ maxDistance }) {
        this.maxDistance = maxDistance;
        this.euclidianDistance = Math.hypot(this.xDistance, this.zDistance);
        this.manhattanDistance = Math.abs(this.xDistance) + Math.abs(this.zDistance);
        if (this.euclidianDistance < this.maxDistance) {
            //Closer to the destination than the maximum distance.
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
    updateTraversalAngleAndOffsets() {
        let lastTraversalAngle = this.traversalAngle;
        this.traversalAngle = GenericRound(Math.atan2(-this.zDistance, this.xDistance));
        //Only compute offsets when traversalAngle changes (can have different ends but the same traversalAngle).
        if (this.traversalAngle != lastTraversalAngle) {
            //Only compute offsets when traversalAngle is not a cardinal angle.
            if (IsDefined(CardinalPathingLineOffsetsMap[this.gameModel.halfXZSize]) &&
                IsDefined(CardinalPathingLineOffsetsMap[this.gameModel.halfXZSize][this.traversalAngle])) {
                this.pathingLineOffsets = CardinalPathingLineOffsetsMap[this.gameModel.halfXZSize][this.traversalAngle];
            } else {
                this.pathingLineOffsets = ComputePathingLineOffsets({
                    traversalAngle: this.traversalAngle,
                    xDistance: this.xDistance,
                    zDistance: this.zDistance,
                    halfXZSize: this.gameModel.halfXZSize,
                    numberOfExtraPathingLines: this.gameModel.numberOfExtraPathingLines
                });
            }
        }
    }

    //Create path-testing lines. The first two lines start and end at the outermost points of the circle
    //parallel to the slope of the unit's trajectory. The inner lines start at the front of the starting
    //circle and end at the back of the ending circle, evenly distributed according to the number of
    //extra pathing lines.
    //Call once the ends and this.traversalAngle are what they should be.
    computePathingLines() {
        this.pathingLines = new Set();
        for (let line of this.pathingLineOffsets.lines) {
            let newPathingLine = new PathingLine({
                workruft: this.workruft,
                startX: this.startX + line[0],
                startZ: this.startZ + line[1],
                endX: this.endX + line[0],
                endZ: this.endZ + line[1],
                innerDirections: line[2]
            });
            this.pathingLines.add(newPathingLine);
            newPathingLine.setupTesting();
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
                    //End of pathing line.
                    this.pathingLines.delete(pathingLine);
                    continue;
                }

                //Test the traversal direction.
                isCellTraversible = this.workruft.world.map.isTraversible({
                    cell: pathingLine.currentCell,
                    direction: currentDirection
                });
                if (isCellTraversible) {
                    //Also test any inner directions.
                    for (let innerDirection of pathingLine.innerDirections) {
                        //Don't overtest in the current direction!
                        if (innerDirection == currentDirection) {
                            continue;
                        }
                        isCellTraversible = this.workruft.world.map.isTraversible({
                            cell: pathingLine.currentCell.neighbors[currentDirection],
                            direction: innerDirection
                        });
                        if (!isCellTraversible) {
                            break;
                        }
                    }
                }
                pathingLine.currentCell = pathingLine.currentCell.neighbors[currentDirection];
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

    //Determine whether the unit can reach the destination at all.
    computePathability() {
        //Check every cell that each of the lines intersects with, to see whether all of the cells are pathable.
        this.isPathable = true;
        let currentDirection;
        let isCellTraversible;
        //Check one pathing line at a time, one cell at a time, in sync.
        do {
            for (let pathingLine of this.pathingLines) {
                currentDirection = pathingLine.testNextCell();
                if (currentDirection == null) {
                    //End of pathing line.
                    this.pathingLines.delete(pathingLine);
                    continue;
                }

                //Test the traversal direction.
                isCellTraversible = this.workruft.world.map.isTraversible({
                    cell: pathingLine.currentCell,
                    direction: currentDirection
                });
                if (isCellTraversible) {
                    //Also test any inner directions.
                    for (let innerDirection of pathingLine.innerDirections) {
                        //Don't overtest in the current direction!
                        if (innerDirection == currentDirection) {
                            continue;
                        }
                        isCellTraversible = this.workruft.world.map.isTraversible({
                            cell: pathingLine.currentCell.neighbors[currentDirection],
                            direction: innerDirection
                        });
                        if (!isCellTraversible) {
                            break;
                        }
                    }
                }
                if (!isCellTraversible) {
                    //Obstruction found!
                    this.isPathable = false;
                    break;
                }
                pathingLine.currentCell = pathingLine.currentCell.neighbors[currentDirection];
            }
        } while (this.isPathable && this.pathingLines.size > 0);
        this.isPathable;
    }
}