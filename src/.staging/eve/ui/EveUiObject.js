import {Tw2BaseClass} from "../../../global";

/**
 * EveUiObject
 *
 * @property {Number} boundingSphereRadius -
 * @property {Tr2Mesh} mesh                -
 * @property {Number} modelScale           -
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

