import { meta } from "utils";
import { vec4 } from "math";


@meta.ccp.define("Tr2CurveConstant")
export class Tr2CurveConstant extends meta.Model
{
    @meta.string
    name = "";

    @meta.vector4
    value = vec4.create();

    currentValue = vec4.create();

    UpdateValue(time)
    {
        this.Update(time, this.currentValue);
    }

    Update(time, out)
    {
        return this.GetValueAt(time, out);
    }

    GetValueAt(time, out)
    {
        if (out && typeof out.length === "number")
        {
            const length = Math.min(out.length, this.value.length || 0);
            for (let i = 0; i < length; i++)
            {
                out[i] = this.value[i];
            }
            return out;
        }

        return this.value[0] || 0;
    }

    GetValueDotAt(time, out = [ 0, 0, 0 ])
    {
        return FillVector(out, 0, 0, 0, out.length > 3 ? 0 : undefined);
    }

    GetValueDoubleDotAt(time, out = [ 0, 0, 0 ])
    {
        return FillVector(out, 0, 0, 0, out.length > 3 ? 0 : undefined);
    }

    InterpolatedPosition(out = [ 0, 0, 0 ])
    {
        return this.GetValueAt(0, out);
    }

    GetCurrentValue()
    {
        return this.currentValue;
    }

    Length()
    {
        return 0;
    }

    GetLength()
    {
        return 0;
    }

    Sort()
    {
    }
}

function FillVector(out, x, y, z, w)
{
    out[0] = x;
    if (out.length > 1) out[1] = y;
    if (out.length > 2) out[2] = z;
    if (out.length > 3 && w !== undefined) out[3] = w;
    return out;
}
