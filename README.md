CCP WebGL Library
======
An implementation of CCP Games graphics engine in webgl.
1. This library can be used as is but with no support for models or features post 2016.
2. This library can be used to load the basic features of most models after 2016 but requires a proxy server to provide cors headers and some file conversions. This proxy server is not currently supplied.


Core files
-----
* `dist/ccpwgl_int2.js`      - ccp webgl core library
* `dist/ccpwgl_int2.min.js`  - minified ccp webgl core library

Demos
-----
CCPWGL
* `demo/ccpwgl/ccpwgl.js`          - An example implementation of the ccp webgl library
* `demo/ccpwgl/index.html`         - A collection of ccpwgl demonstrations
* `demo/ccpwgl/sof.html`           - Shows how to load ships using Space Object Factory and how to query its data
* `demo/ccpwgl/planets.html`       - Shows how to load planets
* `demo/ccpwgl/sun.html`           - Shows how to load suns (lens flares)
* `demo/ccpwgl/tech3.html`         - Shows how to load Tech III composite ships
* `demo/ccpwgl/cubeofdeath.html`   - Performance test (multiple ships)
* `demo/ccpwgl/fitting.html`       - Shows how to fit turrets on the ship
* `demo/ccpwgl/firing.html`        - Shows how to fire turrets
* `demo/ccpwgl/explosions.html`    - Shows how to construct, play and remove explosions
* `demo/ccpwgl/typeids.html`       - Shows how to query type ID data

CCPWGL2
* None supplied yet 

Installation
------
1) Install  [Node.js](http://www.nodejs.org) along with the node package manager
2) Clone `git clone https://github.com/cppctamber/ccpwgl2.git`
3) Run `npm install` once from your ccpwgl folder

Define proxy server path
------
To load `.black` files and newer files resources your must defined a path to your your proxy server against the `cdn` prefix.

_This can be done in four ways:_

- Update the `src/config.js` file directly:
```
config.paths.cdn="https://localhost:3000
```
 
- Set a new path: 
```
tw2.SetPath("cdn", "https://localhost:3000)
```

- Register a custom config object:
```
const customConfig = {
    ...,
    paths: { cdn: "https://localhost:3000" },
    ...
}
tw2.Register(customConfig);

```
- Set config during library initialization
```
tw2.Initialize({
    ...
    paths: { cdn: "https://localhost:3000 }
    ...
});
```


Build
-----
* Run `webpack` to lint, format and build `dist/ccpwgl2_int.js` and `dist/ccpwgl2_int.min.js` 
* Run `npm run watcher` to automatically rebuild `dist/ccpwgl2_int.js` and `dist/ccpwgl_int2.min.js` while developing

```
{\__/}
(x n x)
 .⊂  \ 
```


