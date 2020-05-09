class ColoredSquare {
    constructor({ workruft, x, z, color }) {
        this.workruft = workruft;
        let material;
        if (ColoredMeshPhongMaterialsMap.has(color)) {
            material = ColoredMeshPhongMaterialsMap.get(color);
        } else {
            material = new THREE.MeshPhongMaterial({ color });
            ColoredMeshPhongMaterialsMap.set(color, material);
        }
        this.mesh = this.workruft.world.squareModel.createNewMeshWithMaterial({
            material
        });
        this.mesh.rotation.x = -HalfPI;
        this.position = { x, z };
        this.color = color;
        this.workruft.world.indicatorObjects.add(this.mesh);
    }

    deconstruct() {
        this.workruft.world.indicatorObjects.remove(this.mesh);
    }

    get position() {
        return this.mesh.position;
    }

    set position({ x, z }) {
        this.mesh.position.x = x + HalfCellSize;
        this.mesh.position.z = z + HalfCellSize;
        this.autoSetHeight();
    }

    set color(color) {
        this.mesh.material.color = color;
    }

    autoSetHeight() {
        let cellX = AlignToCell(this.mesh.position.x);
        let cellZ = AlignToCell(this.mesh.position.z);
        this.mesh.position.y = this.workruft.world.map.getAverageHeight({
            cell: this.workruft.world.map.getCell({ x: cellX, z: cellZ })
        }) + 0.001;
    }
}