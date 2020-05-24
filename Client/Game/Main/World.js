//Directions:
//  -Z    /\+Y
//-X  +X  ||
//  +Z    \/-Y

class World {
    constructor(chat) {
        this.chat = chat;
        this.boundGraphicsLoop = this.graphicsLoop.bind(this);

        //WebGL.
        this.canvas = HTML.gameCanvas;
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.effectComposer = new EffectComposer(this.renderer);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.physicallyCorrectLights = true;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.selectionCircleModelsMap = new Map();
        this.selectedObjects = new Set();
        this.onResize();
        window.addEventListener('resize', this.onResize.bind(this));

        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        //Lights.
        // this.ambientLight = new THREE.AmbientLight('white', 1.0);
        // this.scene.add(this.ambientLight);
        //"Sun".
        this.spotLight = new THREE.SpotLight('white', 1.0);
        this.spotLight.castShadow = true;
        this.spotLight.position.set(0, 150, 0);
        this.spotLight.power = 2000;
        this.spotLight.shadow.mapSize.width = 2048.0;
        this.spotLight.shadow.mapSize.height = 2048.0;
        this.spotLight.shadow.camera.near = 1;
        this.spotLight.shadow.camera.far = 500;
        this.spotLight.shadow.bias = 0.0001;
        this.spotLight.penumba = 0.0;
        this.spotLight.angle = Math.PI / 3;
        this.spotLight.distance = 500;
        this.scene.add(this.spotLight);
        //To see the spot light's shadow camera bounds.
        // this.scene.add(new THREE.CameraHelper(this.spotLight.shadow.camera));

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

        //Post-processing.
        let renderPass = new RenderPass(this.scene, this.camera);
        // renderPass.renderToScreen = true;
        this.effectComposer.addPass(renderPass);
        let unrealBloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.2, 0.4, 0.0);
        this.effectComposer.addPass(unrealBloomPass);
        let smaaPass = new SMAAPass(window.innerWidth * this.renderer.getPixelRatio(), window.innerHeight * this.renderer.getPixelRatio());
        smaaPass.renderToScreen = true;
        this.effectComposer.addPass(smaaPass);
        // let copyPass = new ShaderPass(CopyShader);
        // copyPass.renderToScreen = true;
        // this.effectComposer.addPass(copyPass);

        //Action.
        //Map.
        this.map = new GameMap(50, 50);
        let currentCell;
        //Rampsnstuff.
        let rampIncline = 0.5;
        for (let wholeRampXOffset = -8; wholeRampXOffset <= 8; wholeRampXOffset += 4) {
            this.map.setBackLeftHeight({ cell: this.map.getCell({ x: wholeRampXOffset - 1, z: -4 }), height: rampIncline });
            this.map.setBackRightHeight({ cell: this.map.getCell({ x: wholeRampXOffset - 1, z: -4 }), height: rampIncline });
            this.map.setBackLeftHeight({ cell: this.map.getCell({ x: wholeRampXOffset, z: -4 }), height: rampIncline });
            this.map.setBackRightHeight({ cell: this.map.getCell({ x: wholeRampXOffset, z: -4 }), height: rampIncline });
            for (let rampXOffset = 0; rampXOffset <= 1; ++rampXOffset) {
                for (let rampZOffset = 1; rampZOffset <= 5; ++rampZOffset) {
                    let currentCell = this.map.getCell({ x: wholeRampXOffset - rampXOffset, z: -4 - rampZOffset });
                    this.map.setFrontLeftHeight({ cell: currentCell, height: rampZOffset * rampIncline });
                    this.map.setFrontRightHeight({ cell: currentCell, height: rampZOffset * rampIncline });
                    this.map.setBackLeftHeight({ cell: currentCell, height: (rampZOffset + 1) * rampIncline });
                    this.map.setBackRightHeight({ cell: currentCell, height: (rampZOffset + 1) * rampIncline });
                }
            }
            for (let rampXOffset = 0; rampXOffset <= 1; ++rampXOffset) {
                for (let rampZOffset = 1; rampZOffset <= 5; ++rampZOffset) {
                    let currentCell = this.map.getCell({ x: wholeRampXOffset - rampXOffset, z: -9 - rampZOffset });
                    this.map.setFrontLeftHeight({ cell: currentCell, height: (rampIncline * 7.0) - rampZOffset * rampIncline });
                    this.map.setFrontRightHeight({ cell: currentCell, height: (rampIncline * 7.0) - rampZOffset * rampIncline });
                    this.map.setBackLeftHeight({ cell: currentCell, height: (rampIncline * 7.0) - (rampZOffset + 1) * rampIncline });
                    this.map.setBackRightHeight({ cell: currentCell, height: (rampIncline * 7.0) - (rampZOffset + 1) * rampIncline });
                }
            }
            this.map.setFrontLeftHeight({ cell: this.map.getCell({ x: wholeRampXOffset - 1, z: -15 }), height: rampIncline });
            this.map.setFrontRightHeight({ cell: this.map.getCell({ x: wholeRampXOffset - 1, z: -15 }), height: rampIncline });
            this.map.setFrontLeftHeight({ cell: this.map.getCell({ x: wholeRampXOffset, z: -15 }), height: rampIncline });
            this.map.setFrontRightHeight({ cell: this.map.getCell({ x: wholeRampXOffset, z: -15 }), height: rampIncline });
        }
        this.map.updateCells({ lowX: this.map.minX, lowZ: this.map.minZ, highX: this.map.maxX, highZ: this.map.maxZ });
        this.scene.add(this.map.topMesh);
        this.scene.add(this.map.sideMesh);
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

        this.deselectAll();
        for (let selectionCircleModel of this.selectionCircleModelsMap.values()) {
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
        this.effectComposer.setSize(window.innerWidth, window.innerHeight);
        this.aspectRatio = window.innerWidth / window.innerHeight;

        //Update the camera aspect ratio if needed.
        if (IsDefined(this.camera)) {
            this.camera.aspect = this.aspectRatio;
        }

        this.setupResizeGameModels();
    }

    //Make sure to update deconstruct!
    setupResizeGameModels() {
        this.deselectAll();
        for (let selectionCircleModel of this.selectionCircleModelsMap.values()) {
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
            material: new THREE.MeshPhongMaterial({ color: '#666' }),
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
        // this.renderer.render(this.scene, this.camera);
        this.effectComposer.render();
        requestAnimationFrame(this.boundGraphicsLoop);
    }

    deselectAll() {
        for (let selectedObject of this.selectedObjects) {
            selectedObject.deselect();
        }
        this.selectedObjects.clear();
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
        //TODO: If this yields nothing, use this.mapRaycaster.ray.intersectPlane() and bound the point to the map.
        return this.mapRaycaster.intersectObjects([ this.map.topMesh, this.map.sideMesh ], true);
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