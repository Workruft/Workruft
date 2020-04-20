class GameModel {
    constructor({ geometry, material, size }) {
        this.geometry = geometry;
        this.material = material;
        this.size = size;
        this.halfSize = size * 0.5;
    }

    createNewMesh() {
        return new THREE.Mesh(this.geometry, this.material);
    }
}