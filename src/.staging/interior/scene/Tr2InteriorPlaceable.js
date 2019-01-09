import {Tw2BaseClass} from "../../class";

/**
 * Tr2InteriorPlaceable
 *
 * @parameter {String} placeableResPath -
 * @parameter {TriMatrix} transform     -
 */
export default class Tr2InteriorPlaceable extends Tw2BaseClass
{

    placeableResPath = "";
    transform = null;

}

Tw2BaseClass.define(Tr2InteriorPlaceable, Type =>
{
    return {
        isStaging: true,
        type: "Tr2InteriorPlaceable",
        props: {
            placeableResPath: Type.PATH,
            transform: ["TriMatrix"]
        }
    };
});

