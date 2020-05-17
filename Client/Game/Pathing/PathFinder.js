function CalculateScore({ point }) {
    point.score = point.manhattanTraveled + point.distance * PathFindingGreediness;
}

//A path finder, one for each unit, which utilizes PathingTesters in all 4 cardinal directions, 1 cell at a time, to
//find the best path for a unit from A to B, using a variation of the A* path finding algorithm.
class PathFinder {
    constructor({ workruft, gameUnit }) {
        this.workruft = workruft;
        this.gameUnit = gameUnit;

        this.bestPath = null;
        this.mappedPoints = null;
        this.heapedPoints = null;

        //TODO: Assuming the units aren't going to change any from the defaults, these could actually be created once
        //for every unit type, instead of for every unit.
        this.cardinalPathingTesters = [];
        for (let cardinalDirection = 0; cardinalDirection < Enums.CardinalDirections.length; ++cardinalDirection) {
            this.cardinalPathingTesters.push(new PathingTester({
                workruft: this.workruft,
                gameModel: this.gameUnit.gameModel
            }));
        };
        //Back.
        this.cardinalPathingTesters[0].setEnds({ startX: 0.0, startZ: 0.0, endX: 0.0, endZ: -1.0 });
        //Right.
        this.cardinalPathingTesters[1].setEnds({ startX: 0.0, startZ: 0.0, endX: 1.0, endZ: 0.0 });
        //Front.
        this.cardinalPathingTesters[2].setEnds({ startX: 0.0, startZ: 0.0, endX: 0.0, endZ: 1.0 });
        //Left.
        this.cardinalPathingTesters[3].setEnds({ startX: 0.0, startZ: 0.0, endX: -1.0, endZ: 0.0 });
        for (let cardinalPathFinder of this.cardinalPathingTesters) {
            cardinalPathFinder.updateTraversalAngleAndOffsets();
        }
    }

    //TODO.
    deconstruct() {

    }

    setStartPoint({ pointX, pointZ }) {
        this.startX = AlignToCell(pointX - this.gameUnit.gameModel.cellAlignmentOffset) +
            this.gameUnit.gameModel.cellAlignmentOffset;
        this.startZ = AlignToCell(pointZ - this.gameUnit.gameModel.cellAlignmentOffset) +
            this.gameUnit.gameModel.cellAlignmentOffset;
    }

    setEndPoint({ pointX, pointZ }) {
        this.endX = AlignToCell(pointX - this.gameUnit.gameModel.cellAlignmentOffset) +
            this.gameUnit.gameModel.cellAlignmentOffset;
        this.endZ = AlignToCell(pointZ - this.gameUnit.gameModel.cellAlignmentOffset) +
            this.gameUnit.gameModel.cellAlignmentOffset;
    }

    findBestPath({ range }) {
        range = Math.min(range, 0.001) + this.gameUnit.gameModel.halfXZSize;

        this.bestPath = null;
        this.mappedPoints = {};
        this.heapedPoints = new BinaryHeap({
            scoringFunction: function(point) {
                return point.score;
            }
        });

        //Starting point.
        let currentPoint = {
            x: this.startX,
            z: this.startZ,
            score: null,
            distance: Math.hypot(this.endX - this.startX, this.endZ - this.startZ),
            manhattanTraveled: 0,
            fromPoint: null
        };
        CalculateScore({ point: currentPoint });
        this.mappedPoints[currentPoint.x] = {
            [currentPoint.z]: currentPoint
        };

        let pointsTested = 1;
        let pointsTestedWithoutImprovement = 0;
        let closestPoint = currentPoint;
        //Pathfinding loop.
        do {
            //See if point is within specified range.
            if (currentPoint.distance <= range) {
                //Solution found!
                break;
            }
            //Add back.
            this.tryAddPoint({
                fromPoint: currentPoint,
                travelDirection: Enums.CardinalDirections.back,
                newX: currentPoint.x,
                newZ: currentPoint.z - CellSize
            });
            //Add right.
            this.tryAddPoint({
                fromPoint: currentPoint,
                travelDirection: Enums.CardinalDirections.right,
                newX: currentPoint.x + CellSize,
                newZ: currentPoint.z
            });
            //Add front.
            this.tryAddPoint({
                fromPoint: currentPoint,
                travelDirection: Enums.CardinalDirections.front,
                newX: currentPoint.x,
                newZ: currentPoint.z + CellSize
            });
            //Add left.
            this.tryAddPoint({
                fromPoint: currentPoint,
                travelDirection: Enums.CardinalDirections.left,
                newX: currentPoint.x - CellSize,
                newZ: currentPoint.z
            });
            if (this.heapedPoints.length == 0) {
                //Exhausted all possible options!
                currentPoint = null;
                break;
            }
            currentPoint = this.heapedPoints.pop();
            if (currentPoint.distance < closestPoint.distance) {
                closestPoint = currentPoint;
                pointsTestedWithoutImprovement = 0;
            } else {
                if (pointsTested >= PathFindingMaxPoints ||
                    pointsTestedWithoutImprovement >= PathFindingMaxPointsWithoutImprovement) {
                    //Exhausted all options within the limits!
                    currentPoint = null;
                    break;
                }
                ++pointsTestedWithoutImprovement;
            }
            ++pointsTested;
        } while (true);

        let solutionPath = [];
        if (currentPoint == null) {
            currentPoint = closestPoint;
        }
        do {
            solutionPath.push(currentPoint);
            if (currentPoint.fromPoint == null) {
                break;
            }
            currentPoint = currentPoint.fromPoint;
        } while (true);
        return solutionPath;
    }

    //TODO: Currently ignoring the cases where there are multiple sources for a point. Could affect scoring.
    tryAddPoint({ fromPoint, travelDirection, newX, newZ }) {
        //Don't add a point already mapped.
        if (IsUndefined(this.mappedPoints[newX])) {
            //X hasn't even been mapped yet.
            this.mappedPoints[newX] = {};
        } else if (IsDefined(this.mappedPoints[newX][newZ])) {
            //X and Z have both already been mapped.
            return;
        }
        //Either way now, X has been mapped, and Z has not.
        //Test for pathability.
        this.cardinalPathingTesters[travelDirection].setEnds({
            startX: fromPoint.x, startZ: fromPoint.z, endX: newX, endZ: newZ
        });
        this.cardinalPathingTesters[travelDirection].computePathingLines();
        this.cardinalPathingTesters[travelDirection].computePathability();
        if (this.cardinalPathingTesters[travelDirection].isPathable) {
            //Pathable; map a new point to test.
            let newPoint = {
                x: newX,
                z: newZ,
                score: null,
                distance: Math.hypot(this.endX - newX, this.endZ - newZ),
                manhattanTraveled: fromPoint.manhattanTraveled + 1,
                fromPoint
            };
            CalculateScore({ point: newPoint });
            this.mappedPoints[newX][newZ] = newPoint;
            this.heapedPoints.push(newPoint);
        } else {
            //Unpathable; map a dead point to prevent testing for it again.
            let deadPoint = {
                x: newX,
                z: newZ,
                score: Infinity,
                distance: Infinity,
                manhattanTraveled: fromPoint.manhattanTraveled + 1,
                fromPoint
            };
            this.mappedPoints[newX][newZ] = deadPoint;
        }
    }
}