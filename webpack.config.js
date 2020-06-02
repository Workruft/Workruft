let path = require('path');
let webpack = require('webpack');

module.exports = {
    entry: './Client/Main',
    output: {
        filename: 'Webpack.js',
        path: path.resolve(__dirname, 'Release')
    },
    mode: 'development',
    plugins: [
        new webpack.ProvidePlugin({
            THREE: 'three/src/Three',
            Enums: path.resolve(__dirname, 'Client/Game/Globals/Enums')
        }),
    ]
};