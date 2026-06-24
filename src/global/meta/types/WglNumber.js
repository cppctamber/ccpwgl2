import { num } from "math";
import { isNumber } from "../../utils/type";
import WglPropertyType from "./WglPropertyType";

export default class WglNumber extends WglPropertyType
{
    is(value)
    {
        return isNumber(value);
    }

    equals(a, b)
    {
        return num.equals(a, b);
    }
}
