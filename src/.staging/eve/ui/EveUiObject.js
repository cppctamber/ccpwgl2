import {Tw2StagingClass} from "../../class";

/**
 * EveUiObject
 *
 * @parameter {Number} boundingSphereRadius -
 * @parameter {Tw2Mesh} mesh                -
 * @parameter {Number} modelScale           -
 */
export default class EveUiObject extends Tw2StagingClass
{

    boundingSphereRadius = 0;
    mesh = null;
    modelScale = 0;

}

Tw2StagingClass.define(EveUiObject, Type =>
{
    return {
        type: "EveUiObject",
        props: {
            boundingSphereRadius: Type.NUMBER,
            mesh: ["Tw2Mesh"],
            modelScale: Type.NUMBER
        }
    };
});

