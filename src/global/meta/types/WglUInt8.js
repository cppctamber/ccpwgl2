import WglUnsignedInteger from "../WglUnsignedInteger";

const MAX_VALUE = 255;

export class WglUInt8 extends WglUnsignedInteger
{
    constructor(type)
    {
        super(type, 0, MAX_VALUE);
    }
}
