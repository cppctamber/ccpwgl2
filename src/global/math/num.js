export const num = {};

num.EPSILON = 0.000001;
num.RAD2DEG = 180 / Math.PI;
num.DEG2RAD = Math.PI / 180;
num.TWO_PI = Math.PI * 2;
num.PI = Math.PI;

/**
 * biCumulative
 *
 * @param {number} t
 * @param {number} order
 * @returns {number}
 */
num.biCumulative = function(t, order)
{
    if (order === 1)
    {
        const some = (1.0 - t);
        return 1.0 - some * some * some;
    }
    else if (order === 2)
    {
        return 3.0 * t * t - 2.0 * t * t * t;
    }
    else
    {
        return t * t * t;
    }
};

/**
 * @alias Math.ceil
 */
num.ceil = Math.ceil;

/**
 * Clamps a number
 *
 * @param {number} a
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
num.clamp = function(a, min, max)
{
    return Math.max(min, Math.min(max, a));
};

/**
 * Returns how many decimal places a number has
 *
 * @param {number} a
 * @returns {number}
 */
num.decimalPlaces = function(a)
{
    let match = ("" + a).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
    return match ? Math.max(0, (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0)) : 0;
};

/**
 * Converts from radians to degrees
 *
 * @param {number} a
 * @returns {number}
 */
num.degrees = function(a)
{
    return a * num.RAD2DEG;
};

/**
 * Converts from radians to unwrapped degrees
 *
 * @param {number} a
 * @returns {number}
 */
num.degreesUnwrapped = function(a)
{
    return num.unwrapDegrees(a * num.RAD2DEG);
};

/**
 * Converts a Dword to Float
 * @param value
 * @return {Number}
 */
num.dwordToFloat = function(value)
{
    const
        b4 = (value & 0xff),
        b3 = (value & 0xff00) >> 8,
        b2 = (value & 0xff0000) >> 16,
        b1 = (value & 0xff000000) >> 24,
        sign = 1 - (2 * (b1 >> 7)), // sign = bit 0
        exp = (((b1 << 1) & 0xff) | (b2 >> 7)) - 127, // exponent = bits 1..8
        sig = ((b2 & 0x7f) << 16) | (b3 << 8) | b4; // significand = bits 9..31

    if (sig === 0 && exp === -127) return 0.0;
    return sign * (1 + sig * Math.pow(2, -23)) * Math.pow(2, exp);
};

/**
 * Checks if a number equals another
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
num.equals = function(a, b)
{
    return Math.abs(a - b) <= num.EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
};

/**
 * Checks if a number exactly equals another
 * - included for library consistency
 *
 * @param {number} a
 * @param {number} b
 * @returns {boolean}
 */
num.exactEquals = function(a, b)
{
    return a === b;
};

/**
 * Exponential decay
 *
 * @param {number} omega0
 * @param {number} torque
 * @param {number} I - inertia
 * @param {number} d - drag
 * @param {number} time - time
 * @returns {number}
 */
num.exponentialDecay = function(omega0, torque, I, d, time)
{
    return torque * time / d + I * (omega0 * d - torque) / (d * d) * (1.0 - Math.pow(Math.E, -d * time / I));
};

/**
 * Gets the fractional components of a number
 *
 * @param {number} a
 * @returns {number}
 */
num.fract = function(a)
{
    return a - Math.floor(a);
};

/**
 * Gets a value from a half float
 * @author Babylon
 * @param {number} a
 * @returns {number}
 */
num.fromHalfFloat = function(a)
{
    const
        s = (a & 0x8000) >> 15,
        e = (a & 0x7C00) >> 10,
        f = a & 0x03FF;

    if (e === 0)
    {
        return (s ? -1 : 1) * Math.pow(2, -14) * (f / Math.pow(2, 10));
    }
    else if (e === 0x1F)
    {
        return f ? NaN : ((s ? -1 : 1) * Infinity);
    }

    return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + (f / Math.pow(2, 10)));
};

/**
 * @alias Math.floor
 */
num.floor = Math.floor;

/**
 * Gets long word order
 * @author Babylon
 * @param {number} a
 * @returns {number}
 */
num.getLongWordOrder = function(a)
{
    return (a === 0 || a === 255 || a === -16777216) ? 0 : 1 + num.getLongWordOrder(a >> 8);
};

/**
 *
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
num.greaterThan = function(a, b)
{
    return a > b ? 1 : 0;
};

/**
 *
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
num.greaterThanEqual = function(a, b)
{
    return num.isEqual(a, b) || a > b ? 1 : 0;
};

/**
 *
 * - included for library consistency
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
num.greaterThanExactEqual = function(a, b)
{
    return a >= b ? 1 : 0;
};


/**
 * Checks if a number is even
 *
 * @param {number} a
 * @returns {boolean}
 */
num.isEven = function(a)
{
    return Math.abs(a) % 2 === 0;
};

/**
 * Checks if a number is a float
 *
 * @param {number} a
 * @returns {boolean}
 */
num.isFloat = function(a)
{
    return a % 1 !== 0;
};

/**
 * @alias Number.isFinite
 */
num.isFinite = Number.isFinite;
// return (typeof v === "number" && !isNaN(v) && v !== Infinity && v !== -Infinity);

/**
 * Checks if a number is an integer
 *
 * @param {number} a
 * @returns {boolean}
 */
num.isInt = function(a)
{
    return a % 1 === 0;
};

/**
 * @alias Number.isNaN
 */
num.isNaN = Number.isNaN;

/**
 * Checks if a number is odd
 *
 * @param {number} a
 * @returns {boolean}
 */
num.isOdd = function(a)
{
    return Math.abs(a) % 2 === 1;
};

/**
 * Checks if a number is to the power of two
 *
 * @param {number} a
 * @returns {boolean}
 */
num.isPowerOfTwo = function(a)
{
    return (a & (a - 1)) === 0 && a !== 0;
};

/**
 *
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
num.lessThan = function(a, b)
{
    return a < b ? 1 : 0;
};

/**
 *
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
num.lessThanEqual = function(a, b)
{
    return num.isEqual(a, b) || a < b ? 1 : 0;
};

/**
 *
 * - included for library consistency
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
num.lessThanExactEqual = function(a, b)
{
    return a <= b ? 1 : 0;
};

/**
 * Gets the log2 of a number
 * @param {number} a
 * @returns {number}
 */
num.log2 = function(a)
{
    return Math.log(a) * Math.LOG2E;
};

/**
 * @alias Math.max
 */
num.max = Math.max;

/**
 * @alias Math.min
 */
num.min = Math.min;


/**
 * Gets the nearest power of two value to a number
 *
 * @param {number} a
 * @returns {number}
 */
num.nearestPowerOfTwo = function(a)
{
    return Math.pow(2, Math.round(Math.log(a) / Math.LN2));
};

/**
 *
 *
 * @param {number} value
 * @param {number} start
 * @param {number} end
 * @param {number} precision
 * @returns {number}
 */
num.normalizeInt = function(value, start, end, precision)
{
    let width = end - start;
    let offsetValue = value - start;
    let result = (offsetValue - ((offsetValue / width) * width)) + start;
    return precision === undefined ? result : Number(result.toFixed(precision));
};

/**
 *
 *
 * @param {number} value
 * @param {number} start
 * @param {number} end
 * @param {number} precision
 * @returns {number}
 */
num.normalizeFloat = function(value, start, end, precision)
{
    let width = end - start;
    let offsetValue = value - start;
    let result = (offsetValue - (Math.floor(offsetValue / width) * width)) + start;
    return precision === undefined ? result : Number(result.toFixed(precision));
};


/**
 * Converts from degrees to radians
 *
 * @param {number} a
 * @returns {number}
 */
num.radians = function(a)
{
    return a * num.DEG2RAD;
};

/**
 * Converts from degrees to unwrapped radians
 *
 * @param {number} a
 * @returns {number}
 */
num.radiansUnwrapped = function(a)
{
    return num.unwrapRadians(a *= num.DEG2RAD);
};

/**
 * Creates a random integer
 *
 * @param {number} low
 * @param {number} high
 * @returns {number}
 */
num.randomInt = function(low, high)
{
    return low + Math.floor(Math.random() * (high - low + 1));
};

/**
 * Creates a random float
 *
 * @param {number} low
 * @param {number} high
 * @returns {number}
 */
num.randomFloat = function(low, high)
{
    return low + Math.random() * (high - low);
};

/**
 * @alias for Math.round
 */
num.round = Math.round;

/**
 * Rounds a number to the closest zero
 *
 * @param {number} a
 * @returns {number}
 */
num.roundToZero = function(a)
{
    return a < 0 ? Math.ceil(a) : Math.floor(a);
};

/**
 * @alias for num.greaterThan
 */
num.step = num.greaterThan;

/**
 *
 * @param a
 * @param min
 * @param max
 * @returns {number}
 */
num.smoothStep = function(a, min, max)
{
    if (a <= min) return 0;
    if (a >= max) return 1;
    a = (a - min) / (max - min);
    return a * a * (3 - 2 * a);
};

/**
 *
 * @param a
 * @param min
 * @param max
 * @returns {number}
 */
num.smootherStep = function(a, min, max)
{
    if (a <= min) return 0;
    if (a >= max) return 1;
    a = (a - min) / (max - min);
    return a * a * a * (a * (a * 6 - 15) + 10);
};

/**
 * Converts a number to a half float
 * @author http://stackoverflow.com/questions/32633585/how-do-you-convert-to-half-floats-in-javascript
 * @param {number} a
 * @returns {number}
 */
num.toHalfFloat = (function()
{
    let floatView, int32View;

    return function(a)
    {
        if (!floatView)
        {
            floatView = new Float32Array(1);
            int32View = new Int32Array(floatView.buffer);
        }

        floatView[0] = a;
        const x = int32View[0];

        let bits = (x >> 16) & 0x8000;
        /* Get the sign */
        let m = (x >> 12) & 0x07ff;
        /* Keep one extra bit for rounding */
        let e = (x >> 23) & 0xff;
        /* Using int is faster here */

        /* If zero, or denormal, or exponent underflows too much for a denormal half, return signed zero. */
        if (e < 103)
        {
            return bits;
        }

        /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
        if (e > 142)
        {
            bits |= 0x7c00;
            /* If exponent was 0xff and one mantissa bit was set, it means NaN,
                 * not Inf, so make sure we set one mantissa bit too. */
            bits |= ((e === 255) ? 0 : 1) && (x & 0x007fffff);
            return bits;
        }

        /* If exponent underflows but not too much, return a denormal */
        if (e < 113)
        {
            m |= 0x0800;
            /* Extra rounding may overflow and set mantissa to 0 and exponent to 1, which is OK. */
            bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
            return bits;
        }

        bits |= ((e - 112) << 10) | (m >> 1);
        /* Extra rounding. An overflow will set mantissa to 0 and increment the exponent, which is OK. */
        bits += m & 1;
        return bits;
    };

}());

/**
 * Unwraps degrees
 *
 * @param {number} d
 * @returns {number}
 */
num.unwrapDegrees = function(d)
{
    d = d % 360;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
};

/**
 * Unwraps radians
 *
 * @param {number} r
 * @returns {number}
 */
num.unwrapRadians = function(r)
{
    r = r % num.TWO_PI;
    if (r > num.PI) r -= num.TWO_PI;
    if (r < -num.PI) r += num.TWO_PI;
    return r;
};