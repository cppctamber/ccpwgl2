import { isBoolean } from "../../utils/type";
import WglPropertyType from "../WglPropertyType";

export class WglBoolean extends WglPropertyType
{
    // Float bindings may write 0/1 to boolean properties; serialize their value
    // as a boolean so cloning an animated child remains type-correct.
    Get(target, key) { return !!target[key]; }

    Is(value)
    {
        return isBoolean(value);
    }
}
