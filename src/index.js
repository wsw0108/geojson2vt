'use strict';

module.exports = geojson2vt;

var convert = require('./convert'),     // GeoJSON conversion and preprocessing
    transform = require('./transform'), // coordinate transformation
    clip = require('./clip'),           // stripe clipping algorithm
    wrap = require('./wrap'),           // date line processing
    createTile = require('./tile');     // final simplified tile generation


function transformZXYToMercator(z, x, y) {
    return [z, x, y];
}

var defaultOptions = {
    // projectPoint: projectMecator,
    transformZXY: transformZXYToMercator,
    maxZoom: 14,            // max zoom to preserve detail on
    tolerance: 3,           // simplification tolerance (higher means simpler)
    extent: 4096,           // tile extent
    buffer: 64,             // tile buffer on each side
    debug: 0                // logging level (0, 1 or 2)
};

function geojson2vt(data, z, x, y, options) {
    options = extend(Object.create(defaultOptions), options);

    var debug = options.debug;

    if (debug) console.time('preprocess data');

    if (options.maxZoom < 0 || options.maxZoom > 24) throw new Error('maxZoom should be in the 0-24 range');

    var z2 = 1 << options.maxZoom, // 2^z
        features = convert(data, options.tolerance / (z2 * options.extent), options.projectPoint);

    if (debug) {
        console.timeEnd('preprocess data');
        console.time('generate tile');
    }

    features = wrap(features, options.buffer / options.extent);

    var tile;
    if (features.length) tile = generateTile(features, z, x, y, options);

    if (debug) {
        if (tile) console.log('features: %d, points: %d', tile.numFeatures, tile.numPoints);
        console.timeEnd('generate tile');
    }

    return tile ? transform.tile(tile, options.extent) : null;
}

function generateTile(features, z, x, y, options) {
    var debug = options.debug;

    var zxy = options.transformZXY(z, x, y);
    z = zxy[0];
    x = zxy[1];
    y = zxy[2];

    if (z < 0 || z > 24) return null;

    var z2 = 1 << z;
    x = ((x % z2) + z2) % z2; // wrap tile x coordinate

    var tileMinX = 2,
        tileMinY = 1,
        tileMaxX = -1,
        tileMaxY = 0;
    for (var i = 0; i < features.length; i++) {
        var minX = features[i].minX;
        var minY = features[i].minY;
        var maxX = features[i].maxX;
        var maxY = features[i].maxY;

        if (minX < tileMinX) tileMinX = minX;
        if (minY < tileMinY) tileMinY = minY;
        if (maxX > tileMaxX) tileMaxX = maxX;
        if (maxY > tileMaxY) tileMaxY = maxY;
    }

    if (debug > 1) console.time('clipping');

    // values we'll use for clipping
    var k1 = options.buffer / options.extent,
        k2 = 1 + k1,
        clipped = features;

    clipped = clip(clipped, z2, x - k1, x + k2, 0, tileMinX, tileMaxX);
    clipped = clip(clipped, z2, y - k1, y + k2, 1, tileMinY, tileMaxY);

    if (debug > 1) console.timeEnd('clipping');

    if (!clipped) return null;

    var tileTolerance = z === options.maxZoom ? 0 : options.tolerance / (z2 * options.extent);

    if (debug > 1) console.time('creation');

    var tile = createTile(clipped, z2, x, y, tileTolerance, z === options.maxZoom);

    if (debug) {
        if (debug > 1) {
            console.log('tile z%d-%d-%d (features: %d, points: %d, simplified: %d)',
                z, x, y, tile.numFeatures, tile.numPoints, tile.numSimplified);
            console.timeEnd('creation');
        }
    }

    return tile;
}

function extend(dest, src) {
    for (var i in src) dest[i] = src[i];
    return dest;
}
