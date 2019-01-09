import {Tw2BaseClass} from "../../class";

/**
 * EveUiObject
 *
 * @parameter {Number} boundingSphereRadius -
 * @parameter {Tr2Mesh} mesh                -
 * @parameter {Number} modelScale           -
 */
export default class EveUiObject extends Tw2BaseClass
{

    boundingSphereRadius = 0;
    mesh = null;
    modelScale = 0;

}

Tw2BaseClass.define(EveUiObject, Type =>
{
    return {
        isStaging: true,
        type: "EveUiObject",
        props: {
            boundingSphereRadius: Type.NUMBER,
            mesh: ["Tr2Mesh"],
            modelScale: Type.NUMBER
        }
    };
});

