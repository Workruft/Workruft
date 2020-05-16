function calculateScore({ point }) {
    point.score = point.manhattanTraveled + point.distance * 1.5;
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
        range = Math.min(range, 0.001);

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
        calculateScore({ point: currentPoint });
        this.mappedPoints[currentPoint.x] = {
            [currentPoint.z]: currentPoint
        };

        if (IsDefined(this.coloredSquares)) {
            for (let coloredSquare of this.coloredSquares) {
                coloredSquare.deconstruct();
            }
        }
        this.coloredSquares = [];
        //Pathfinding loop.
        do {
            this.coloredSquares.push(new ColoredSquare({
                workruft: this.workruft,
                x: currentPoint.x,
                z: currentPoint.z,
                color: BlueColor
            }));
            //See if point is within specified range.
            if (currentPoint.distance <= range) {
                //Solution found!
                break;
            }
            //Add back, right, front, and left.
            this.tryAddPoint({
                fromPoint: currentPoint,
                newX: currentPoint.x,
                newZ: currentPoint.z - CellSize });
            this.tryAddPoint({
                fromPoint: currentPoint,
                newX: currentPoint.x + CellSize,
                newZ: currentPoint.z });
            this.tryAddPoint({
                fromPoint: currentPoint,
                newX: currentPoint.x,
                newZ: currentPoint.z + CellSize });
            this.tryAddPoint({
                fromPoint: currentPoint,
                newX: currentPoint.x - CellSize,
                newZ: currentPoint.z });
            if (this.heapedPoints.length == 0) {
                //Exhausted all possible options!
                currentPoint = null;
                break;
            }
            currentPoint = this.heapedPoints.pop();
        } while (true);

        let solutionPath = [];
        if (currentPoint != null) {
            do {
                solutionPath.push(currentPoint);
                if (currentPoint.fromPoint == null) {
                    break;
                }
                currentPoint = currentPoint.fromPoint;
            } while (true);
        }
        return solutionPath;
    }

    //TODO: Currently ignoring the cases where there are multiple sources for a point. Could affect scoring.
    tryAddPoint({ fromPoint, newX, newZ }) {
        //Don't add a point already mapped.
        if (IsUndefined(this.mappedPoints[newX])) {
            //X hasn't even been mapped yet.
            this.mappedPoints[newX] = {};
        } else if (IsDefined(this.mappedPoints[newX][newZ])) {
            //X and Z have both already been mapped.
            return;
        }
        //Either way now, X has been mapped, and Z has not.

        //TODO: Test to ensure it's pathable!


        let newPoint = {
            x: newX,
            z: newZ,
            score: null,
            distance: Math.hypot(this.endX - newX, this.endZ - newZ),
            manhattanTraveled: fromPoint.manhattanTraveled + 1,
            fromPoint
        };
        calculateScore({ point: newPoint });
        this.mappedPoints[newX][newZ] = newPoint;
        this.heapedPoints.push(newPoint);
    }
}