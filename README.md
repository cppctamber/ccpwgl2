nodeCCP WebGL Library
======
A webgl implementation of CCP Game's Eve Online graphics engine.
This version of the library provides partial support for newer ships and reading client resources but requires a resource server to do so (ccp's servers do not provide CORS headers which webgl requires). [A resource server is not yet provided](https://github.com/cppctamber/ccpwgl2-server).

The original library can be found here: https://github.com/ccpgames/ccpwgl

Core files
-----
* `dist/ccpwgl_int2.js`      - ccp webgl core library
* `dist/ccpwgl_int2.min.js`  - minified ccp webgl core library

Installation
------
1) Install  [Node.js](http://www.nodejs.org) along with the node package manager
2) Clone `git clone https://github.com/cppctamber/ccpwgl2.git`
3) Run `npm install` once from your ccpwgl2 folder

Build
-----
* Run `npm run build` to lint, format and build `dist/ccpwgl2_int.js` and `dist/ccpwgl2_int.min.js` 

Demos
-----
* None supplied yet 


Registering your custom resource server
------
Registering your custom resource server with the library can be done in a few ways:

- Register a custom config object along with your other settings:
```
const customConfig = {
    ...,
    paths: { cdn: "https://localhost:3000" },
    ...
}
tw2.Register(customConfig);
```

- Set the path by itself: 
```
tw2.SetPath("cdn", "https://localhost:3000")
```

```
{\__/}
(x n x)
 .⊂  \ 
```


