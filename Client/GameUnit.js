class GameUnit {
    constructor({ mesh, x, y, z }) {
        this.mesh = mesh;
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = z;
        this.mesh.userData = this;
    }
}