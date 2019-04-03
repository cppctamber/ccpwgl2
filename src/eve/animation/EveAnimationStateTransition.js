/**
 * EveAnimationStateTransition
 * TODO: Figure out the correct properties for this class
 * @ccp N/A
 *
 * @property {String} state
 * @property {String} transition
 */
export class EveAnimationStateTransition
{

    state = "";
    transition = "";

    /**
     * Black structure reader
     * TODO: Figure out the other properties for this class
     * @param {Tw2BlackBinaryReader} reader
     * @returns {EveAnimationStateTransition}
     */
    static blackStruct(reader)
    {
        const item = new EveAnimationStateTransition();

        // Not sure of property name
        item.state = reader.ReadStringU16();

        reader.ExpectU8(0, "unknown content");
        reader.ExpectU8(0, "unknown content");
        reader.ExpectU8(0, "unknown content");
        reader.ExpectU8(0, "unknown content");
        reader.ExpectU8(0, "unknown content");
        reader.ExpectU8(0, "unknown content");

        // Not sure of property name
        item.transition = reader.ReadStringU16();

        reader.ExpectU8(0, "unknown content");
        reader.ExpectU8(0, "unknown content");
        reader.ExpectU8(0, "unknown content");
        reader.ExpectU8(0, "unknown content");
        reader.ExpectU8(0, "unknown content");
        reader.ExpectU8(0, "unknown content");

        return item;
    }

}

