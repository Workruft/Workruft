window.THREE = require('three');
window.MeshLine = require('threejs-meshline');
window.Enums = require('../Game/Globals/Enums');

require('../../Common/StatusCodes');

require('../Game/Globals/Globals');
require('../Game/Globals/PathingGlobals');
require('../Game/Globals/Primitives');

window.onload = function() {
    require('../Game/Globals/PageLoadedGlobals');

    let Workruft = require('../Game/Main/Workruft/Workruft');

    document.addEventListener('beforeunload', DestroyAll);
    window.game = new Workruft();
    function DestroyAll() {
        if (window.game != null) {
            window.game.deconstruct();
            DeconstructPrimitives();
            delete window.game;
        }
    }
};