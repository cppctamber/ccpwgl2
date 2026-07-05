import { isBoolean } from "../../utils/type";
import WglPropertyType from "../WglPropertyType";

export class WglBoolean extends WglPropertyType
{
    Is(value)
    {
        return isBoolean(value);
    }
}
