import { meta } from "utils";
import { vec3 } from "math";


@meta.ccp.define("Tr2CurveCombiner")
export class Tr2CurveCombiner extends meta.Model
{
    @meta.string
    name = "";

    @meta.list()
    curves = [];

    @meta.vector3
    currentValue = vec3.create();

    UpdateValue(time)
    {
        this.Update(time, this.currentValue);
    }

    Update(time, out = this.currentValue)
    {
        this.GetValueAt(time, this.currentValue);
        if (out !== this.currentValue)
        {
            out[0] = this.currentValue[0];
            out[1] = this.currentValue[1];
            out[2] = this.currentValue[2];
        }
        return out;
    }

    GetValue(time)
    {
        return this.GetValueAt(time, [ 0, 0, 0 ]);
    }

    GetValueAt(time, out = [ 0, 0, 0 ])
    {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;

        for (let i = 0; i < this.curves.length; i++)
        {
            const curve = this.curves[i];
            const value = [ 0, 0, 0 ];
            if (curve && curve.GetValueAt)
            {
                curve.GetValueAt(time, value);
                out[0] += value[0] || 0;
                out[1] += value[1] || 0;
                out[2] += value[2] || 0;
            }
        }
        return out;
    }

    GetValueDotAt(time, out = [ 0, 0, 0 ])
    {
        return out;
    }

    GetValueDoubleDotAt(time, out = [ 0, 0, 0 ])
    {
        return out;
    }

    InterpolatedPosition(time, out = [ 0, 0, 0 ])
    {
        return out;
    }

    Length()
    {
        let maxLength = 0;
        for (let i = 0; i < this.curves.length; i++)
        {
            const curve = this.curves[i];
            if (curve && curve.Length)
            {
                maxLength = Math.max(maxLength, curve.Length());
            }
            else if (curve && curve.GetLength)
            {
                maxLength = Math.max(maxLength, curve.GetLength());
            }
        }
        return maxLength;
    }

    GetLength()
    {
        return this.Length();
    }

    Sort()
    {
        for (let i = 0; i < this.curves.length; i++)
        {
            const curve = this.curves[i];
            if (curve && curve.Sort)
            {
                curve.Sort();
            }
        }
    }
}
