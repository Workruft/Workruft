class GameModel {
    //Takes ownership of the geometry and material!
    constructor({ geometry, material, xzSize, ySize }) {
        this.geometry = geometry;
        this.material = material;

        this.xzSize = xzSize;
        this.halfXZSize = xzSize * 0.5;
        this.numberOfExtraPathingLines = Math.max(0, this.xzSize / CellSize - 1);
        this.ySize = ySize;
        this.halfYSize = ySize * 0.5;
    }

    createNewMesh() {
        let newMesh = new THREE.Mesh(this.geometry, this.material);
        newMesh.castShadow = true;
        return newMesh;
    }

    deconstruct() {
        DisposeThreeObject(this.geometry);
        DisposeThreeObject(this.material);
    }
}