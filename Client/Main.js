require('../Common/StatusCodes');

require('./Game/Globals/Globals');
require('./Game/Globals/PathingGlobals');
require('./Game/Globals/Primitives');

let Workruft = require('./Game/Main/Workruft/Workruft');

document.addEventListener('beforeunload', DestroyAll);
window.game = new Workruft();
function DestroyAll() {
    if (window.game != null) {
        window.game.deconstruct();
        DeconstructPrimitives();
        delete window.game;
    }
}