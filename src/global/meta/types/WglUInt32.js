import WglUnsignedInteger from "../WglUnsignedInteger";

const MAX_VALUE = 4294967295;

export class WglUInt32 extends WglUnsignedInteger
{
    constructor(type)
    {
        super(type, 0, MAX_VALUE);
    }
}
