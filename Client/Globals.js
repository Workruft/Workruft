let CellSize = 1.0;
let HalfCellSize = CellSize * 0.5;
let MapBottomY = -CellSize;
let MapMinimumHeight = 0.0;
let MinCameraHeight = 30.0;
let MaxCameraHeight = 500.0;

// Store all of the HTML DOM elements in the body of the page as an HTMLCollection.
// Any element with an ID can now simply be accessed by HTML.theID or HTML['theID'].
// This HTMLCollection can also be iterated through, via.: for (... of ...) { }.
// Note that this HTMLCollection is live/dynamic, it changes in sync with the DOM.
// If accessing HTML elements by class, use:
// Array.from(document.getElementsByClassName('className')).forEach(function (className) {
let HTML = document.body.getElementsByTagName('*');