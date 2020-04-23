class GameModel {
    //Takes ownership of the geometry and material!
    constructor({ geometry, material, xSize, ySize, zSize, isCircular }) {
        this.geometry = geometry;
        this.material = material;

        this.xSize = xSize;
        this.halfXSize = xSize * 0.5;
        this.ySize = ySize;
        this.halfYSize = ySize * 0.5;
        this.zSize = zSize;
        this.halfZSize = zSize * 0.5;

        this.isCircular = isCircular;
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