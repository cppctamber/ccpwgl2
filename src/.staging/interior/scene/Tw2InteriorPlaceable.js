import {Tw2StagingClass} from "../../class";

/**
 * Tw2InteriorPlaceable
 * @ccp Tr2InteriorPlaceable
 *
 * @parameter {String} placeableResPath -
 * @parameter {Tw2Matrix} transform     -
 */
export default class Tw2InteriorPlaceable extends Tw2StagingClass
{

    placeableResPath = "";
    transform = null;

}

Tw2StagingClass.define(Tw2InteriorPlaceable, Type =>
{
    return {
        type: "Tw2InteriorPlaceable",
        props: {
            placeableResPath: Type.PATH,
            transform: ["Tw2Matrix"]
        }
    };
});

