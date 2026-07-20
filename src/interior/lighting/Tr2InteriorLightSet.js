import { meta } from "utils";
import { sph3 } from "math";


/**
 * Lightweight ccpwgl interior light selector.
 *
 * Carbon's `Tr2InteriorLightSet` builds the per-object interior point-light
 * block. This GLES version only owns selection/order; packing is handled by
 * `GLESPerObjectDataInterior`.
 */
@meta.type("Tr2InteriorLightSet")
@meta.ccp.define("Tr2InteriorLightSet")
export class Tr2InteriorLightSet extends meta.Model
{

    @meta.list("Tr2InteriorLightSource")
    lights = [];

    /**
     * Sets source lights
     * @param {Array} lights
     * @returns {Tr2InteriorLightSet}
     */
    SetLights(lights)
    {
        this.lights = lights || [];
        return this;
    }

    /**
     * Selects active lights for a dynamic object.
     * @param {*} dynamic
     * @param {Array} [out=[]]
     * @param {Number} [maxLights=Tr2InteriorLightSet.MAX_LIGHTS_PER_OBJECT]
     * @returns {Array}
     */
    GetActiveLights(dynamic, out = [], maxLights = Tr2InteriorLightSet.MAX_LIGHTS_PER_OBJECT)
    {
        const
            scored = Tr2InteriorLightSet.global.scoredLights,
            sphere = Tr2InteriorLightSet.global.sphere;

        out.splice(0);
        scored.splice(0);

        const hasSphere = dynamic && dynamic.GetWorldBoundingSphere && dynamic.GetWorldBoundingSphere(sphere);
        const center = hasSphere ? sphere : null;
        const objectRadius = hasSphere ? sphere[3] : 0;

        for (let i = 0; i < this.lights.length; i++)
        {
            const light = this.lights[i];
            if (!light || light.primaryLighting === false) continue;

            let score = i;

            if (center && light.position)
            {
                const
                    radius = Math.max(light.radius || 0, 0),
                    dx = light.position[0] - center[0],
                    dy = light.position[1] - center[1],
                    dz = light.position[2] - center[2],
                    distanceSq = dx * dx + dy * dy + dz * dz,
                    influence = radius + objectRadius;

                if (influence > 0 && distanceSq > influence * influence) continue;
                score = distanceSq - radius * radius;
            }

            scored.push({ light, score });
        }

        scored.sort((a, b) => a.score - b.score);

        for (let i = 0; i < scored.length && out.length < maxLights; i++)
        {
            out.push(scored[i].light);
        }

        return out;
    }

    static MAX_LIGHTS_PER_OBJECT = 10;

    static global = {
        scoredLights: [],
        sphere: sph3.create()
    };

}
