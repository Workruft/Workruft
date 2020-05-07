class GameModel {
    //Takes ownership of the geometry and material!
    constructor({ world, geometry, material, xzSize, ySize }) {
        this.world = world;
        this.geometry = geometry;
        this.material = material;

        this.xzSize = xzSize;
        this.halfXZSize = xzSize * 0.5;
        this.numberOfExtraPathingLines = Math.max(0, Math.round(this.xzSize / CellSize));
        this.ySize = ySize;
        this.halfYSize = ySize * 0.5;

        this.traversal = GetOrCreateTraversal({ unitRadius: this.halfXZSize });
    }

    deconstruct() {
        DisposeThreeObject(this.geometry);
        DisposeThreeObject(this.material);
    }

    createNewMesh() {
        let newMesh = new THREE.Mesh(this.geometry, this.material);
        newMesh.castShadow = true;
        return newMesh;
    }
}