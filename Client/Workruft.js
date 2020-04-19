class Workruft {
    constructor() {
        this.chat = new Chat();
        this.network = new Network(this.chat);
        this.world = new World(this.chat, this.onUpdate.bind(this));
    }

    start() {
        this.onSetup();

        //Hand over control.
        this.world.graphicsLoop();
    }

    onSetup() {
        //this.network.connect();
    }

    onUpdate(elapsedTimeMS) {
        this.world.camera.position.set(
            75.0 * Math.cos(elapsedTimeMS * 0.0002),
            100,
            75.0 * Math.sin(elapsedTimeMS * 0.0002));
        this.world.camera.lookAt(
            50.0 * Math.cos(elapsedTimeMS * 0.0002),
            50,
            50.0 * Math.sin(elapsedTimeMS * 0.0002));
    }
}