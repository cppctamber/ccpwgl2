import {Tw2StagingClass} from "../../class";

/**
 * Tw2MeshArea
 * @ccp Tr2MeshArea
 * @implements MeshArea
 *
 * @parameter {Number} count          -
 * @parameter {Tw2Effect} effect      -
 * @parameter {Number} index          -
 * @parameter {Boolean} reversed      -
 * @parameter {Boolean} useSHLighting -
 */
export default class Tw2MeshArea extends Tw2StagingClass
{

    count = 0;
    effect = null;
    index = 0;
    reversed = false;
    useSHLighting = false;

}

Tw2StagingClass.define(Tw2MeshArea, Type =>
{
    return {
        type: "Tw2MeshArea",
        category: "MeshArea",
        props: {
            count: Type.NUMBER,
            effect: ["Tw2Effect"],
            index: Type.NUMBER,
            reversed: Type.BOOLEAN,
            useSHLighting: Type.BOOLEAN
        }
    };
});

