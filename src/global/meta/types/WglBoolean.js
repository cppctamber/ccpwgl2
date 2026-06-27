import { isBoolean } from "../../utils/type";
import WglPropertyType from "../WglPropertyType";

export default class WglBoolean extends WglPropertyType
{
    Is(value)
    {
        return isBoolean(value);
    }
}
