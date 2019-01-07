import {vec3} from "../../global";
import {Tw2StagingClass} from "../class";

/**
 * Tw2ObserverLocal
 * @ccp TriObserverLocal
 *
 * @parameter {vec3} front -
 */
export default class Tw2ObserverLocal extends Tw2StagingClass
{

    front = vec3.create();

}

Tw2StagingClass.define(Tw2ObserverLocal, Type =>
{
    return {
        type: "Tw2ObserverLocal",
        props: {
            front: Type.VECTOR3
        }
    };
});

