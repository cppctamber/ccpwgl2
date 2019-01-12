import {mat4, quat, vec3} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EveChildExplosion
 * @implements ObjectChild
 *
 * @property {Number} globalDuration                  -
 * @property {EveChildContainer} globalExplosion      -
 * @property {Number} globalExplosionDelay            -
 * @property {vec3} globalScaling                     -
 * @property {Number} localDuration                   -
 * @property {EveChildContainer} localExplosion       -
 * @property {Number} localExplosionInterval          -
 * @property {Number} localExplosionIntervalFactor    -
 * @property {EveChildContainer} localExplosionShared -
 * @property {Array.<ObjectChild>} localExplosions    -
 * @property {mat4} localTransform                    -
 * @property {quat} rotation                          -
 * @property {vec3} scaling                           -
 */
export default class EveChildExplosion extends Tw2BaseClass
{

    globalDuration = 0;
    globalExplosion = null;
    globalExplosionDelay = 0;
    globalScaling = vec3.fromValues(1, 1, 1);
    localDuration = 0;
    localExplosion = null;
    localExplosionInterval = 0;
    localExplosionIntervalFactor = 0;
    localExplosionShared = null;
    localExplosions = [];
    localTransform = mat4.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);

}

Tw2BaseClass.define(EveChildExplosion, Type =>
{
    return {
        isStaging: true,
        type: "EveChildExplosion",
        category: "ObjectChild",
        props: {
            globalDuration: Type.NUMBER,
            globalExplosion: ["EveChildContainer"],
            globalExplosionDelay: Type.NUMBER,
            globalScaling: Type.TR_SCALING,
            localDuration: Type.NUMBER,
            localExplosion: ["EveChildContainer"],
            localExplosionInterval: Type.NUMBER,
            localExplosionIntervalFactor: Type.NUMBER,
            localExplosionShared: ["EveChildContainer"],
            localExplosions: [["EveChildContainer"]],
            localTransform: Type.TR_LOCAL,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING
        }
    };
});

