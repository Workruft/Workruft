class GameModel {
    //Takes ownership of the geometry and material!
    constructor({ world, geometry, material, xzSize, ySize }) {
        this.world = world;
        this.geometry = geometry;
        this.material = material;

        this.xzSize = xzSize;
        this.halfXZSize = xzSize * 0.5;
        this.numberOfExtraPathingLines = CalculateNumberOfExtraPathingLines({ xzSize: this.xzSize });
        //Offset places unit in center of smallest cells alignment that can still fit the entire unit.
        //E.g. if unit is 1.5 cells big, it should start at cell position + 0.25.
        this.cellAlignmentOffset = (this.xzSize % CellSize) * 0.5;
        this.ySize = ySize;
        this.halfYSize = ySize * 0.5;
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

    createNewMeshWithMaterial({ material }) {
        let newMesh = new THREE.Mesh(this.geometry, material);
        newMesh.castShadow = true;
        return newMesh;
    }
}

module.exports = GameModel;