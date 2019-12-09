import { meta, vec3, vec4, Tw2BaseClass } from "global";


/**
 * Tr2InteriorLightSource
 *
 * @property {String} name                -
 * @property {vec4} color                 -
 * @property {Number} coneAlphaInner      -
 * @property {Number} coneAlphaOuter      -
 * @property {vec3} coneDirection         -
 * @property {Number} falloff             -
 * @property {Number} importanceBias      -
 * @property {Number} importanceScale     -
 * @property {Tr2KelvinColor} kelvinColor -
 * @property {vec3} position              -
 * @property {Number} radius              -
 * @property {Boolean} useKelvinColor     -
 */
@meta.ccp("Tr2InteriorLightSource")
@meta.notImplemented
export class Tr2InteriorLightSource extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.color
    color = vec4.create();

    @meta.black.float
    coneAlphaInner = 0;

    @meta.black.float
    coneAlphaOuter = 0;

    @meta.black.vector3
    coneDirection = vec3.create();

    @meta.black.float
    falloff = 0;

    @meta.black.float
    importanceBias = 0;

    @meta.black.float
    importanceScale = 0;

    @meta.black.object
    kelvinColor = null;

    @meta.black.vector3
    position = vec3.create();

    @meta.black.float
    radius = 0;

    @meta.black.boolean
    useKelvinColor = false;

}
