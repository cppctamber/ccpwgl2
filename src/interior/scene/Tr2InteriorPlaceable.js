import {Tw2BaseClass} from "../../global/index";

/**
 * Tr2InteriorPlaceable
 * TODO: Do we need this class?
 * TODO: Implement
 *
 * @property {String} placeableResPath -
 * @property {TriMatrix} transform     -
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
        },
        notImplemented: [
            "placeableResPath",
            "transform"
        ]
    };
});

