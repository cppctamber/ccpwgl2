// Source: E:\carbonengine\trinity\trinity\Eve\SpaceObject\Attachments\Sets\EveSpaceObjectAttachmentUtils.cpp
// Source: E:\carbonengine\trinity\trinity\Eve\SpaceObject\Attachments\Sets\EveSpaceObjectAttachmentUtils.h
//
// The blink/fade intensity helpers every attachment set uses to modulate the
// brightness of the lights it emits, plus the colour saturation those lights are
// tinted through.
//
// Carbon reads the global `Tr2Renderer::GetAnimationTime()` inside each helper.
// Here the animation time is the FIRST argument instead, because ccpwgl has no
// global animation clock to reach for and the caller already knows the frame
// time. That is the only adaptation - every formula below is verbatim, including
// the quirks, which are called out where they would otherwise read as bugs.
//
// Ported from `@carbonenginejs/runtime-trinity`
// (`src/eve/attachment/EveSpaceObjectAttachmentUtils.js`), which is the org's
// checked transcription of the Carbon source above.

/**
 * How an attachment light's brightness varies over time.
 * Carbon `EveSpaceObjectAttachmentUtils.h:7-14`.
 * @type {Object}
 */
export const FadeType = Object.freeze({
    FT_NONE: 0,
    FT_BLINK: 1,
    FT_FADEIN: 2,
    FT_FADEOUT: 3,
    FT_FADEINOUT: 4
});

const FLASH_PEAK_TIME = 0.05;

/**
 * A single flash per cycle: a fast ramp up to a peak, a slower ramp down, then
 * dark for the rest of the cycle. Carbon `Blink` (cpp:9-40).
 *
 * Two things here look wrong and are not. A peak below 0.0001 becomes 1, so a
 * very small rate degenerates into one full-cycle ramp rather than dividing by
 * something near zero. And the phase is added AFTER the rate multiply, unlike
 * `FadeIn` where it is added before - the two are genuinely different curves.
 *
 * @param {Number} animationTime
 * @param {Number} blinkRate
 * @param {Number} blinkPhase
 * @param {Number} minScale
 * @param {Number} maxScale
 * @returns {Number}
 */
export function Blink(animationTime, blinkRate, blinkPhase, minScale, maxScale)
{
    if (blinkRate === 0)
    {
        return minScale;
    }

    const value = animationTime * blinkRate + blinkPhase;
    const f = value - Math.floor(value);

    let peak = FLASH_PEAK_TIME * blinkRate;
    let result = 0;
    const end = peak * 4;

    if (peak < 0.0001)
    {
        peak = 1;
    }

    if (f < peak)
    {
        result = f / peak;
    }
    else if (f < end)
    {
        result = 1 - (f - peak) / (end - peak);
    }

    return (maxScale - minScale) * result + minScale;
}

/**
 * A repeating 0->1 ramp. Carbon `FadeIn` (cpp:42-46).
 * The phase is added BEFORE the rate multiply - contrast `Blink`.
 * @param {Number} animationTime
 * @param {Number} blinkRate
 * @param {Number} blinkPhase
 * @returns {Number}
 */
export function FadeIn(animationTime, blinkRate, blinkPhase)
{
    const value = (animationTime + blinkPhase) * blinkRate;
    return value - Math.floor(value);
}

/**
 * A repeating 1->0 ramp. Carbon `FadeOut` (cpp:48-51).
 * @param {Number} animationTime
 * @param {Number} blinkRate
 * @param {Number} blinkPhase
 * @returns {Number}
 */
export function FadeOut(animationTime, blinkRate, blinkPhase)
{
    return 1 - FadeIn(animationTime, blinkRate, blinkPhase);
}

/**
 * A smooth sine cycle in 0..1. Carbon `FadeInOut` (cpp:53-57).
 * @param {Number} animationTime
 * @param {Number} blinkRate
 * @param {Number} blinkPhase
 * @returns {Number}
 */
export function FadeInOut(animationTime, blinkRate, blinkPhase)
{
    const twoPi = 2 * Math.PI;
    const timeModPi = (animationTime * blinkRate * twoPi) % twoPi;
    return (Math.sin(timeModPi + blinkPhase * twoPi) + 1) / 2;
}

/**
 * The brightness multiplier for a fade type. Carbon `Fade` (cpp:59-75).
 *
 * `FT_NONE`, and any unknown type, is full intensity - so an unmapped value
 * leaves a light alone rather than extinguishing it.
 *
 * @param {Number} animationTime
 * @param {Number} type - a `FadeType`
 * @param {Number} blinkRate
 * @param {Number} blinkPhase
 * @returns {Number}
 */
export function Fade(animationTime, type, blinkRate, blinkPhase)
{
    switch (type)
    {
        case FadeType.FT_BLINK:
            return Blink(animationTime, blinkRate, blinkPhase, 0, 1);

        case FadeType.FT_FADEIN:
            return FadeIn(animationTime, blinkRate, blinkPhase);

        case FadeType.FT_FADEOUT:
            return FadeOut(animationTime, blinkRate, blinkPhase);

        case FadeType.FT_FADEINOUT:
            return FadeInOut(animationTime, blinkRate, blinkPhase);

        default:
            return 1;
    }
}

/**
 * Moves a colour toward or away from its own grey. Carbon `Saturate`
 * (math `Color_inline.h:161-172`).
 *
 * A saturation of 1 passes the colour through untouched. Above 1 it
 * EXTRAPOLATES past the original colour rather than clamping - only the low side
 * clamps, at 0 - which is how SOF authors push an attachment light past its
 * authored colour. Alpha is carried through unchanged.
 *
 * @param {vec4} out - may alias `color`
 * @param {vec4} color
 * @param {Number} saturation
 * @returns {vec4} out
 */
export function Saturate(out, color, saturation)
{
    if (saturation === 1)
    {
        out[0] = color[0];
        out[1] = color[1];
        out[2] = color[2];
        out[3] = color[3];
        return out;
    }

    const
        intensity = color[0] * 0.299 + color[1] * 0.587 + color[2] * 0.114,
        s = Math.max(0, saturation);

    out[0] = intensity + (color[0] - intensity) * s;
    out[1] = intensity + (color[1] - intensity) * s;
    out[2] = intensity + (color[2] - intensity) * s;
    out[3] = color[3];
    return out;
}
