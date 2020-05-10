class PathingTester {
    constructor({ startX, startZ, endX, endZ, traversalAngle, unitRadius,
        numberOfExtraPathingLines, map }) {
        this.startX = startX;
        this.startZ = startZ;
        this.endX = endX;
        this.endZ = endZ;
        this.traversalAngle = traversalAngle;
        this.unitRadius = unitRadius;
        this.numberOfExtraPathingLines = numberOfExtraPathingLines;
        this.map = map;
    }
}