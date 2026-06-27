import WglUnsignedInteger from "../WglUnsignedInteger";

const MAX_VALUE = 65535;

export default class WglUInt16 extends WglUnsignedInteger
{
    constructor(type)
    {
        super(type, 0, MAX_VALUE);
    }
}
