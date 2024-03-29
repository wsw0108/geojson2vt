'use strict';

module.exports = convert;

var simplify = require('./simplify');
var createFeature = require('./feature');

// converts GeoJSON feature into an intermediate projected JSON vector format with simplification data

function convert(data, tolerance, projectPoint) {
    projectPoint = projectPoint || projectMecator;
    var features = [];

    if (data.type === 'FeatureCollection') {
        for (var i = 0; i < data.features.length; i++) {
            convertFeature(features, data.features[i], tolerance, projectPoint);
        }

    } else if (data.type === 'Feature') {
        convertFeature(features, data, tolerance, projectPoint);

    } else {
        // single geometry or a geometry collection
        convertFeature(features, {geometry: data}, tolerance, projectPoint);
    }

    return features;
}

function convertFeature(features, geojson, tolerance, projectPoint) {
    if (!geojson.geometry) return;

    var coords = geojson.geometry.coordinates;
    var type = geojson.geometry.type;
    var tol = tolerance * tolerance;
    var geometry = [];

    if (type === 'Point') {
        convertPoint(coords, geometry, projectPoint);

    } else if (type === 'MultiPoint') {
        for (var i = 0; i < coords.length; i++) {
            convertPoint(coords[i], geometry, projectPoint);
        }

    } else if (type === 'LineString') {
        convertLine(coords, geometry, tol, projectPoint, false);

    } else if (type === 'MultiLineString') {
        convertLines(coords, geometry, tol, projectPoint, false);

    } else if (type === 'Polygon') {
        convertLines(coords, geometry, tol, projectPoint, true);

    } else if (type === 'MultiPolygon') {
        for (i = 0; i < coords.length; i++) {
            var polygon = [];
            convertLines(coords[i], polygon, tol, projectPoint, true);
            geometry.push(polygon);
        }
    } else if (type === 'GeometryCollection') {
        for (i = 0; i < geojson.geometry.geometries.length; i++) {
            convertFeature(features, {
                geometry: geojson.geometry.geometries[i],
                properties: geojson.properties
            }, tolerance, projectPoint);
        }
        return;
    } else {
        throw new Error('Input data is not a valid GeoJSON object.');
    }

    features.push(createFeature(geojson.id, type, geometry, geojson.properties));
}

function convertPoint(coords, out, projectPoint) {
    var p = projectPoint(coords);
    out.push(p[0]);
    out.push(p[1]);
    out.push(0);
}

function convertLine(ring, out, tol, projectPoint, isPolygon) {
    var x0, y0;
    var size = 0;

    for (var j = 0; j < ring.length; j++) {
        var p = projectPoint(ring[j]);
        var x = p[0];
        var y = p[1];

        out.push(x);
        out.push(y);
        out.push(0);

        if (j > 0) {
            if (isPolygon) {
                size += (x0 * y - x * y0) / 2; // area
            } else {
                size += Math.sqrt(Math.pow(x - x0, 2) + Math.pow(y - y0, 2)); // length
            }
        }
        x0 = x;
        y0 = y;
    }

    var last = out.length - 3;
    out[2] = 1;
    simplify(out, 0, last, tol);
    out[last + 2] = 1;

    out.size = Math.abs(size);
}

function convertLines(rings, out, tol, projectPoint, isPolygon) {
    for (var i = 0; i < rings.length; i++) {
        var geom = [];
        convertLine(rings[i], geom, tol, projectPoint, isPolygon);
        out.push(geom);
    }
}

function projectMecator(p) {
    return [projectX(p[0]), projectY(p[1])];
}

function projectX(x) {
    return x / 360 + 0.5;
}

function projectY(y) {
    var sin = Math.sin(y * Math.PI / 180);
    var y2 = 0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI;
    return y2 < 0 ? 0 : y2 > 1 ? 1 : y2;
}
