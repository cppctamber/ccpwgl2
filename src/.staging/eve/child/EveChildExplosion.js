import {mat4, quat, vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveChildExplosion
 * @implements ObjectChild
 *
 * @parameter {Number} globalDuration                  -
 * @parameter {EveChildContainer} globalExplosion      -
 * @parameter {Number} globalExplosionDelay            -
 * @parameter {vec3} globalScaling                     -
 * @parameter {Number} localDuration                   -
 * @parameter {EveChildContainer} localExplosion       -
 * @parameter {Number} localExplosionInterval          -
 * @parameter {Number} localExplosionIntervalFactor    -
 * @parameter {EveChildContainer} localExplosionShared -
 * @parameter {Array.<ObjectChild>} localExplosions    -
 * @parameter {mat4} localTransform                    -
 * @parameter {quat} rotation                          -
 * @parameter {vec3} scaling                           -
 */
export default class EveChildExplosion extends Tw2StagingClass
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

Tw2StagingClass.define(EveChildExplosion, Type =>
{
    return {
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

