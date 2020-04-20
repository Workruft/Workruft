//TODO: Add code to improve positioning controls, including selection circle!
class GameUnit {
    constructor({ gameModel, x, y, z }) {
        this.gameModel = gameModel;
        this.mesh = gameModel.createNewMesh();
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = z;
        this.mesh.userData = this;
        this.isSelected = false;
    }

    destroy() {
        this.deselect();
        if (this.mesh != null) {
            DisposeThreeObject(this.mesh);
            delete this.mesh;
        }
    }

    select({ world, selectionModel, objectGroup }) {
        if (!this.isSelected) {
            this.selectionCircle = selectionModel.createNewMesh();
            this.selectionCircle.position.set(
                this.mesh.position.x,
                this.mesh.position.y - this.gameModel.size * 0.5,
                this.mesh.position.z);
            this.selectionCircle.rotation.x = Math.PI * 0.5;
            objectGroup.add(this.selectionCircle);
            world.selectedObjectsMap[this] = true;
            this.isSelected = true;
        }
    }

    deselect({ world }) {
        if (this.isSelected) {
            delete world.selectedObjectsMap[this];
            DisposeThreeObject(this.selectionCircle);
            delete this.selectionCircle;
            this.isSelected = false;
        }
    }
}