class GameUnit {
    constructor({ workruft, gameModel, x, z }) {
        this.gameModel = gameModel;
        this.group = new THREE.Group();
        this.position.set(x, 0.0, z);
        this.private = {
            mesh: gameModel.createNewMesh(),
            orders: [],
            speed: 50.0
        };
        this.private.mesh.geometry.computeBoundingBox();
        this.private.mesh.position.y = this.gameModel.halfYSize;
        this.private.mesh.userData = this;
        this.autoSetHeight({ workruft });
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

    issueReplacementOrder({ workruft, order }) {
        workruft.objectsToUpdate.add(this);
        this.private.orders = [];
        this.private.orders.push(order);
    }

    issueAdditionalOrder({ workruft, order }) {
        workruft.objectsToUpdate.add(this);
        this.private.orders.push(order);
    }

    update({ workruft, deltaTimeMS }) {
        let updated = false;
        while (this.private.orders.length > 0) {
            let currentOrder = this.private.orders[0];
            switch (currentOrder.type) {
                case Enums.OrderTypes.Move:
                    let maxTravelDistance = this.private.speed * deltaTimeMS;
                    let xDistance = currentOrder.data.x - this.position.x;
                    let zDistance = currentOrder.data.z - this.position.z;
                    let distance = Math.sqrt(Math.pow(xDistance, 2.0) + Math.pow(zDistance, 2.0));
                    if (distance < maxTravelDistance) {
                        this.position.x = currentOrder.data.x;
                        this.position.z = currentOrder.data.z;
                        deltaTimeMS -= (maxTravelDistance - distance) / this.private.speed;
                        this.private.orders.splice(0, 1);
                    } else {
                        let manhattanDistance = Math.abs(xDistance) + Math.abs(zDistance);
                        this.position.x += maxTravelDistance * xDistance / manhattanDistance;
                        this.position.z += maxTravelDistance * zDistance / manhattanDistance;
                    }
                    this.autoSetHeight({ workruft });
                    updated = true;
                    break;
                default:
                    updated = true;
            }
            if (updated) {
                break;
            }
        }
        if (this.private.orders.length == 0) {
            workruft.objectsToUpdate.delete(this);
        }
    }

    addToGroup({ objectGroup }) {
        objectGroup.add(this.group);
    }

    select({ workruft, selectionModel }) {
        if (!this.isSelected) {
            this.private.selectionCircle = selectionModel.createNewMesh();
            this.private.selectionCircle.layers.set(1);
            this.private.selectionCircle.position.y = 0.5;
            this.private.selectionCircle.rotation.x = Math.PI * 0.5;
            this.group.add(this.private.selectionCircle);
            workruft.selectedObjects.add(this);
            this.isSelected = true;
        }
    }

    deselect({ workruft }) {
        if (this.isSelected) {
            workruft.selectedObjects.delete(this);
            DisposeThreeObject(this.private.selectionCircle);
            delete this.private.selectionCircle;
            this.isSelected = false;
        }
    }

    //TODO: Should probably manage this more and make it private.
    get position() {
        return this.group.position;
    }

    autoSetHeight({ workruft }) {
        let integerX = Math.round(this.position.x);
        let integerZ = Math.round(this.position.z);
        this.position.y = workruft.world.map.getAverageHeight({
            cell: workruft.world.map.getCell({ x: integerX, z: integerZ })
        });
    }
}