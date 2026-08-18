import { vec3, mat4 } from "math";

/**
 * Scene-derived near/far planes.
 *
 * GL depth is hyperbolic, so the near plane - not the buffer's bit depth - is
 * what decides how well depth separates anything. With `near` 1 and `far` 50000
 * a float32 depth buffer resolves ~0.6m at 2300m and ~12m at 10km; at `near`
 * 100 the same buffer resolves 6mm and 12cm. That is a hundredfold difference
 * from one number, and no change of format or convention comes close to it.
 *
 * A fixed near plane cannot collect that, because the useful value depends on
 * where the camera is: raise it far enough to help when looking at a hull from
 * a distance and it slices the hull open when you zoom in. So it is measured
 * per frame from what is actually visible, which is as far out as it can be
 * without clipping, by construction.
 *
 * NOT included: planets and the background. `EveSpaceScene.RenderPlanets`
 * already substitutes its own 10000..1e11 projection and renders into
 * `depthRange(0.9, 1)`, leaving 0..0.9 to everything else - so the main
 * projection only ever has to cover scene objects, and folding a planet's
 * radius into `far` here would give back everything the near plane won.
 */

const
    _sphere = new Float32Array(4),
    _center = vec3.create(),
    _scratch = mat4.create();

/**
 * Snaps a value down to the previous power of two.
 *
 * The planes are quantised so that ordinary camera movement does not rewrite
 * the projection every frame. An unquantised near plane changes continuously,
 * which changes every depth value in the buffer continuously - and anything
 * sitting near a depth-test tie (co-planar decals, most of all) then flickers
 * as the tie is broken differently from frame to frame.
 *
 * Down for near, up for far: both directions are the conservative one, so the
 * quantisation can only ever widen the frustum, never clip something that was
 * visible a moment ago.
 * @param {Number} value
 * @returns {Number}
 */
function snapDown(value)
{
    return Math.pow(2, Math.floor(Math.log2(value)));
}

/**
 * Snaps a value up to the next power of two.
 * @param {Number} value
 * @returns {Number}
 */
function snapUp(value)
{
    return Math.pow(2, Math.ceil(Math.log2(value)));
}

/**
 * @param {*} sphere
 * @returns {Boolean}
 */
function isValidSphere(sphere)
{
    return !!sphere
        && Number.isFinite(sphere[0]) && Number.isFinite(sphere[1]) && Number.isFinite(sphere[2])
        && Number.isFinite(sphere[3]) && sphere[3] > 0;
}

/**
 * Largest scale factor any axis of a transform applies.
 * @param {mat4} transform
 * @returns {Number}
 */
function maxTransformScale(transform)
{
    const
        x = Math.hypot(transform[0], transform[1], transform[2]),
        y = Math.hypot(transform[4], transform[5], transform[6]),
        z = Math.hypot(transform[8], transform[9], transform[10]);

    return Math.max(x, y, z) || 1;
}

/**
 * Resolves an object's world-space bounding sphere into `out` as `[x,y,z,r]`.
 *
 * The same three-way fallback `EveSpaceSceneShadowHandler.GetObjectSphere`
 * uses, because scene objects genuinely do expose bounds in all three shapes.
 * Kept separate from it deliberately: that one is bound up with the shadow
 * handler's own state, and a near plane that clips the scene is a worse failure
 * than a duplicated resolver.
 * @param {*} object
 * @param {Float32Array} out
 * @returns {Boolean}
 */
function resolveSphere(object, out)
{
    if (!object) return false;

    if (typeof object.GetWorldBoundingSphere === "function")
    {
        if (isValidSphere(object.GetWorldBoundingSphere(out, false))) return true;
    }

    let transform = null;

    if (typeof object.GetBoundingSphere === "function" && isValidSphere(object.GetBoundingSphere(out, false)))
    {
        transform = object._worldTransform || object.worldTransform || null;
    }
    else if (Number.isFinite(object.boundingSphereRadius) && object.boundingSphereRadius > 0)
    {
        const center = object.boundingSphereCenter;
        out[0] = center ? center[0] : 0;
        out[1] = center ? center[1] : 0;
        out[2] = center ? center[2] : 0;
        out[3] = object.boundingSphereRadius;
        transform = object._worldTransform || object.worldTransform || null;
    }
    else
    {
        return false;
    }

    if (transform)
    {
        mat4.copy(_scratch, transform);
        vec3.set(_center, out[0], out[1], out[2]);
        vec3.transformMat4(_center, _center, _scratch);
        out[0] = _center[0];
        out[1] = _center[1];
        out[2] = _center[2];
        out[3] *= maxTransformScale(_scratch);
    }

    return isValidSphere(out);
}

/**
 * The world-space sphere enclosing a set of objects.
 *
 * Independent of the camera, unlike {@link ComputeAutoNearFar} - a shadow
 * cascade has to be fitted to where the object IS, not to how far away it is
 * being viewed from.
 * @param {Array} objects
 * @returns {{center: vec3, radius: Number}|null}
 */
export function GetSceneBoundingSphere(objects)
{
    let found = false;
    const center = vec3.create();
    let count = 0;

    for (let i = 0; i < objects.length; i++)
    {
        if (!resolveSphere(objects[i], _sphere)) continue;
        center[0] += _sphere[0];
        center[1] += _sphere[1];
        center[2] += _sphere[2];
        count++;
        found = true;
    }

    if (!found) return null;
    vec3.scale(center, center, 1 / count);

    // Second pass for the radius: the mean of the centres is not the centre of
    // the enclosing sphere, so measure the worst case against it rather than
    // assuming.
    let radius = 0;
    for (let i = 0; i < objects.length; i++)
    {
        if (!resolveSphere(objects[i], _sphere)) continue;
        const d = Math.hypot(_sphere[0] - center[0], _sphere[1] - center[1], _sphere[2] - center[2]);
        radius = Math.max(radius, d + _sphere[3]);
    }

    return radius > 0 ? { center, radius } : null;
}

/**
 * Computes near/far planes enclosing the given objects.
 *
 * Returns null when nothing measurable is visible, so the caller keeps whatever
 * it had rather than being handed a guess - an empty scene has no correct
 * answer, and inventing one would silently change the projection the moment a
 * load stalls.
 * @param {Array} objects
 * @param {vec3} cameraPosition
 * @param {Object} [options]
 * @param {Number} [options.minNear=0.1] - hard floor on the near plane
 * @param {Number} [options.maxFar=1e9] - hard ceiling on the far plane
 * @param {Number} [options.margin=0.05] - fractional slack added either side
 * @returns {{near:Number, far:Number}|null}
 */
export function ComputeAutoNearFar(objects, cameraPosition, options = {})
{
    const
        minNear = options.minNear !== undefined ? options.minNear : 0.1,
        maxFar = options.maxFar !== undefined ? options.maxFar : 1e9,
        margin = options.margin !== undefined ? options.margin : 0.05,
        // Fraction of the nearest measured surface the near plane may reach.
        //
        // HALF, not "nearest minus a few percent". The estimate comes from
        // bounding SPHERES, which routinely sit inside the geometry they
        // describe - wings, turrets, booster trails and child objects all
        // reach past a hull's reported radius - so a tight margin slices
        // pieces off the ship. Clipping the subject is a far worse failure
        // than leaving some depth precision unclaimed, and half the distance
        // still buys two orders of magnitude over a fixed near of 1.
        nearSafety = options.nearSafety !== undefined ? options.nearSafety : 0.5,
        maxDepthRatio = options.maxDepthRatio !== undefined ? options.maxDepthRatio : 1e4;

    let nearest = Infinity, farthest = 0, found = false;

    for (let i = 0; i < objects.length; i++)
    {
        if (!resolveSphere(objects[i], _sphere)) continue;

        const
            distance = Math.hypot(
                _sphere[0] - cameraPosition[0],
                _sphere[1] - cameraPosition[1],
                _sphere[2] - cameraPosition[2]
            ),
            radius = _sphere[3];

        // Nearest and farthest SURFACE, not centre. Using the centre puts the
        // near plane inside the hull the moment the camera is closer than the
        // bounding radius, which is exactly the close-up case this exists for.
        if (distance - radius < nearest) nearest = distance - radius;
        if (distance + radius > farthest) farthest = distance + radius;
        found = true;
    }

    if (!found || !(farthest > 0)) return null;

    const far = Math.min(maxFar, snapUp(farthest * (1 + margin)));

    // BOUND THE RATIO, do not just floor the near plane.
    //
    // A bounding sphere is a bad estimator exactly where this matters most:
    // zoom in far enough and the camera is INSIDE the sphere, so
    // `distance - radius` goes negative even though the real geometry is still
    // metres away. Clamping that to `minNear` was the first version of this
    // function, and it is the worst available answer - with a 0.0625 near
    // against a far in the tens of thousands the depth ratio reaches ~1e6, far
    // worse precision than the fixed `near = 1` it replaced. Carbon shadows
    // visibly disappeared when it engaged, which is how it was caught.
    //
    // Depth precision is governed by far/near, so that ratio is what gets
    // bounded. When the sphere estimate is unusable the near plane is derived
    // from the far plane instead, which cannot make precision worse than the
    // configured ceiling however wrong the estimate is.
    const
        estimated = nearest * nearSafety,
        floor = Math.max(minNear, far / maxDepthRatio),
        near = Math.max(floor, snapDown(Math.max(estimated, floor)));

    return { near, far: Math.max(far, near * 4) };
}
