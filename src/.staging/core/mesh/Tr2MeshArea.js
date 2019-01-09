import {Tw2BaseClass} from "../../class";

/**
 * Tr2MeshArea
 * @implements MeshArea
 *
 * @parameter {Number} count          -
 * @parameter {Tr2Effect} effect      -
 * @parameter {Number} index          -
 * @parameter {Boolean} reversed      -
 * @parameter {Boolean} useSHLighting -
 */
export default class Tr2MeshArea extends Tw2BaseClass
{

    count = 0;
    effect = null;
    index = 0;
    reversed = false;
    useSHLighting = false;

}

Tw2BaseClass.define(Tr2MeshArea, Type =>
{
    return {
        isStaging: true,
        type: "Tr2MeshArea",
        category: "MeshArea",
        props: {
            count: Type.NUMBER,
            effect: ["Tr2Effect"],
            index: Type.NUMBER,
            reversed: Type.BOOLEAN,
            useSHLighting: Type.BOOLEAN
        }
    };
});

