let GameMap = require('../../GameMap');

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
        //Load and Save handlers.
        let mapFileReader = new FileReader();
        mapFileReader.onabort = function(event) {
            alert('Reading map file was aborted: ' + mapFileReader.error);
        };
        mapFileReader.onerror = function(event) {
            alert('Error reading map file: ' + mapFileReader.error);
        };
        mapFileReader.onload = function(event) {
            try {
                let mapArray = JSON.parse(mapFileReader.result);
                this.loadMapFile(mapArray.data);
            } catch (e) {
                alert('Error parsing map file: ' + e);
                throw e;
            }
        }.bind(this);
        HTML.loadMapFromFileButton.onchange = function(event) {
            mapFileReader.readAsText(event.target.files[0]);
        };
        HTML.saveMapToFileButton.onclick = this.saveMapFile;

        //Increase/Decrease Long/Lat handlers.
        Array.from(document.getElementsByClassName('terrainEditSizeButtons')).forEach(
            function (terrainEditSizeButton) {
                terrainEditSizeButton.onclick = function(event) {
                    let multiplier = 1.0 * (event.ctrlKey ? 4.0 : 1.0) * (event.shiftKey ? 8.0 : 1.0);
                    switch (terrainEditSizeButton.id) {
                        case 'increaseLatButton':
                            this.workruft.editingLatSize =
                                Math.min(MaxEditingLatSize, this.workruft.editingLatSize + CellSize * multiplier);
                            break;
                        case 'increaseLongButton':
                            this.workruft.editingLongSize =
                                Math.min(MaxEditingLongSize, this.workruft.editingLongSize + CellSize * multiplier);
                            break;
                        case 'decreaseLatButton':
                            this.workruft.editingLatSize =
                                Math.max(MinEditingLatSize, this.workruft.editingLatSize - CellSize * multiplier);
                            break;
                        case 'decreaseLongButton':
                            this.workruft.editingLongSize =
                                Math.max(MinEditingLongSize, this.workruft.editingLongSize - CellSize * multiplier);
                            break;
                        default:
                            alert('Unhandled terrain editing size button!');
                            break;
                    }
                    this.onDocumentMouseMove();
                    //Reset terrain editing data.
                    this.workruft.resetTerrainEditing();
                    this.workruft.updateStatusBox();
                }.bind(this);
            }.bind(this)
        );

        //Terrain height handlers.
        let selectedButtonClass = 'selectedButton';
        this.selectedTerrainModeButton = null;
        Array.from(document.getElementsByClassName('terrainModeButtons')).forEach(
            function (terrainModeButton) {
                terrainModeButton.onclick = function(event) {
                    this.workruft.terrainEditingMode = terrainEditingIDs[terrainModeButton.id];
                    if (this.selectedTerrainModeButton != null) {
                        this.selectedTerrainModeButton.classList.remove(selectedButtonClass);
                    }
                    this.selectedTerrainModeButton = terrainModeButton;
                    this.selectedTerrainModeButton.classList.add(selectedButtonClass);
                    this.onDocumentMouseMove();
                    this.workruft.updateStatusBox();
                }.bind(this);
            }.bind(this)
        );
        this.selectedTerrainModeButton = HTML.increaseHeightButton;
        HTML.increaseHeightButton.classList.add(selectedButtonClass);
    },

    loadMapFile(mapArray) {
        try {
            let newMap = GameMap.fromArray(mapArray);
            this.workruft.world.changeMap(newMap);
        } catch (e) {
            alert('Error attempting to reconstruct map from file: ' + e);
            throw e;
        }
    },

    saveMapFile() {
        let mapArray = this.map.toArray();
        let mapFileBlob = new Blob([ JSON.stringify(mapArray) ], { type: 'application/json' });
        let downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(mapFileBlob);
        downloadLink.download = 'WorkruftMap.json';
        document.body.append(downloadLink);
        downloadLink.click();
        setTimeout(function() {
            document.body.removeChild(downloadLink);
            window.URL.revokeObjectURL(downloadLink.href);
        }, 0);
    }
};