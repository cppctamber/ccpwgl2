import { meta } from "utils";


function Clamp(value, min, max)
{
    return Math.min(max, Math.max(min, value));
}

function GetDeltaT(updateContextOrDelta)
{
    if (typeof updateContextOrDelta === "number")
    {
        return updateContextOrDelta;
    }

    const context = updateContextOrDelta || {};
    if (context.GetDeltaT) return context.GetDeltaT();
    if (context.deltaT !== undefined) return context.deltaT;
    if (context.deltaTime !== undefined) return context.deltaTime;
    if (context.dt !== undefined) return context.dt;
    return 0;
}


@meta.ccp.define("Tr2ScalarFader")
export class Tr2ScalarFader extends meta.Model
{
    @meta.float
    value = 0;

    @meta.float
    fading = 0;

    @meta.float
    fadeTime = -1;

    @meta.isPrivate
    @meta.float
    kickInLength = 3;

    Update(updateContextOrDelta)
    {
        const dt = GetDeltaT(updateContextOrDelta);

        if (this.fading !== 0)
        {
            this.value += this.fading * dt;
            if (this.value < 0)
            {
                this.value = 0;
                this.fading = 0;
            }
            else if (this.value > 1)
            {
                this.value = 1;
                this.fading = 0;
            }
        }

        if (this.fadeTime >= 0)
        {
            this.fadeTime += dt;
            if (this.fadeTime > this.kickInLength)
            {
                this.fadeTime = -1;
            }
        }
    }

    UpdateValue(updateContextOrDelta)
    {
        this.Update(updateContextOrDelta);
    }

    StartFade(isFadeIn, fadeLength)
    {
        this.kickInLength = fadeLength;
        this.fading = isFadeIn ? 1 / this.kickInLength : -1 / this.kickInLength;
        if (isFadeIn)
        {
            this.fadeTime = 0;
        }
    }

    IsZero()
    {
        return this.value === 0 && this.fading === 0;
    }

    GetFaderValue()
    {
        return this.value;
    }

    IsKickInZero()
    {
        return this.fadeTime <= 0;
    }

    GetKickInValue()
    {
        if (this.fadeTime < 0)
        {
            return 0;
        }

        const x = this.kickInLength === 0 ? 1 : Clamp(this.fadeTime / this.kickInLength, 0, 1);
        return Math.pow(Math.sin(Math.PI * Math.pow(x, 0.66)), 3);
    }

    GetValueAt()
    {
        return this.value;
    }
}
