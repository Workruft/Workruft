//These functions are all basically just to ensure the IHGameMouse functions operate smoothly in the HTML environment.
module.exports = {
    onDocumentMouseDown(event) {
        if (event.target == HTML.gameCanvas) {
            return;
        }
        if (event.target.classList != null && event.target.classList.contains('maintainCanvasMouse')) {
            this.onMouseDown(new MouseEvent('mousedown', event));
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
            this.onMouseUp(new MouseEvent('mouseup', event));
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    },

    onDocumentWheel(event) {
        if (event.target == HTML.gameCanvas) {
            return;
        }
        this.onWheel(new WheelEvent('wheel', event));
        event.preventDefault();
        event.stopPropagation();
        return false;
    },

    onDocumentMouseMove(event) {
        if (event && event.target == HTML.gameCanvas) {
            return;
        }
        if (!RateLimitRecall({
            callingFunction: this.onDocumentMouseMove,
            minimumInterval: 1000.0 / 30.0,
            thisToBind: this,
            paramsToPass: event
        })) {
            return;
        }
        let newEvent;
        if (event && event.target.classList != null && event.target.classList.contains('maintainCanvasMouse')) {
            this.onMouseMove(new MouseEvent('mousemove', event));
        } else {
            newEvent = new MouseEvent('mousemove', {
                clientX: window.innerWidth * 0.5,
                clientY: window.innerHeight * 0.5,
                screenX: window.screenX + window.innerWidth * 0.5,
                screenY: window.screenY + window.innerHeight * 0.5
            });
            newEvent.isMouseOutEvent = true;
            this.onMouseMove(newEvent);
        }
    },

    onDocumentMouseOut(event) {
        this.onMouseOut(new MouseEvent('mouseout', event));
        event.preventDefault();
        event.stopPropagation();
        return false;
    },

    onDocumentMouseOver(event) {
        this.onMouseOver(new MouseEvent('mouseover', event));
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
};