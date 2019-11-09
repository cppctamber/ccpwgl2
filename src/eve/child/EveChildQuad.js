import { mat4, quat, vec3, vec4 } from "global";
import { EveChild } from "./EveChild";

/**
 * EveChildQuad
 * TODO: Implement
 *
 * @property {String} name              -
 * @property {Number} brightness        -
 * @property {vec4} color               -
 * @property {Tw2Effect} effect         -
 * @property {mat4} localTransform      -
 * @property {Number} minScreenSize     -
 * @property {quat} rotation            -
 * @property {vec3} scaling             -
 * @property {vec3} translation         -
 */
export class EveChildQuad extends EveChild
{

    name = "";
    brightness = 0;
    color = vec4.create();
    effect = null;
    localTransform = mat4.create();
    minScreenSize = 0;
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    translation = vec3.create();

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.effect) this.effect.GetResources(out);
        return out;
    }

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "brightness", r.float ],
            [ "color", r.color ],
            [ "effect", r.object ],
            [ "localTransform", r.matrix ],
            [ "minScreenSize", r.float ],
            [ "name", r.string ],
            [ "rotation", r.vector4 ],
            [ "scaling", r.vector3 ],
            [ "translation", r.vector3 ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
