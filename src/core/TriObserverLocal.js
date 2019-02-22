import {vec3} from "../global/index";
import {Tw2BaseClass} from "../global/index";

/**
 * TriObserverLocal
 * Todo: Implement
 *
 * @property {vec3} front -
 */
export default class TriObserverLocal extends Tw2BaseClass
{

    front = vec3.create();

}

Tw2BaseClass.define(TriObserverLocal, Type =>
{
    return {
        isStaging: true,
        type: "TriObserverLocal",
        props: {
            front: Type.VECTOR3
        },
        notImplemented: ["*"]
    };
});

