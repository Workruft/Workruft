let PathingTester = require('./PathingTester');
let BinaryHeap = require('../Helpers/BinaryHeap');
let ColoredRectangle = require('../Helpers/ColoredRectangle');

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
        this.cardinalPathingTesters[Enums.CardinalDirections.back].setEnds({
            startX: 0.0, startZ: 0.0, endX: 0.0, endZ: -1.0 });
        //Right.
        this.cardinalPathingTesters[Enums.CardinalDirections.right].setEnds({
            startX: 0.0, startZ: 0.0, endX: 1.0, endZ: 0.0 });
        //Front.
        this.cardinalPathingTesters[Enums.CardinalDirections.front].setEnds({
            startX: 0.0, startZ: 0.0, endX: 0.0, endZ: 1.0 });
        //Left.
        this.cardinalPathingTesters[Enums.CardinalDirections.left].setEnds({
            startX: 0.0, startZ: 0.0, endX: -1.0, endZ: 0.0 });
        for (let cardinalPathingTester of this.cardinalPathingTesters) {
            cardinalPathingTester.updateTraversalAngleAndOffsets();
        }
        this.linearOptimizationTester = new PathingTester({
            workruft: this.workruft,
            gameModel: this.gameUnit.gameModel
        });
    }

    setStartPoint({ pointX, pointZ }) {
        // this.startX = FloorToCell(pointX);
        // this.startZ = FloorToCell(pointZ);
        this.startX = AlignToCell(pointX - this.gameUnit.gameModel.cellAlignmentOffset) +
            this.gameUnit.gameModel.cellAlignmentOffset;
        this.startZ = AlignToCell(pointZ - this.gameUnit.gameModel.cellAlignmentOffset) +
            this.gameUnit.gameModel.cellAlignmentOffset;
    }

    setEndPoint({ pointX, pointZ }) {
        // this.endX = FloorToCell(pointX);
        // this.endZ = FloorToCell(pointZ);
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
        let startPoint = {
            x: this.startX,
            z: this.startZ,
            score: null,
            distance: Math.hypot(this.endX - this.startX, this.endZ - this.startZ),
            manhattanTraveled: 0,
            fromPoint: null,
            travelDirection: null
        };
        let currentPoint = startPoint;
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
            if (currentPoint.fromPoint == null) {
                if (solutionPath.length == 0) {
                    solutionPath.push(currentPoint);
                }
                break;
            }
            solutionPath.push(currentPoint);
            currentPoint = currentPoint.fromPoint;
        } while (true);
        let optimizedSolutionPath = [];
        optimizedSolutionPath.push(solutionPath[0]);
        for (let pointIndex = 1; pointIndex < solutionPath.length; ++pointIndex) {
            //Same-direction optimization.
            if (solutionPath[pointIndex - 1].travelDirection != solutionPath[pointIndex].travelDirection) {
                optimizedSolutionPath.push(solutionPath[pointIndex]);
            }
        }
        for (let pointIndex = optimizedSolutionPath.length - 1; pointIndex >= 2; --pointIndex) {
            //Linear optimization.
            this.linearOptimizationTester.setEnds({
                startX: optimizedSolutionPath[pointIndex].x,
                startZ: optimizedSolutionPath[pointIndex].z,
                endX: optimizedSolutionPath[pointIndex - 2].x,
                endZ: optimizedSolutionPath[pointIndex - 2].z
            });
            this.linearOptimizationTester.updateTraversalAngleAndOffsets();
            this.linearOptimizationTester.computePathingLines();
            this.linearOptimizationTester.computePathability();
            if (this.linearOptimizationTester.isPathable) {
                optimizedSolutionPath.splice(pointIndex - 1, 1);
            }
        }
        return [ optimizedSolutionPath, solutionPath ];
    }

    //TODO: Currently ignoring the cases where there are multiple sources for a point. Could affect scoring.
    tryAddPoint({ fromPoint, travelDirection, newX, newZ }) {
        //Don't add a point already mapped.
        if (IsUndefined(this.mappedPoints[newX])) {
            //X hasn't even been mapped yet.
            this.mappedPoints[newX] = {};
        } else if (IsDefined(this.mappedPoints[newX][newZ])) {
            //X and Z have both already been mapped. Check for a lower travel distance coming from the current fromPoint
            //than the already mapped point's fromPoint.
            if (this.mappedPoints[newX][newZ].fromPoint != null &&
                fromPoint.manhattanTraveled < this.mappedPoints[newX][newZ].fromPoint.manhattanTraveled) {
                this.mappedPoints[newX][newZ].fromPoint = fromPoint;
            }
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
                fromPoint,
                travelDirection
            };
            CalculateScore({ point: newPoint });
            this.mappedPoints[newX][newZ] = newPoint;
            this.heapedPoints.push(newPoint);
            // this.gameUnit.ColoredRectangles.push(new ColoredRectangle({
            //     workruft: this.workruft,
            //     x: newX - HalfCellSize,
            //     z: newZ - HalfCellSize,
            //     color: BlackColor,
            //     opacity: 0.1
            // }));
        } else {
            this.gameUnit.ColoredRectangles.push(new ColoredRectangle({
                workruft: this.workruft,
                x: newX - HalfCellSize,
                z: newZ - HalfCellSize,
                color: RedColor,
                opacity: 0.1
            }));
        }
    }
}

module.exports = PathFinder;