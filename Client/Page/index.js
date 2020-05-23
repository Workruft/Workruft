document.addEventListener('beforeunload', DestroyAll);
window.game = new Workruft();
function DestroyAll() {
    if (window.game != null) {
        window.game.deconstruct();
        DeconstructPrimitives();
        delete window.game;
    }
}