import {mat4} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EveLocator2
 * @implements EveObjectItem
 *
 * @property {mat4} transform -
 */
export default class EveLocator2 extends Tw2BaseClass
{

    transform = mat4.create();

}

Tw2BaseClass.define(EveLocator2, Type =>
{
    return {
        isStaging: true,
        type: "EveLocator2",
        category: "EveObjectItem",
        props: {
            transform: Type.MATRIX4
        }
    };
});

