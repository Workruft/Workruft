let terrainEditingIDs = Enums.create({
    items: [
        'decreaseHeightButton', 'increaseHeightButton',
        'flattenHeightButton', 'raiseHeightButton',
        'levelHeightButton', 'cloneHeightButton',
        'longRampButton', 'latRampButton'
    ]
});

module.exports = {
    setupTerrainButtons: function() {
        //Increase/Decrease Long/Lat handlers.
        Array.from(document.getElementsByClassName('terrainEditSizeButtons')).forEach(
            function (terrainEditSizeButton) {
                terrainEditSizeButton.onclick = function(event) {
                    switch (terrainEditSizeButton.id) {
                        case 'increaseLatButton':
                            //Note: Increasing this is no problem, except that that's a lot of ColoredSquares to draw
                            //lol...
                            this.workruft.editingLatSize = Math.min(32, this.workruft.editingLatSize + 1);
                            break;
                        case 'increaseLongButton':
                            //Note: Increasing this is no problem, except that that's a lot of ColoredSquares to draw
                            //lol...
                            this.workruft.editingLongSize = Math.min(32, this.workruft.editingLongSize + 1);
                            break;
                        case 'decreaseLatButton':
                            this.workruft.editingLatSize = Math.max(1, this.workruft.editingLatSize - 1);
                            break;
                        case 'decreaseLongButton':
                            this.workruft.editingLongSize = Math.max(1, this.workruft.editingLongSize - 1);
                            break;
                        default:
                            alert('Unhandled terrain edit size button!');
                            break;
                    }
                    this.onDocumentMouseMove();
                    this.workruft.updateStatusBox();
                }.bind(this);
            }.bind(this)
        );

        //Terrain height handlers.
        Array.from(document.getElementsByClassName('terrainModeButtons')).forEach(
            function (terrainModeButton) {
                let terrainEditingMode;
                //terrainEditingMode = Enums.TerrainEditingModes.IncreaseHeight;
                terrainModeButton.onclick = function(event) {
                    //TODO: Don't alert; handle.
                    alert(terrainModeButton.getAttribute('data-tippy-title'));
                    alert(Enums.TerrainEditingModes[terrainEditingIDs[terrainModeButton.id]]);
                };
            }
        );
    }
};