import { meta } from "utils";
import { vec4 } from "math";
import { TriColorFromKelvin, Tr2StandardIlluminant } from "./TriColorFromKelvin";


/**
 * Tr2KelvinColor
 *
 * Source: carbonengine trinity/trinity/Tr2KelvinColor.h/.cpp/_Blue.cpp.
 * Converts a black-body color temperature (in Kelvin) plus a green/magenta
 * tint and a white-balance reference illuminant into an RGB color.
 */
@meta.notImplemented
@meta.type("Tr2KelvinColor")
@meta.ccp.define("Tr2KelvinColor")
export class Tr2KelvinColor extends meta.Model
{

    @meta.float
    temperature = 5500;

    @meta.float
    tint = 0.5;

    /**
     * White balance reference, a Tr2StandardIlluminant ordinal (default
     * TR2STANDARDILLUMINANT_D55 - see ./TriColorFromKelvin.js and
     * Tr2KelvinColor.h:11-31). Carbon persists this as a Blue ENUM chooser.
     *
     * TODO(wire type): deliberately NOT decorated with a black reader type -
     * the wire encoding of Blue enum choosers is unverified and ccpwgl black
     * readers dispatch on decorator type (a wrong guess corrupts the rest of
     * the object stream). The pre-existing stub omitted this property
     * entirely, so leaving it unregistered preserves existing reader
     * behavior; verify against a real .black file before decorating.
     * @type {Number}
     */
    whiteBalance = Tr2StandardIlluminant.D55;

    /**
     * Gets the current Kelvin color temperature
     *
     * Matches `Tr2KelvinColor::GetTemperature` (Tr2KelvinColor.h:53-56)
     * @returns {Number}
     */
    GetTemperature()
    {
        return this.temperature;
    }

    /**
     * Gets the current tint value
     *
     * Matches `Tr2KelvinColor::GetTint` (Tr2KelvinColor.h:57-61)
     * @returns {Number}
     */
    GetTint()
    {
        return this.tint;
    }

    /**
     * Gets the current white balance reference
     *
     * Matches `Tr2KelvinColor::GetWhiteBalance` (Tr2KelvinColor.h:62-66)
     * @returns {Number}
     */
    GetWhiteBalance()
    {
        return this.whiteBalance;
    }

    /**
     * Converts the color temperature to an RGBA color
     *
     * Matches `Tr2KelvinColor::AsRGB` (Tr2KelvinColor.h:68-77), which calls
     * through to `TriColorFromKelvin` (ported 1:1 in ./TriColorFromKelvin.js).
     * @returns {vec4}
     */
    AsRGB()
    {
        const [ r, g, b ] = TriColorFromKelvin(this.temperature, this.tint, this.whiteBalance);
        return vec4.fromValues(r, g, b, 1.0);
    }

}
