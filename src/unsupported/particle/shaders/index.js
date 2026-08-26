import { particleUpdate } from "./particleUpdate";

// NOT re-exported through the particle barrel. `config.js` spreads the whole
// `unsupported` namespace into `constructors`, so a plain object leaking out of
// it is registered as a class and the store rejects it - taking the bundle down
// at load with "Constructor store value invalid". The shader definitions reach
// `src/index.js` by importing this file directly instead.
export { particleUpdate };


/**
 * The GPU particle shaders, in the shape `tw2.Register({ shaders })` takes.
 *
 * Hand written rather than translated. The shipped legacy set for this profile
 * does not compile - see `/docs/contracts/gles2-gpu-particles.md` - and the
 * current DX11 set is compute, which WebGL2 has no form of.
 *
 * None of them `replaces` anything, so registering them changes nothing about
 * how anything else draws.
 * @type {Array<Object>}
 */
export const particleShaders = [ particleUpdate ];
