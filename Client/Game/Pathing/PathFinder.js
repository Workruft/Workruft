//A path finder, one for each unit, which utilizes PathingTesters in all 4 cardinal directions, 1 cell at a time, to
//find the best path for a unit from A to B, using a variation of the A* path finding algorithm.
class PathFinder {
    constructor({ map, gameUnit }) {
        this.map = map;
        this.gameUnit = gameUnit;
    }

    setStart({ unitX, unitZ }) {
        this.startX = AlignToCell(unitX - this.gameUnit.gameModel.cellAlignmentOffset) +
            this.gameUnit.gameModel.cellAlignmentOffset;
        this.startZ = AlignToCell(unitZ - this.gameUnit.gameModel.cellAlignmentOffset) +
            this.gameUnit.gameModel.cellAlignmentOffset;
    }

    setTargetPoint({ pointX, pointZ }) {
        this.endX = AlignToCell(pointX - this.gameUnit.gameModel.cellAlignmentOffset) +
            this.gameUnit.gameModel.cellAlignmentOffset;
        this.endZ = AlignToCell(pointZ - this.gameUnit.gameModel.cellAlignmentOffset) +
            this.gameUnit.gameModel.cellAlignmentOffset;
    }
}