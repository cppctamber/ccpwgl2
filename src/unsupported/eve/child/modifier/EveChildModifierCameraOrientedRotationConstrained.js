import { meta } from "utils";
import { EveChildModifier } from "./EveChildModifier";
import { vec3, quat, mat4 } from "math";
import { device } from "global";


const UP = vec3.fromValues(0, 1, 0);

let scratch = null;

function getScratch()
{
    if (!scratch)
    {
        scratch = {
            scale: vec3.create(),
            translation: vec3.create(),
            rotation: quat.create(),
            camPos: vec3.create(),
            p: vec3.create(),
            rotMatrix: mat4.create(),
            result: mat4.create()
        };
    }
    return scratch;
}


/**
 * EveChildModifierCameraOrientedRotationConstrained
 *
 * Source: carbonengine trinity/trinity/Eve/SpaceObject/Children/TransformModifiers/
 * EveChildModifierCameraOrientedRotationConstrained.h/.cpp (no persisted properties;
 * EveChildModifierCameraOrientedRotationConstrained_Blue.cpp's ExposeToBlue() only
 * maps the interface). Rotates the child about the world Y (up) axis so it faces the
 * camera in the horizontal plane, leaving pitch/roll from the child's own transform
 * untouched - a billboard constrained to the Y axis.
 */
@meta.notImplemented
@meta.type("EveChildModifierCameraOrientedRotationConstrained")
@meta.define({
    wgl: "EveChildModifierCameraOrientedRotationConstrained",
    ccp: true
})
export class EveChildModifierCameraOrientedRotationConstrained extends EveChildModifier
{

    /**
     * Builds an axis-angle rotation matrix in Carbon's flat layout, reproducing
     * `RotationMatrix(const Vector3& axis, float angle)`
     * (carbonengine math/include/Matrix_inline.h:388). Carbon's row-major element
     * `_(r+1)(c+1)` maps to this column-major mat4 at index `c*4 + r`, so each
     * assignment stores the same flat byte Carbon does (see
     * EveChildModifierTransformCommon.js header for the shared index-mapping note).
     * @param {mat4} out
     * @param {vec3} axis - normalized internally
     * @param {Number} angle - radians
     * @returns {mat4}
     */
    static rotationMatrixAxisAngle(out, axis, angle)
    {
        const
            normal = vec3.normalize(vec3.alloc(), axis),
            sinAngle = Math.sin(angle),
            cosAngle = Math.cos(angle),
            t = 1 - cosAngle;

        out[0] = t * normal[0] * normal[0] + cosAngle;
        out[4] = t * normal[0] * normal[1] - sinAngle * normal[2];
        out[8] = t * normal[0] * normal[2] + sinAngle * normal[1];
        out[12] = 0;

        out[1] = t * normal[1] * normal[0] + sinAngle * normal[2];
        out[5] = t * normal[1] * normal[1] + cosAngle;
        out[9] = t * normal[1] * normal[2] - sinAngle * normal[0];
        out[13] = 0;

        out[2] = t * normal[2] * normal[0] - sinAngle * normal[1];
        out[6] = t * normal[2] * normal[1] + sinAngle * normal[0];
        out[10] = t * normal[2] * normal[2] + cosAngle;
        out[14] = 0;

        out[3] = 0;
        out[7] = 0;
        out[11] = 0;
        out[15] = 1;

        vec3.unalloc(normal);
        return out;
    }

    /**
     * Applies this modifier's transform, mutating `transform` in place.
     *
     * Reproduces `EveChildModifierCameraOrientedRotationConstrained::ApplyTransform`
     * (EveChildModifierCameraOrientedRotationConstrained.cpp:15-32) verbatim:
     * decompose the child transform, project the camera direction into the child's
     * own rotation frame, take its heading angle in the X/Z plane, and pre-multiply
     * a Y-axis rotation by that angle so the child yaws to face the camera.
     * @param {mat4} transform - mutated in place
     * @returns {mat4} transform
     */
    ApplyTransform(transform)
    {
        const { scale, translation, rotation, camPos, p, rotMatrix, result } = getScratch();

        // Decompose( scale, rotation, translation, transform ) (cpp:19-21)
        mat4.decompose(transform, rotation, translation, scale);

        // rotMatrix = RotationMatrix( rotation ) - the Quaternion overload (cpp:23).
        // gl-matrix fromQuat yields Carbon's flat layout: mat4 column c equals Carbon
        // row c (verified for columns 0 and 2, the only rows the dot products below read).
        mat4.fromQuat(rotMatrix, rotation);

        // vec = rotMatrix * Vector4( camPos - translation, 0 ) (cpp:24-26). Carbon's
        // operator*(Matrix, Vector4) dots the matrix ROWS with the vector; row0 lands in
        // mat4 columns [0,1,2] and row2 in [8,9,10]. Only vec.x and vec.z feed atan2, so
        // vec.y (row1) is never formed.
        device.GetEyePosition(camPos);
        p[0] = camPos[0] - translation[0];
        p[1] = camPos[1] - translation[1];
        p[2] = camPos[2] - translation[2];

        const vecX = rotMatrix[0] * p[0] + rotMatrix[1] * p[1] + rotMatrix[2] * p[2];
        const vecZ = rotMatrix[8] * p[0] + rotMatrix[9] * p[1] + rotMatrix[10] * p[2];

        // rot = atan2f( vec.x, vec.z ); result = RotationMatrix( up, rot ) (cpp:28-29)
        const rot = Math.atan2(vecX, vecZ);
        this.constructor.rotationMatrixAxisAngle(result, UP, rot);

        // return result * transform (cpp:31); mat4.multiply(out, A, B) mirrors Carbon A * B
        // (see EveChildModifierBillboard3D.js / EveChildModifierTransformCommon.js).
        mat4.multiply(transform, result, transform);
        return transform;
    }

}
