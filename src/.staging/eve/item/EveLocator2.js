import {mat4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveLocator2
 * @implements EveObjectItem
 *
 * @parameter {mat4} transform -
 */
export default class EveLocator2 extends Tw2StagingClass
{

    transform = mat4.create();

}

Tw2StagingClass.define(EveLocator2, Type =>
{
    return {
        type: "EveLocator2",
        category: "EveObjectItem",
        props: {
            transform: Type.MATRIX4
        }
    };
});

