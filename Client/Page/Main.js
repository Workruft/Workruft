window.THREE = require('three');
window.MeshLine = require('threejs-meshline');
window.Enums = require('../Game/Globals/Enums');

import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
tippy('#mapEditToolPanel>button,label', {
    content: function(element) {
        return `<p class='tooltip'>${element.getAttribute('data-tippy-title')}</p>`
    },
    allowHTML: true,
    placement: 'left',
    duration: 0,
    delay: 0,
    theme: 'material'
});

require('../../Common/Version');
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