CCP WebGL Library
======
A webgl implementation of CCP Game's Eve Online graphics engine.
This version of the library provides partial support for newer ships and reading client resources but requires a resource server to do so (ccp's servers do not provide CORS headers which webgl requires). [A resource server is not yet provided](https://github.com/cppctamber/ccpwgl2-server).

The original library can be found here: https://github.com/ccpgames/ccpwgl

Warning
======
The resource files required for this library to work are no longer available, RIP.

Local review notes
=================

If you are changing resource system code (`src/core/resource/*`, `src/core/engine/Tw2ResMan*`), check:

- `.agents/resource-review-protocol.md`
- `_review/resource-system-review/` notes (latest first)

This repo ignores `_review` and `.agents` from git; keep these notes as the current operational context for agent handoffs.


