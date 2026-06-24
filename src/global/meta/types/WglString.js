import { isString } from "../../utils/type";
import WglPropertyType from "./WglPropertyType";

export default class WglString extends WglPropertyType
{
    is(value)
    {
        return isString(value);
    }
}
