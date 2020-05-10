class PathingTester {
    constructor({ map, gameModel }) {
        this.map = map;
        this.gameModel = gameModel;
        this.start = new XZPair({ x: 0.0, z: 0.0 });
        this.end = new XZPair({ x: 0.0, z: 0.0 });
    }

    setEnds({ startX, startZ, endX, endZ }) {
        this.start.x = startX;
        this.start.z = startZ;
        this.end.x = endX;
        this.end.z = endZ;
    }
}