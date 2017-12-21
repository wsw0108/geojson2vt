'use strict';

var test = require('tape');
var fs = require('fs');
var path = require('path');
var geojson2vt = require('../src/index');

var square = [{
    geometry: [[[-64, 4160], [-64, -64], [4160, -64], [4160, 4160], [-64, 4160]]],
    type: 3,
    tags: {name: 'Pennsylvania', density: 284.3},
    id: '42'
}];

test('getTile: us-states.json', function (t) {
    // var log = console.log;

    console.log = function () {};
    var data = getJSON('us-states.json');
    var options = {debug: 2};

    // console.log = log;

    t.same(geojson2vt(data, 7, 37, 48, options).features, getJSON('us-states-z7-37-48.json'), 'z7-37-48');

    t.same(geojson2vt(data, 9, 148, 192, options).features, square, 'z9-148-192 (clipped square)');
    // t.same(geojson2vt(data, 11, 592, 768, options).features, square, 'z11-592-768 (clipped square)');

    t.equal(geojson2vt(data, 11, 800, 400, options), null, 'non-existing tile');
    t.equal(geojson2vt(data, -5, 123.25, 400.25, options), null, 'invalid tile');
    t.equal(geojson2vt(data, 25, 200, 200, options), null, 'invalid tile');

    t.end();
});

function getJSON(name) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '/fixtures/' + name)));
}
