class InputBindings {
    constructor() {
        //Key down's.
        this.MoveCameraUp = 'W';
        this.MoveCameraRight = 'D';
        this.MoveCameraDown = 'S';
        this.MoveCameraLeft = 'A';
        this.RotateCameraClockwise = 'Q';
        this.RotateCameraCounterclockwise = 'E';

        //Key press's.
        this.ToggleChat = 'Enter';
        this.CancelChat = 'Escape';
        this.ToggleMapEditor = 'M';
        this.TogglePathTesting = 'P';

        //Mouse button down's. Left: 0, Middle: 1, Right: 2.

        //Mouse button click's. Left: 0, Middle: 1, Right: 2.
        this.SelectUnitButton = 0;
        this.MiscellaneousButton = 1;
        this.OrderUnitButton = 2;
        this.TerrainActivityButton = 2;
    }
}

module.exports = InputBindings;