import {Tw2BaseClass} from "../../class";

/**
 * Tr2StaticEmitter
 * @implements ParticleEmitter
 *
 * @parameter {String} geometryResourcePath -
 * @parameter {Number} meshIndex            -
 */
export default class Tr2StaticEmitter extends Tw2BaseClass
{

    geometryResourcePath = "";
    meshIndex = 0;

}

Tw2BaseClass.define(Tr2StaticEmitter, Type =>
{
    return {
        isStaging: true,
        type: "Tr2StaticEmitter",
        category: "ParticleEmitter",
        props: {
            geometryResourcePath: Type.PATH,
            meshIndex: Type.NUMBER
        }
    };
});

