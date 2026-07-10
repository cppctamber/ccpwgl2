import { mat4, vec3 } from "math";
import { device } from "global";


/**
 * Shared camera-relative transform math used by several EveChildModifier* transform modifiers.
 *
 * Ported from the free functions in `EveChildModifierTransformCommon.h`
 * (carbonengine trinity/trinity/Eve/SpaceObject/Children/TransformModifiers/EveChildModifierTransformCommon.h).
 * Carbon's `Matrix` is row-major with row-vector transforms (`v' = v * M`); its
 * basis rows (X=row0/_11../_13, Y=row1/_21../_23, Z=row2/_31../_33) map directly
 * onto this codebase's column-major `mat4` at indices [0,1,2] / [4,5,6] / [8,9,10]
 * respectively (translation at [12,13,14]) - the same index mapping already relied
 * on by `EveChildModifierHalo.js` and `EveChildModifierCameraOrientedRotationConstrained.js`
 * in this folder, where `mat4.multiply(out, A, B)` is likewise used to directly
 * mirror Carbon's `A * B` composition order.
 */


let scratch = null;

function getScratch()
{
    if (!scratch)
    {
        scratch = {
            camFwd: vec3.create(),
            right: vec3.create(),
            up: vec3.create(),
            parentT: mat4.create(),
            toObject: vec3.create()
        };
    }
    return scratch;
}

/**
 * Builds a change-of-basis matrix from a forward and up vector.
 *
 * Reproduces the engine intrinsic `TriMatrixChangeBase` as called from
 * `DistanceBase` (EveChildModifierTransformCommon.h:60). `TriMatrixChangeBase`'s
 * own source isn't part of this port's corpus, so this reconstructs the
 * right-handed orthonormal basis (right = up x forward) the same way it's
 * already reconstructed inline in `EveChildModifierHalo.js`'s `modifyHalo`
 * (which builds alignMat columns as right/up/forward at indices 0,4,8).
 * @param {mat4} out
 * @param {vec3} forward - unit vector
 * @param {vec3} up - unit vector
 * @returns {mat4}
 */
function changeBase(out, forward, up)
{
    const { right } = getScratch();
    vec3.cross(right, up, forward);

    mat4.identity(out);
    out[0] = right[0]; out[1] = right[1]; out[2] = right[2];
    out[4] = up[0]; out[5] = up[1]; out[6] = up[2];
    out[8] = forward[0]; out[9] = forward[1]; out[10] = forward[2];
    return out;
}

/**
 * Computes the camera-facing alignment basis for a transform, plus the
 * (parent-space, scale-corrected) distance and direction to the camera.
 *
 * Ported from `DistanceBase` (EveChildModifierTransformCommon.h:11-61), used by
 * `EveChildModifierBooster` and `EveChildModifierHaloInverted` (both parented
 * on it directly) and indirectly by `EveChildModifierBillboard3D` (through its
 * own `Billboard2D` + `DistanceBase` fallback path).
 * @param {mat4} outAlignMat - receives the change-of-basis matrix
 * @param {vec3} outD - receives camPos - transform's translation (not normalized)
 * @param {mat4} transform - the child's local transform (read only)
 * @returns {Number} distCenter - parent-space, scale-corrected distance to the camera
 */
export function DistanceBase(outAlignMat, outD, transform)
{
    const { camFwd, right, up, parentT } = getScratch();

    const camPos = device.eyePosition;
    outD[0] = camPos[0] - transform[12];
    outD[1] = camPos[1] - transform[13];
    outD[2] = camPos[2] - transform[14];

    vec3.copy(camFwd, outD);
    mat4.transpose(parentT, transform);
    vec3.transformMat4(camFwd, camFwd, parentT);

    const lengthSqX = vec3.squaredLength(transform.subarray(0, 3));
    const lengthSqY = vec3.squaredLength(transform.subarray(4, 7));
    const lengthSqZ = vec3.squaredLength(transform.subarray(8, 11));
    camFwd[0] = lengthSqX !== 0 ? camFwd[0] / lengthSqX : 0;
    camFwd[1] = lengthSqY !== 0 ? camFwd[1] / lengthSqY : 0;
    camFwd[2] = lengthSqZ !== 0 ? camFwd[2] / lengthSqZ : 0;

    const distCenter = vec3.length(camFwd);
    vec3.normalize(camFwd, camFwd);

    const view = device.view;
    vec3.set(right, view[0], view[4], view[8]);
    vec3.transformMat4(right, right, parentT);

    vec3.cross(up, camFwd, right);
    vec3.normalize(up, up);

    changeBase(outAlignMat, camFwd, up);

    return distCenter;
}

/**
 * Aligns a transform's basis to face the camera while keeping its scale and
 * translation, mutating `transform` in place.
 *
 * Ported from the free function `Billboard2D` (EveChildModifierTransformCommon.h:63-84),
 * used by `EveChildModifierBillboard2D` directly and by
 * `EveChildModifierBillboard3D`'s non-fixed path.
 * @param {mat4} transform - mutated in place
 * @returns {mat4} transform
 */
export function Billboard2D(transform)
{
    const scaleX = vec3.length(transform.subarray(0, 3));
    const scaleY = vec3.length(transform.subarray(4, 7));
    const scaleZ = vec3.length(transform.subarray(8, 11));

    const invView = device.viewInverse;

    transform[0] = invView[0] * scaleX; transform[1] = invView[1] * scaleX; transform[2] = invView[2] * scaleX;
    transform[4] = invView[4] * scaleY; transform[5] = invView[5] * scaleY; transform[6] = invView[6] * scaleY;
    transform[8] = invView[8] * scaleZ; transform[9] = invView[9] * scaleZ; transform[10] = invView[10] * scaleZ;

    return transform;
}

/**
 * Builds a basis oriented from `position` towards the camera (a "true" 3D
 * billboard, as opposed to `Billboard2D`'s screen-aligned billboard).
 *
 * Ported from the free function `Billboard3D` (EveChildModifierTransformCommon.h:86-100),
 * used by `EveChildModifierBillboard3D`'s fixed path.
 * @param {mat4} out
 * @param {vec3} position - world-space position to orient towards the camera
 * @returns {mat4} out
 */
export function Billboard3D(out, position)
{
    const { toObject, right, up } = getScratch();

    vec3.subtract(toObject, device.eyePosition, position);
    vec3.normalize(toObject, toObject);

    vec3.cross(right, [ 0, 1, 0 ], toObject);
    if (vec3.squaredLength(right) === 0)
    {
        vec3.set(right, 1, 0, 0);
    }
    else
    {
        vec3.normalize(right, right);
    }

    vec3.cross(up, toObject, right);
    vec3.normalize(up, up);

    mat4.identity(out);
    out[0] = right[0]; out[1] = right[1]; out[2] = right[2];
    out[4] = up[0]; out[5] = up[1]; out[6] = up[2];
    out[8] = toObject[0]; out[9] = toObject[1]; out[10] = toObject[2];
    return out;
}
