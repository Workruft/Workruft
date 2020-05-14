let game = new Workruft();
document.addEventListener('beforeunload', DestroyAll);
function DestroyAll() {
    game.deconstruct();
    DeconstructPrimitives();
    delete game;
}
game.start();