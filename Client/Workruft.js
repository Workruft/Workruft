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
        for (let i = 0; i < this.world.customCubes.length; ++i) {
            this.world.customCubes[i].rotation.x += 0.01;
            this.world.customCubes[i].rotation.y += 0.01;
        }
        this.world.sphere.position.set(
            15.0 * Math.cos(elapsedTimeMS * 0.001),
            5.0 * Math.sin(elapsedTimeMS * 0.0001),
            5.0 * Math.sin(elapsedTimeMS * 0.001) + 10.0);
    }
}