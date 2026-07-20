/**
 * TriColorFromKelvin
 *
 * Pure-math port of carbonengine's Kelvin-temperature-to-RGB conversion
 * (trinity/trinity/Tr2KelvinColor.cpp), used by Tr2KelvinColor.AsRGB().
 * Framework-free (no "utils"/"global" ccpwgl aliases) so it can be unit
 * tested outside webpack.
 */

/**
 * Standard illuminant ordinals, matches `Tr2StandardIlluminant`
 * (carbonengine trinity/trinity/Tr2KelvinColor.h:11-31).
 */
export const Tr2StandardIlluminant = Object.freeze({
    A: 0,
    D50: 1,
    D55: 2,
    D65: 3,
    D75: 4,
    E: 5,
    F1: 6,
    F2: 7,
    F3: 8,
    F4: 9,
    F5: 10,
    F6: 11,
    F7: 12,
    F8: 13,
    F9: 14,
    F10: 15,
    F11: 16,
    F12: 17
});

// CIE 1931 2-degree Standard Observer (x, y) chromaticity coordinates,
// matches `Tr2StandardIlluminantToCCT` (Tr2KelvinColor.cpp:32-96).
const ILLUMINANT_XY = [
    [ 0.44757, 0.40745 ], // A
    [ 0.34567, 0.35850 ], // D50
    [ 0.33242, 0.34743 ], // D55
    [ 0.31271, 0.32902 ], // D65
    [ 0.29902, 0.31485 ], // D75
    [ 0.33333, 0.33333 ], // E
    [ 0.31310, 0.33727 ], // F1
    [ 0.37208, 0.37529 ], // F2
    [ 0.40910, 0.39430 ], // F3
    [ 0.44018, 0.40329 ], // F4
    [ 0.31379, 0.34531 ], // F5
    [ 0.37790, 0.38835 ], // F6
    [ 0.31292, 0.32933 ], // F7
    [ 0.34588, 0.35875 ], // F8
    [ 0.37417, 0.37281 ], // F9
    [ 0.34609, 0.35986 ], // F10
    [ 0.38052, 0.37713 ], // F11
    [ 0.43695, 0.40441 ]  // F12
];

/**
 * Converts CIE XYZ to (linear) RGB, matches `XYZToRGB` (Tr2KelvinColor.cpp:23-30)
 * @param {Number[]} xyz
 * @returns {Number[]} [r, g, b]
 * @private
 */
function XYZToRGB(xyz)
{
    const [ x, y, z ] = xyz;
    return [
        0.41866 * x - 0.15866 * y - 0.08283 * z,
        -0.09117 * x + 0.25243 * y + 0.01571 * z,
        0.00092 * x - 0.00255 * y + 0.17860 * z
    ];
}

/**
 * Converts a Kelvin color temperature to a normalized linear RGB color
 *
 * Matches `TriColorFromKelvin` (carbonengine trinity/trinity/Tr2KelvinColor.cpp:98-187).
 * Returns black ([0,0,0]) outside the valid [1000, 25000] Kelvin range,
 * matching Carbon.
 * @param {Number} temperature Kelvin, valid range [1000, 25000]
 * @param {Number} tint 0..1
 * @param {Number} [whiteBalance=Tr2StandardIlluminant.D55]
 * @returns {Number[]} [r, g, b]
 */
export function TriColorFromKelvin(temperature, tint, whiteBalance = Tr2StandardIlluminant.D55)
{
    const T = temperature;

    if (T < 1000.0 || T > 25000.0)
    {
        return [ 0, 0, 0 ];
    }

    let xc;
    if (T >= 1000.0 && T <= 4000.0)
    {
        xc = -0.2661239 * (1000000000.0 / (T * T * T)) -
            0.2343580 * (1000000.0 / (T * T)) +
            0.8776956 * (1000.0 / T) +
            0.179910;
    }
    else
    {
        xc = -3.0258469 * (1000000000.0 / (T * T * T)) +
            2.1070379 * (1000000.0 / (T * T)) +
            0.2226347 * (1000.0 / T) +
            0.24039;
    }

    let yc;
    if (T >= 1000.0 && T <= 2222.0)
    {
        yc = -1.1063814 * (xc * xc * xc) -
            1.3481102 * (xc * xc) +
            2.1855583 * xc -
            0.20219683;
    }
    else if (T > 2222.0 && T <= 4000.0)
    {
        yc = -0.9549476 * (xc * xc * xc) -
            1.3741859 * (xc * xc) +
            2.09137015 * xc -
            0.16748867;
    }
    else
    {
        yc = 3.081758 * (xc * xc * xc) -
            5.8733867 * (xc * xc) +
            3.75112997 * xc -
            0.37001483;
    }

    const Y = 1.0;
    const X = (Y / yc) * xc;
    const Z = (Y / yc) * (1.0 - xc - yc);
    const cctXYZ = [ X, Y, Z ];

    const wbY = 0.54;
    const wbCoeff = ILLUMINANT_XY[whiteBalance] || ILLUMINANT_XY[Tr2StandardIlluminant.D55];
    const wbX = (wbY / wbCoeff[1]) * wbCoeff[0];
    const wbZ = (wbY / wbCoeff[1]) * (1.0 - wbCoeff[0] - wbCoeff[1]);
    const wbXYZ = [ wbX, wbY, wbZ ];

    const cctRGB = XYZToRGB(cctXYZ);
    const wbRGB = XYZToRGB(wbXYZ);

    const balancedRGB = [
        cctRGB[0] / wbRGB[0],
        cctRGB[1] / wbRGB[1],
        cctRGB[2] / wbRGB[2]
    ];

    const tintedRGB = [
        (1.0 - tint) * balancedRGB[0],
        tint * balancedRGB[1],
        (1.0 - tint) * balancedRGB[2]
    ];

    const componentMax = Math.max(tintedRGB[0], Math.max(tintedRGB[1], tintedRGB[2]));

    return [
        tintedRGB[0] / componentMax,
        tintedRGB[1] / componentMax,
        tintedRGB[2] / componentMax
    ];
}
