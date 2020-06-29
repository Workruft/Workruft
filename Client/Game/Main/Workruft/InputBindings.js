class InputBindings {
    constructor() {
        //Key down's.
        this.MoveCameraUp = 'w';
        this.MoveCameraRight = 'd';
        this.MoveCameraDown = 's';
        this.MoveCameraLeft = 'a';
        this.RotateCameraClockwise = 'q';
        this.RotateCameraCounterclockwise = 'e';

        //Key press's.
        this.ToggleChat = 'Enter';
        this.CancelChat = 'Escape';
        this.ToggleMapEditor = 'm';
        this.TogglePathTesting = 'p';

        //Mouse button down's. Left: 0, Middle: 1, Right: 2.

        //Mouse button click's. Left: 0, Middle: 1, Right: 2.
        this.SelectUnitButton = 0;
        this.MiscellaneousButton = 1;
        this.OrderUnitButton = 2;
        this.TerrainActivityButton = 2;
    }
}

module.exports = InputBindings;