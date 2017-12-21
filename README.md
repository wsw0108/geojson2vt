# geojson2vt

Convert geojson to tile at specified z/x/y.

[![Build Status](https://travis-ci.org/wsw0108/geojson2vt.svg?branch=master)](https://travis-ci.org/wsw0108/geojson2vt)
[![Coverage Status](https://coveralls.io/repos/wsw0108/geojson2vt/badge.svg)](https://coveralls.io/r/wsw0108/geojson2vt)

Modified from [geojson-vt](https://github.com/mapbox/geojson-vt).

## Usage

```js
var tile = geojson2vt(geoJSON, z, x, y, options);
```

## Options

```js
var tile = geojson2vt(data, z, x, y, {
	maxZoom: 14,  // max zoom to preserve detail on; can't be higher than 24
	tolerance: 3, // simplification tolerance (higher means simpler)
	extent: 4096, // tile extent (both width and height)
	buffer: 64,	  // tile buffer on each side
	debug: 0      // logging level (0 to disable, 1 or 2)
});
```

## Install

Install with NPM or Yarn (`npm install geojson2vt`), or use one of the CDN browser builds:

- [Development build](https://unpkg.com/geojson2vt/geojson2vt-dev.js)
- [Minified production build](https://unpkg.com/geojson2vt/geojson2vt.js)
