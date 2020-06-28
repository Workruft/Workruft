//These functions are all basically just to ensure the IHGameMouse functions operate smoothly in the HTML environment.
module.exports = {
    onDocumentMouseDown(event) {
        if (event.target == HTML.gameCanvas) {
            return;
        }
        if (event.target.classList != null && event.target.classList.contains('maintainCanvasMouse')) {
            let newEvent = new MouseEvent('mousedown', event);
            HTML.gameCanvas.dispatchEvent(newEvent);
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    },

    onDocumentMouseUp(event) {
        if (event.target == HTML.gameCanvas) {
            return;
        }
        if (event.target.classList != null && event.target.classList.contains('maintainCanvasMouse')) {
            let newEvent = new MouseEvent('mouseup', event);
            HTML.gameCanvas.dispatchEvent(newEvent);
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    },

    onDocumentWheel(event) {
        if (event.target == HTML.gameCanvas) {
            return;
        }
        let newEvent = new WheelEvent('wheel', event);
        HTML.gameCanvas.dispatchEvent(newEvent);
        event.preventDefault();
        event.stopPropagation();
        return false;
    },

    onDocumentMouseMove(event) {
        if (event && event.target == HTML.gameCanvas) {
            return;
        }
        let newEvent;
        if (event && event.target.classList != null && event.target.classList.contains('maintainCanvasMouse')) {
            newEvent = new MouseEvent('mousemove', event);
        } else {
            newEvent = new MouseEvent('mousemove', {
                clientX: window.innerWidth * 0.5,
                clientY: window.innerHeight * 0.5,
                screenX: window.screenX + window.innerWidth * 0.5,
                screenY: window.screenY + window.innerHeight * 0.5
            });
        }
        HTML.gameCanvas.dispatchEvent(newEvent);
    }
};