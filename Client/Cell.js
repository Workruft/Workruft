//Each cell is a cube with top corner shearing.
//(Its top corners can have different heights.)
class Cell {
    constructor(x, z, heights, vio) {
        this.x = x;
        this.z = z;
        //Vertex Index Offset.
        this.vio = vio;
        this.createVertices(heights);
        this.createFaces();
    }

    //Corners:
    //    Top
    //  6----7
    // /|   /|
    //2----3 | Right
    //| |  | |
    //| 4--|-5
    //|/   |/ Right
    //0----1
    //Front
    createVertices(heights) {
        //In order from 0-7:
        this.vertices = [
            new THREE.Vector3(this.x - HalfCellSize,                     MapBottomY, this.z + HalfCellSize),
            new THREE.Vector3(this.x + HalfCellSize,                     MapBottomY, this.z + HalfCellSize),
            new THREE.Vector3(this.x - HalfCellSize,  MapMinimumHeight + heights[0], this.z + HalfCellSize),
            new THREE.Vector3(this.x + HalfCellSize,  MapMinimumHeight + heights[1], this.z + HalfCellSize),
            new THREE.Vector3(this.x - HalfCellSize,                     MapBottomY, this.z - HalfCellSize),
            new THREE.Vector3(this.x + HalfCellSize,                     MapBottomY, this.z - HalfCellSize),
            new THREE.Vector3(this.x - HalfCellSize,  MapMinimumHeight + heights[2], this.z - HalfCellSize),
            new THREE.Vector3(this.x + HalfCellSize,  MapMinimumHeight + heights[3], this.z - HalfCellSize)
        ];
    }

    //Faces. Must be in counter-clockwise direction to be facing outside.
    //Each integer is merely referencing a corner vertex.
    createFaces() {
        //Vertex Index Offset.
        let vio = this.vio;
        this.faces = [
            //Front.
            new THREE.Face3(vio + 0, vio + 3, vio + 2),
            new THREE.Face3(vio + 0, vio + 1, vio + 3),
            //Right.
            new THREE.Face3(vio + 1, vio + 7, vio + 3),
            new THREE.Face3(vio + 1, vio + 5, vio + 7),
            //Back.
            new THREE.Face3(vio + 5, vio + 6, vio + 7),
            new THREE.Face3(vio + 5, vio + 4, vio + 6),
            //Left.
            new THREE.Face3(vio + 4, vio + 2, vio + 6),
            new THREE.Face3(vio + 4, vio + 0, vio + 2),
            //Top.
            new THREE.Face3(vio + 2, vio + 7, vio + 6),
            new THREE.Face3(vio + 2, vio + 3, vio + 7),
            //Bottom.
            new THREE.Face3(vio + 4, vio + 1, vio + 0),
            new THREE.Face3(vio + 4, vio + 5, vio + 1),
        ];
    }
}