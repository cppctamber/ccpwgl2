import { meta } from "utils";
import { quat } from "math";


@meta.ccp.define("Tr2CurveRandomAxisRotation")
export class Tr2CurveRandomAxisRotation extends meta.Model
{
    @meta.string
    name = "";

    @meta.private
    @meta.quaternion
    preRotation = quat.create();

    @meta.private
    @meta.quaternion
    postRotation = quat.create();

    @meta.private
    @meta.quaternion
    currentValue = quat.create();

    @meta.float
    period = 1;

    @meta.uint
    seed = 0;

    _rotation = quat.create();

    constructor()
    {
        super();
        this.SeedChanged();
        this.GetValue(0, this.currentValue);
    }

    UpdateValue(time)
    {
        this.GetValue(time, this.currentValue);
    }

    Update(a, b)
    {
        const args = ResolveSampleArgs(a, b, this.currentValue);
        const time = args.usesPeriod ? this.GetPeriodicTime(args.time) : args.time;
        this.GetValue(time, this.currentValue);
        return quat.copy(args.out, this.currentValue);
    }

    GetValueAt(a, b)
    {
        const args = ResolveSampleArgs(a, b, quat.create());
        return this.GetValue(args.usesPeriod ? this.GetPeriodicTime(args.time) : args.time, args.out);
    }

    GetValue(time, out = quat.create())
    {
        quat.copy(out, this.postRotation);
        if (this.period !== 0)
        {
            quat.setAxisAngle(this._rotation, [ 0, 1, 0 ], (time / Math.abs(this.period)) * Math.PI * 2);
            quat.multiply(out, out, this._rotation);
        }
        return quat.multiply(out, out, this.preRotation);
    }

    GetValueDotAt(a, b)
    {
        return ResolveSampleArgs(a, b, quat.create()).out;
    }

    GetValueDoubleDotAt(a, b)
    {
        return ResolveSampleArgs(a, b, quat.create()).out;
    }

    Initialize()
    {
        if (this.seed !== 0)
        {
            this.SeedChanged();
        }
        return true;
    }

    GetSeed()
    {
        return this.seed;
    }

    SetSeed(seed)
    {
        this.seed = seed >>> 0;
        this.SeedChanged();
    }

    SeedChanged()
    {
        const random = this.seed !== 0 ? MakeSeededRandom(this.seed) : Math.random;
        SetYawPitchRollQuaternion(this.preRotation, RandAngle(random), RandAngle(random), RandAngle(random));
        SetYawPitchRollQuaternion(this.postRotation, RandAngle(random), RandAngle(random), RandAngle(random));
    }

    GetPeriodicTime(time)
    {
        const period = Math.abs(this.period);
        return period ? PositiveModulo(time, period) : 0;
    }
}

function IsOutput(value)
{
    return value && typeof value.length === "number";
}

function ResolveSampleArgs(a, b, fallback)
{
    if (IsOutput(a))
    {
        return { out: a, time: b, usesPeriod: true };
    }
    return { time: a, out: IsOutput(b) ? b : fallback, usesPeriod: false };
}

function PositiveModulo(value, period)
{
    return ((value % period) + period) % period;
}

function MakeSeededRandom(seed)
{
    let state = seed >>> 0;
    return function seededRandom()
    {
        state = (Math.imul(1664525, state) + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}

function RandAngle(random)
{
    return random() * Math.PI * 2;
}

function SetYawPitchRollQuaternion(out, yaw, pitch, roll)
{
    const
        sinYaw = Math.sin(yaw / 2),
        cosYaw = Math.cos(yaw / 2),
        sinPitch = Math.sin(pitch / 2),
        cosPitch = Math.cos(pitch / 2),
        sinRoll = Math.sin(roll / 2),
        cosRoll = Math.cos(roll / 2);

    out[0] = sinYaw * cosPitch * sinRoll + cosYaw * sinPitch * cosRoll;
    out[1] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
    out[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
    out[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;
    return out;
}
