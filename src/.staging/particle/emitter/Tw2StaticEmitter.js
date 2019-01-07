import {Tw2StagingClass} from "../../class";

/**
 * Tw2StaticEmitter
 * @ccp Tr2StaticEmitter
 * @implements ParticleEmitter
 *
 * @parameter {String} geometryResourcePath -
 * @parameter {Number} meshIndex            -
 */
export default class Tw2StaticEmitter extends Tw2StagingClass
{

    geometryResourcePath = "";
    meshIndex = 0;

}

Tw2StagingClass.define(Tw2StaticEmitter, Type =>
{
    return {
        type: "Tw2StaticEmitter",
        category: "ParticleEmitter",
        props: {
            geometryResourcePath: Type.PATH,
            meshIndex: Type.NUMBER
        }
    };
});

