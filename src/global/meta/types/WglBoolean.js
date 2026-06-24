import { isBoolean } from "../../utils/type";
import WglPropertyType from "./WglPropertyType";

export default class WglBoolean extends WglPropertyType
{
    is(value)
    {
        return isBoolean(value);
    }
}
