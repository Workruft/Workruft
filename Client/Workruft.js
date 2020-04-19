class Workruft {
    constructor() {
        this.chat = new Chat();
        this.network = new Network(this.chat);
        this.world = new World(this.chat, this.onUpdate);
    }

    start() {
        this.onSetup();

        //Hand over control.
        this.world.graphicsLoop();
    }

    onSetup() {
        //this.network.connect();
    }

    onUpdate() {

    }
}