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
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.selectionCircleModelsMap = new Map();
        this.onResize();
        window.addEventListener('resize', this.onResize.bind(this));

        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        //Lights.
        this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.0);
        this.scene.add(this.ambientLight);
        //"Sun".
        this.directionalLight = new THREE.DirectionalLight('white', 1.0);
        this.directionalLight.castShadow = true;
        this.directionalLight.position.set(0, 100, 0);
        this.scene.add(this.directionalLight);
        this.directionalLight.shadow.camera.left = -100.0;
        this.directionalLight.shadow.camera.right = 100.0;
        this.directionalLight.shadow.camera.top = 100.0;
        this.directionalLight.shadow.camera.bottom = -100.0;
        this.directionalLight.shadow.camera.far = 1000.0;
        this.directionalLight.shadow.camera.updateProjectionMatrix();
        this.directionalLight.shadow.mapSize.width = 2048.0;
        this.directionalLight.shadow.mapSize.height = 2048.0;
        //To see the directional light's shadow camera bounds.
        //this.scene.add(new THREE.CameraHelper(this.directionalLight.shadow.camera));

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
        //this.objectsRaycaster.params.Mesh.threshold = 5;

        //Action.
        //Map.
        this.map = new GameMap(150, 150);
        let currentCell;
        //Border wall.
        let addBorder = function(currentCell) {
            this.map.getBackLeftVertex({ cell: currentCell }).y = 1.0;
            this.map.getBackRightVertex({ cell: currentCell }).y = 1.0;
            this.map.getFrontRightVertex({ cell: currentCell }).y = 1.0;
            this.map.getFrontLeftVertex({ cell: currentCell }).y = 1.0;
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
        //Rampsnstuff.
        let rampIncline = 0.5;
        for (let wholeRampXOffset = -8; wholeRampXOffset <= 8; wholeRampXOffset += 4) {
            this.map.getBackLeftVertex({ cell: this.map.getCell({ x: wholeRampXOffset - 1, z: -4 }) }).y = rampIncline;
            this.map.getBackRightVertex({ cell: this.map.getCell({ x: wholeRampXOffset - 1, z: -4 }) }).y = rampIncline;
            this.map.getBackLeftVertex({ cell: this.map.getCell({ x: wholeRampXOffset, z: -4 }) }).y = rampIncline;
            this.map.getBackRightVertex({ cell: this.map.getCell({ x: wholeRampXOffset, z: -4 }) }).y = rampIncline;
            for (let rampXOffset = 0; rampXOffset <= 1; ++rampXOffset) {
                for (let rampZOffset = 1; rampZOffset <= 5; ++rampZOffset) {
                    let currentCell = this.map.getCell({ x: wholeRampXOffset - rampXOffset, z: -4 - rampZOffset });
                    this.map.getFrontLeftVertex({ cell: currentCell }).y = rampZOffset * rampIncline;
                    this.map.getFrontRightVertex({ cell: currentCell }).y = rampZOffset * rampIncline;
                    this.map.getBackLeftVertex({ cell: currentCell }).y = (rampZOffset + 1) * rampIncline;
                    this.map.getBackRightVertex({ cell: currentCell }).y = (rampZOffset + 1) * rampIncline;
                }
            }
            for (let rampXOffset = 0; rampXOffset <= 1; ++rampXOffset) {
                for (let rampZOffset = 1; rampZOffset <= 5; ++rampZOffset) {
                    let currentCell = this.map.getCell({ x: wholeRampXOffset - rampXOffset, z: -9 - rampZOffset });
                    this.map.getFrontLeftVertex({ cell: currentCell }).y = (rampIncline * 7.0) - rampZOffset * rampIncline;
                    this.map.getFrontRightVertex({ cell: currentCell }).y = (rampIncline * 7.0) - rampZOffset * rampIncline;
                    this.map.getBackLeftVertex({ cell: currentCell }).y = (rampIncline * 7.0) - (rampZOffset + 1) * rampIncline;
                    this.map.getBackRightVertex({ cell: currentCell }).y = (rampIncline * 7.0) - (rampZOffset + 1) * rampIncline;
                }
            }
            this.map.getFrontLeftVertex({ cell: this.map.getCell({ x: wholeRampXOffset - 1, z: -15 }) }).y = rampIncline;
            this.map.getFrontRightVertex({ cell: this.map.getCell({ x: wholeRampXOffset - 1, z: -15 }) }).y = rampIncline;
            this.map.getFrontLeftVertex({ cell: this.map.getCell({ x: wholeRampXOffset, z: -15 }) }).y = rampIncline;
            this.map.getFrontRightVertex({ cell: this.map.getCell({ x: wholeRampXOffset, z: -15 }) }).y = rampIncline;
        }
        this.map.updateCells({ lowX: this.map.minX, lowZ: this.map.minZ, highX: this.map.maxX, highZ: this.map.maxZ });
        this.scene.add(this.map.mesh);
        //Game models.
        this.setupGameModels();
        //Game objects.
        //Groups.
        this.gameObjects = new THREE.Group();
        //Unclickables.
        this.unclickableObjects = new THREE.Group();
        this.indicatorObjects = new THREE.Group();
        this.doodadObjects = new THREE.Group();
        //Clickables.
        this.clickableObjects = new THREE.Group();
        this.playerObjects = new THREE.Group();
        //Group hierarchy.
        this.scene.add(this.gameObjects);
        this.gameObjects.add(this.unclickableObjects);
        this.gameObjects.add(this.clickableObjects);
        this.unclickableObjects.add(this.indicatorObjects);
        this.unclickableObjects.add(this.doodadObjects);
        this.clickableObjects.add(this.playerObjects);
    }

    deconstruct() {
        this.isDeconstructing = true;

        //Geometries, materials, textures, render targets, scenes, and anything else with dispose().

        for (let selectionCircleModel of this.selectionCircleModelsMap.keys()) {
            selectionCircleModel.deconstruct();
        }
        this.selectionCircleModelsMap.clear();

        this.squareModel.deconstruct();
        this.sheepModel.deconstruct();
        this.wolfModel.deconstruct();
        this.buildingModel.deconstruct();

        DisposeThreeObject(this.scene);
        DisposeThreeObject(this.renderer);
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.aspectRatio = window.innerWidth / window.innerHeight;

        this.setupResizeGameModels();
    }

    //Make sure to update deconstruct!
    setupResizeGameModels() {
        //TODO: Really all selection circles will have to be recreated, and/or all objects deselected, here.
        for (let selectionCircleModel of this.selectionCircleModelsMap.keys()) {
            selectionCircleModel.deconstruct();
        }
        this.selectionCircleModelsMap.clear();
        this.selectionCircleMaterial = new MeshLineMaterial({
            color: 'blue',
            resolution: new THREE.Vector2(this.canvas.width, this.canvas.height),
            sizeAttenuation: 0,
            lineWidth: 5.0,
            opacity: 0.5,
            transparent: true
        });
        for (let halfXZSize of CommonUnitHalfSizes) {
            this.selectionCircleModelsMap.set(halfXZSize, new GameModel({
                world: this,
                geometry: CircleGeometriesMap.get(halfXZSize),
                material: this.selectionCircleMaterial,
                xzSize: halfXZSize * 2.0,
                ySize: 0.0
            }));
        }
    }

    //Make sure to update deconstruct!
    setupGameModels() {
        this.squareModel = new GameModel({
            world: this,
            geometry: SquareGeometry,
            xzSize: CellSize,
            ySize: 0.0
        });

        this.sheepModel = new GameModel({
            world: this,
            geometry: TinySphereGeometry,
            material: new THREE.MeshPhongMaterial({ color: '#777' }),
            xzSize: TinySize,
            ySize: TinySize
        });
        this.wolfModel = new GameModel({
            world: this,
            geometry: SmallSphereGeometry,
            material: new THREE.MeshPhongMaterial({ color: '#555' }),
            xzSize: SmallSize,
            ySize: SmallSize
        });

        this.buildingModel = new GameModel({
            world: this,
            geometry: SmallCubeGeometry,
            material: new THREE.MeshPhongMaterial({ color: 'black' }),
            xzSize: SmallSize,
            ySize: SmallSize
        });
    }

    graphicsLoop() {
        if (this.isDeconstructing) {
            return;
        }
        this.renderer.render(this.scene, this.camera);
        this.onUpdate();
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

    getNormalizedCanvasMouse(event) {
        let canvasRect = this.canvas.getBoundingClientRect();
        let normalizedX = (event.clientX - canvasRect.left) / canvasRect.width * 2.0 - 1.0;
        let normalizedY = (event.clientY - canvasRect.top) / canvasRect.height * -2.0 + 1.0;
        return { x: normalizedX, y: normalizedY };
    }
}