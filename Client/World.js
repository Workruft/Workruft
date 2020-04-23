//Directions:
//  -Z    /\+Y
//-X  +X  ||
//  +Z    \/-Y

class World {
    constructor(chat, onUpdate) {
        this.chat = chat;
        this.onUpdate = onUpdate;
        this.boundGraphicsLoop = this.graphicsLoop.bind(this);

        //WebGL.
        this.canvas = HTML.gameCanvas;
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.onResize();
        window.addEventListener('resize', this.onResize);

        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        //Lights.
        this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.0);
        this.scene.add(this.ambientLight);
        //"Sun".
        this.directionalLight = new THREE.DirectionalLight('white', 1.0);
        this.directionalLight.position.set(0, 100, 0);
        this.scene.add(this.directionalLight);

        //Camera.
        let fieldOfView = 75;
        let near = 0.1;
        let far = 1000;
        this.camera = new THREE.PerspectiveCamera(fieldOfView, this.aspectRatio, near, far);
        this.camera.layers.enableAll();
        //For terrain picking.
        this.mapRaycaster = new THREE.Raycaster();
        this.mapRaycaster.near = near;
        this.mapRaycaster.far = far;
        this.mapRaycaster.layers.set(0);
        //For object picking.
        this.objectsRaycaster = new THREE.Raycaster();
        this.objectsRaycaster.near = near;
        this.objectsRaycaster.far = far;
        this.objectsRaycaster.layers.set(0);
        //TODO: Why does this not work?
        this.objectsRaycaster.params.Mesh.threshold = 30000;

        //Action.
        //Map.
        this.map = new Map(150, 150);
        let currentCell;
        let addBorder = function(currentCell) {
            this.map.geometry.vertices[currentCell.vio + 0].y = 1.0;
            this.map.geometry.vertices[currentCell.vio + 1].y = 1.0;
            this.map.geometry.vertices[currentCell.vio + 2].y = 1.0;
            this.map.geometry.vertices[currentCell.vio + 3].y = 1.0;
        }.bind(this);
        for (let x = this.map.minX; x <= this.map.maxX; x += CellSize) {
            addBorder(this.map.getCell({ x, z: this.map.minZ }));
            addBorder(this.map.getCell({ x, z: this.map.minZ + 1 }));
            addBorder(this.map.getCell({ x, z: this.map.maxZ - 1 }));
            addBorder(this.map.getCell({ x, z: this.map.maxZ }));
        }
        for (let z = this.map.minZ; z <= this.map.maxZ; z += CellSize) {
            addBorder(this.map.getCell({ x: this.map.minX, z }));
            addBorder(this.map.getCell({ x: this.map.minX + 1, z }));
            addBorder(this.map.getCell({ x: this.map.maxX - 1, z }));
            addBorder(this.map.getCell({ x: this.map.maxX, z }));
        }
        this.map.geometry.verticesNeedUpdate = true;
        this.map.updateCliffs({ lowX: this.map.minX, lowZ: this.map.minZ, highX: this.map.maxX, highZ: this.map.maxZ });
        this.scene.add(this.map.mesh);
        //Game models.
        this.setupGameModels();
        //Game objects.
        //Groups.
        this.gameObjects = new THREE.Group();
        this.scene.add(this.gameObjects);
        this.unclickableObjects = new THREE.Group();
        this.gameObjects.add(this.unclickableObjects);
        this.clickableObjects = new THREE.Group();
        this.gameObjects.add(this.clickableObjects);
        this.clickablePlayerObjects = new THREE.Group();
        this.clickableObjects.add(this.clickablePlayerObjects);
        this.clickableDoodadObjects = new THREE.Group();
        this.clickableObjects.add(this.clickableDoodadObjects);
        //Selection.
        this.selectedObjects = new Set();
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.aspectRatio = window.innerWidth / window.innerHeight;

        this.setupResizeGameModels();
    }

    setupResizeGameModels() {
        if (this.selectionCircleMaterial) {
            DisposeThreeObject(this.selectionCircleMaterial);
        }
        this.selectionCircleMaterial = new MeshLineMaterial({
            color: 'blue',
            resolution: new THREE.Vector2(this.canvas.width, this.canvas.height),
            sizeAttenuation: 0,
            lineWidth: 5.0,
            side: THREE.DoubleSide,
            opacity: 0.5,
            transparent: true
        });
        this.tinySelectionCircleModel = new GameModel({
            geometry: TinyCircleGeometry,
            material: this.selectionCircleMaterial,
            size: TinySize
        });
    }

    setupGameModels() {
        this.sheepMaterial = new THREE.MeshPhongMaterial({ color: '#777' });
        this.sheepModel = new GameModel({
            geometry: TinySphereGeometry,
            material: this.sheepMaterial,
            size: TinySize
        });

        this.buildingMaterial = new THREE.MeshPhongMaterial({ color: 'black' });
        this.buildingModel = new GameModel({
            geometry: SmallCubeGeometry,
            material: this.buildingMaterial,
            size: SmallSize
        });
    }

    graphicsLoop(elapsedTimeMS) {
        if (elapsedTimeMS == null) {
            elapsedTimeMS = 0.0;
        }
        this.renderer.render(this.scene, this.camera);
        this.onUpdate(elapsedTimeMS);
        requestAnimationFrame(this.boundGraphicsLoop);
    }

    //Object groups must be an array.
    //Mouse position must be in canvas-relative coordinates with Y flipped.
    //Objects returned are in order from nearest to farthest.
    pickObjects(objectGroups, mousePositionVector) {
        this.objectsRaycaster.setFromCamera(mousePositionVector, this.camera);
        return this.objectsRaycaster.intersectObjects(objectGroups, true);
    }
    pickMap(mousePositionVector) {
        this.mapRaycaster.setFromCamera(mousePositionVector, this.camera);
        return this.mapRaycaster.intersectObjects([ this.map.mesh ], true);
    }
    //From the docs: {
        //distance – distance between the origin of the ray and the intersection
        //point – point of intersection, in world coordinates
        //face – intersected face
        //faceIndex – index of the intersected face
        //object – the intersected object
        //uv - U,V coordinates at point of intersection
        //uv2 - Second set of U,V coordinates at point of intersection
        //instanceId – The index number of the instance where the ray intersects the InstancedMesh
    //}
    //Raycaster delegates to the raycast method of the passed object,
    //when evaluating whether the ray intersects the object or not.
    //This allows meshes to respond differently to ray casting than lines and pointclouds.
    //Note that for meshes, faces must be pointed towards the origin of the ray in order to be detected;
    //intersections of the ray passing through the back of a face will not be detected.
    //To raycast against both faces of an object,
    //you'll want to set the material's side property to THREE.DoubleSide.
}