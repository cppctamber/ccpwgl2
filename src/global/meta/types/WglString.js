import { isString } from "../../utils/type";
import WglPropertyType from "../WglPropertyType";

export class WglString extends WglPropertyType
{
    Is(value)
    {
        return isString(value);
    }
}
