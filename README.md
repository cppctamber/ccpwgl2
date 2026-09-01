CCP WebGL Library
======
A webgl implementation of CCP Game's Eve Online graphics engine.

This version of the library can load every ship and read client resources. Resources can now be loaded from a server, as long as that server supplies the CORS headers WebGL requires (CCP's own servers do not). Translated DX11 shaders load directly from Carbon effect containers, which `Tw2EffectRes` detects and translates at load time.

The original library can be found here: https://github.com/ccpgames/ccpwgl


