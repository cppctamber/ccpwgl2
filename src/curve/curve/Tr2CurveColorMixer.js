import { meta } from "utils";
import { vec4 } from "math";


@meta.ccp.define("Tr2CurveColorMixer")
export class Tr2CurveColorMixer extends meta.Model
{
    @meta.string
    name = "";

    @meta.private
    @meta.notOwned
    @meta.struct()
    startCurve = null;

    @meta.private
    @meta.notOwned
    @meta.struct()
    endCurve = null;

    @meta.color
    color1 = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    color2 = vec4.fromValues(0, 0, 0, 1);

    @meta.float
    lerpValue = 0;

    @meta.float
    saturation = 1;

    @meta.float
    brightness = 1;

    @meta.private
    @meta.color
    currentValue = vec4.fromValues(0, 0, 0, 1);

    @meta.private
    @meta.color
    convertedLinearValue = vec4.fromValues(0, 0, 0, 1);

    UpdateValue(time)
    {
        this.Update(time, this.currentValue);
        this.InvertLinearColor(this.currentValue, this.convertedLinearValue);
    }

    Update(time, out = this.currentValue)
    {
        this.GetValueAt(time, this.currentValue);
        if (out !== this.currentValue)
        {
            CopyColor(out, this.currentValue);
        }
        return out;
    }

    GetValue(time)
    {
        return this.GetValueAt(time, [ 0, 0, 0, 1 ]);
    }

    GetValueAt(time, out = [ 0, 0, 0, 1 ])
    {
        const color1 = this.GetColorValue(this.startCurve, this.color1, time);
        const color2 = this.GetColorValue(this.endCurve, this.color2, time);
        const x = this.lerpValue;

        out[0] = color1[0] * (1 - x) + color2[0] * x;
        out[1] = color1[1] * (1 - x) + color2[1] * x;
        out[2] = color1[2] * (1 - x) + color2[2] * x;
        out[3] = color1[3] * (1 - x) + color2[3] * x;

        if (this.saturation !== 1)
        {
            const intensity = out[0] * 0.299 + out[1] * 0.587 + out[2] * 0.114;
            const saturation = Math.max(0, this.saturation);
            out[0] = intensity * (1 - saturation) + out[0] * saturation;
            out[1] = intensity * (1 - saturation) + out[1] * saturation;
            out[2] = intensity * (1 - saturation) + out[2] * saturation;
            out[3] = intensity * (1 - saturation) + out[3] * saturation;
        }

        out[0] *= this.brightness;
        out[1] *= this.brightness;
        out[2] *= this.brightness;
        out[3] *= this.brightness;
        return out;
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

    GetColorValue(curve, fallback, time)
    {
        if (curve && curve.GetValueAt)
        {
            return curve.GetValueAt(time, [ 0, 0, 0, 1 ]);
        }
        return fallback;
    }

    InvertLinearColor(input, out)
    {
        out[0] = this.InvertLinearValue(input[0]);
        out[1] = this.InvertLinearValue(input[1]);
        out[2] = this.InvertLinearValue(input[2]);
        out[3] = input[3];
        return out;
    }

    InvertLinearValue(value)
    {
        if (value < 0.04045)
        {
            return value / 12.92;
        }
        return Math.pow((value + 0.055) / 1.055, 2.4);
    }
}

function CopyColor(out, value)
{
    out[0] = value[0];
    out[1] = value[1];
    out[2] = value[2];
    out[3] = value[3];
    return out;
}
