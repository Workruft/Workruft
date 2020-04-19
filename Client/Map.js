//Directions:
//  -Z    /\+Y
//-X  +X  ||
//  +Z    \/-Y

class Map {
    constructor(sizeX, sizeZ) {
        this.sizeX = sizeX;
        this.sizeZ = sizeZ;
        this.halfSizeX = this.sizeX * 0.5;
        this.halfSizeZ = this.sizeZ * 0.5;

        this.generate();
    }

    generate() {
        this.grid = {};
        this.geometry = new THREE.Geometry();

        //Vertex Index Offset.
        let vio = 0;
        for (let x = -this.halfSizeX; x <= this.halfSizeX; x += CellSize) {
            let column = {};
            this.grid[x] = column;
            for (let z = -this.halfSizeZ; z <= this.halfSizeZ; z += CellSize) {
                column[z] = new Cell(x, z, [
                    Math.random() * 4.0,
                    Math.random() * 4.0,
                    Math.random() * 4.0,
                    Math.random() * 4.0
                ], vio);
                this.geometry.vertices.push(...column[z].vertices);
                this.geometry.faces.push(...column[z].faces);
                vio += column[z].vertices.length;
            }
        }

        //For lighting.
        this.geometry.computeFaceNormals();

        this.mesh = new THREE.Mesh(
            this.geometry,
            new THREE.MeshPhongMaterial({ color: 'green' }));
    }
}