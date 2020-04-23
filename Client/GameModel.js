class GameModel {
    //Takes ownership of the geometry and material!
    constructor({ geometry, material, size }) {
        this.geometry = geometry;
        this.material = material;
        this.size = size;
        this.halfSize = size * 0.5;
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