import { meta } from "utils";
import { vec3 } from "math";


@meta.ccp.define("Tr2DistanceTracker")
export class Tr2DistanceTracker extends meta.Model
{
    @meta.string
    name = "";

    @meta.boolean
    signedDistance = true;

    @meta.boolean
    distanceToClosest = true;

    @meta.private
    @meta.float
    value = 0;

    @meta.vector3
    direction = vec3.create();

    @meta.notOwned
    @meta.struct()
    targetObject = null;

    @meta.notOwned
    @meta.struct()
    sourceObject = null;

    @meta.vector3
    targetPosition = vec3.create();

    @meta.vector3
    sourcePosition = vec3.create();

    get target()
    {
        return this.targetObject;
    }

    set target(value)
    {
        this.targetObject = value;
    }

    get source()
    {
        return this.sourceObject;
    }

    set source(value)
    {
        this.sourceObject = value;
    }

    UpdateValue(time)
    {
        if (this.sourceObject)
        {
            SampleVectorFunction(this.sourceObject, this.sourcePosition, time);
        }

        if (this.targetObject)
        {
            SampleVectorFunction(this.targetObject, this.targetPosition, time);
        }

        const
            dx = this.targetPosition[0] - this.sourcePosition[0],
            dy = this.targetPosition[1] - this.sourcePosition[1],
            dz = this.targetPosition[2] - this.sourcePosition[2],
            projection = dx * this.direction[0] + dy * this.direction[1] + dz * this.direction[2];

        if (this.distanceToClosest)
        {
            this.value = this.signedDistance ? projection : Math.abs(projection);
        }
        else
        {
            this.value = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (this.signedDistance && projection < 0)
            {
                this.value = -this.value;
            }
        }
    }

    GetValueAt()
    {
        return this.value;
    }

    OnModified()
    {
        this.UpdateValue(0);
        return true;
    }
}

function SampleVectorFunction(curve, out, time)
{
    if (curve.GetValueAt)
    {
        const result = SampleVectorMethod(curve, "GetValueAt", out, time);
        if (result) return vec3.copy(out, result);
    }

    if (curve.GetValue)
    {
        const result = SampleVectorMethod(curve, "GetValue", out, time);
        if (result) return vec3.copy(out, result);
    }

    if (curve.Update)
    {
        const result = SampleVectorMethod(curve, "Update", out, time);
        if (result) return vec3.copy(out, result);
    }

    return out;
}

function SampleVectorMethod(curve, name, out, time)
{
    try
    {
        return curve[name](time, out);
    }
    catch (err)
    {
        return curve[name](out, time);
    }
}
