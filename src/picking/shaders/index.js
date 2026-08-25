import * as quad from "./quadPickingV5";
import * as decal from "./decalPickingV5";

export * from "./materialResolve";
export * from "./quadPickingV5";
export * from "./decalPickingV5";


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

for (const group of [ quad, decal ])
{
    for (const key in group)
    {
        if (!Object.prototype.hasOwnProperty.call(group, key)) continue;

        // Arrays as well as single definitions: the quad kinds are emitted as a
        // list because each one has a skinned twin, and collecting only the
        // named exports would have registered none of them.
        const value = group[key];

        for (const shader of Array.isArray(value) ? value : [ value ])
        {
            if (shader && shader.name && shader.techniques) pickingShaders.push(shader);
        }
    }
}
