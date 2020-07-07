globalThis.IsUndefined = function(checkMe) {
    return typeof checkMe === 'undefined';
};

globalThis.IsDefined = function(checkMe) {
    return typeof checkMe !== 'undefined';
};