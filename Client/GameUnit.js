//TODO: Add code to improve positioning controls, including selection circle!
class GameUnit {
    constructor({ gameModel, x, y, z }) {
        this.gameModel = gameModel;
        this.group = new THREE.Group();
        this.position.set(x, y, z);
        this.private = {
            mesh: gameModel.createNewMesh()
        };
        this.private.mesh.position.y = this.gameModel.halfSize;
        this.private.mesh.userData = this;
        this.group.add(this.private.mesh);
        this.isSelected = false;
    }

    destroy() {
        this.deselect();
        if (this.mesh != null) {
            DisposeThreeObject(this.mesh);
            delete this.mesh;
        }
    }

    addToGroup({ objectGroup }) {
        objectGroup.add(this.group);
    }

    select({ world, selectionModel }) {
        if (!this.isSelected) {
            this.private.selectionCircle = selectionModel.createNewMesh();
            this.private.selectionCircle.layers.set(1);
            this.private.selectionCircle.position.y = 0.5;
            this.private.selectionCircle.rotation.x = Math.PI * 0.5;
            this.group.add(this.private.selectionCircle);
            world.selectedObjects.add(this);
            this.isSelected = true;
        }
    }

    deselect({ world }) {
        if (this.isSelected) {
            world.selectedObjects.delete(this);
            DisposeThreeObject(this.private.selectionCircle);
            delete this.private.selectionCircle;
            this.isSelected = false;
        }
    }

    get position() {
        return this.group.position;
    }
}