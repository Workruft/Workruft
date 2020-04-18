class Workruft {
    constructor() {
        this.chat = new Chat();
        this.network = new Network(this.chat);
        //this.network.connect();
        this.world = new World(this.chat);
    }
}