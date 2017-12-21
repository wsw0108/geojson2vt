'use strict';

var test = require('tape');
var geojson2vt = require('../src/index');

var data = {
    type: 'FeatureCollection',
    features: [
        {
            id: 1,
            type: 'Feature',
            properties: {
                position: 'top-left'
            },
            geometry: {
                type: 'Point',
                coordinates: [-10, 10]
            }
        },
        {
            id: 2,
            type: 'Feature',
            properties: {
                position: 'top-right'
            },
            geometry: {
                type: 'Point',
                coordinates: [10, 10]
            }
        },
        {
            id: 3,
            type: 'Feature',
            properties: {
                position: 'buttom-left'
            },
            geometry: {
                type: 'Point',
                coordinates: [-10, -10]
            }
        },
        {
            id: 4,
            type: 'Feature',
            properties: {
                position: 'buttom-right'
            },
            geometry: {
                type: 'Point',
                coordinates: [10, -10]
            }
        }
    ]
};

/* a custom projection
-------------------------------------
|(0,0)/(-180/90)     (1,0)/(180/90) |
|                                   |
|                 o(0.5,0.5)/(0,0)  |
|                                   |
|(0,1)/-180/-90)     (1,1)/(180,-90)|
------------------------------------
 */
function projectPoint(p) {
    var x = p[0] / 360 + 0.5;
    var y = 0.5 - p[1] / 180;
    return [x, y];
}

test('custom projection', function (t) {
    var tile = geojson2vt(data, 1, 0, 0, {
        projectPoint: projectPoint
    });

    t.same(tile.features, [{
        geometry: [[3868, 3641]],
        type: 1,
        tags: {position: 'top-left'},
        id: 1
    }]);

    t.end();
});

/* a custom tile schema
z0:
-------
| 0,0 |
-------

z1:
-----------------
| -1,0  |  0,0  |
-----------------
| -1,-1 |  0,-1 |
-----------------
 */
function transformZXY(z, x, y) {
    var offset = Math.pow(2, z - 1);
    x = x + offset;
    y = -y + offset - 1;
    return [z, x, y];
}

test('custom tile-schema', function (t) {
    var tl = geojson2vt(data, 1, -1, 0, {
        transformZXY: transformZXY
    });
    var tr = geojson2vt(data, 1, 0, 0, {
        transformZXY: transformZXY
    });
    var bl = geojson2vt(data, 1, -1, -1, {
        transformZXY: transformZXY
    });
    var br = geojson2vt(data, 1, 0, -1, {
        transformZXY: transformZXY
    });

    t.equal(tl.features[0].id, 1);
    t.equal(tr.features[0].id, 2);
    t.equal(bl.features[0].id, 3);
    t.equal(br.features[0].id, 4);

    t.end();
});
