class ColoredRectangle {
    constructor({ workruft, x, z, sizeX = CellSize, sizeZ = CellSize, color, opacity = 1.0 }) {
        this.workruft = workruft;
        let material;
        if (ColoredMeshPhongMaterialsMap.has(color)) {
            material = ColoredMeshPhongMaterialsMap.get(color);
        } else {
            material = new THREE.MeshPhongMaterial({ color });
            ColoredMeshPhongMaterialsMap.set(color, material);
        }
        if (opacity != 1.0) {
            material = material.clone();
            material.opacity = opacity;
            material.transparent = true;
        }
        this.mesh = this.workruft.world.squareModel.createNewMeshWithMaterial({
            material
        });
        this.mesh.rotation.x = -HalfPI;
        this.mesh.scale.x = sizeX;
        this.mesh.scale.y = sizeZ;
        this.position = { x, z };
        this.color = color;
        this.workruft.world.indicatorObjects.add(this.mesh);
    }

    deconstruct() {
        this.workruft.world.indicatorObjects.remove(this.mesh);
        if (!ColoredMeshPhongMaterialsMap.has(this.mesh.material)) {
            DisposeThreeObject(this.mesh.material);
        }
    }

    get position() {
        return this.mesh.position;
    }

    set position({ x, z }) {
        let iterationBounds = GetIterationBounds(this.size.x, this.size.y);
        this.mesh.position.x = AlignToCell(x) + (this.size.x % 2 == 0 ? 0 : HalfCellSize);
        this.mesh.position.z = AlignToCell(z) + (this.size.y % 2 == 0 ? 0 : HalfCellSize);
        this.autoSetHeight();
    }

    get size() {
        return this.mesh.scale;
    }

    set color(color) {
        this.mesh.material.color = color;
    }

    autoSetHeight() {
        let heights = [];
        let x = this.mesh.position.x - (this.size.x % 2 == 0 ? 0 : HalfCellSize);
        let z = this.mesh.position.z - (this.size.y % 2 == 0 ? 0 : HalfCellSize);
        let iterationBounds = GetIterationBounds(this.size.x, this.size.y);
        let cellCount = 0;
        for (let xOffset = -iterationBounds.floorHalfLatSize; xOffset < iterationBounds.ceilHalfLatSize;
            xOffset += CellSize) {
            for (let zOffset = -iterationBounds.floorHalfLongSize; zOffset < iterationBounds.ceilHalfLongSize;
                zOffset += CellSize) {
                let currentCell = this.workruft.world.map.getCell({
                    x: x + xOffset,
                    z: z + zOffset
                });
                if (currentCell == null) {
                    continue;
                }
                heights.push(this.workruft.world.map.getMaxHeight({ cell: currentCell }));
            }
        }
        if (heights.length > 0) {
            heights.sort();
            this.mesh.position.y = (heights[Math.floor(heights.length * 0.5)]) + EditorExtraHeightOffset;
        } else {
            this.mesh.position.y = EditorExtraHeightOffset;
        }
    }
}

module.exports = ColoredRectangle;