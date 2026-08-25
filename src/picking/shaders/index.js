import * as definitions from "./quadPickingV5";

export * from "./materialResolve";
export * from "./quadPickingV5";


/**
 * The picking shader definitions, in the shape `tw2.Register({ shaders })`
 * takes.
 *
 * Standalone shaders, matched to their opaque equivalent - none of them
 * `replaces` anything, so registering them changes nothing about how a ship
 * ordinarily draws. They are reachable as `manual:/<name>.sm_json` once
 * registered.
 * @type {Array<Object>}
 */
export const pickingShaders = [];

for (const key in definitions)
{
    if (!Object.prototype.hasOwnProperty.call(definitions, key)) continue;

    const shader = definitions[key];
    if (shader && shader.name && shader.techniques) pickingShaders.push(shader);
}
