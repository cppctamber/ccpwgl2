import WglUnsignedInteger from "../WglUnsignedInteger";

const MAX_VALUE = 4294967295;

export default class WglUInt32 extends WglUnsignedInteger
{
    constructor(type)
    {
        super(type, 0, MAX_VALUE, true);
    }
}
