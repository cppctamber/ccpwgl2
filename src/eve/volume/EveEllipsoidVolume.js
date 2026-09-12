// Source: trinity/trinity/Eve/Volume/EveEllipsoidVolume.h
// Source: trinity/trinity/Eve/Volume/EveEllipsoidVolume.cpp
// Source: trinity/trinity/Eve/Volume/EveEllipsoidVolume_Blue.cpp
import { quat } from "math";
import { vec3 } from "math";
import { IEveVolume } from "./IEveVolume";
import { meta } from "utils";


/**
  * Oriented ellipsoid of influence with a hollow inner ellipsoid, weighting
  * points by falloff and seeding random points between the two shells.
  */
@meta.define("EveEllipsoidVolume", true)
export class EveEllipsoidVolume extends IEveVolume
{
    @meta.string
    name = "";
    @meta.vector3
    position = vec3.create();
    @meta.quaternion
    rotation = quat.create();
    @meta.vector3
    innerShape = vec3.create();
    @meta.vector3
    shape = vec3.create();
    @meta.boolean
    debugShowIntersection = false;

    _callbacks = new Map();

    _nextCallbackId = 1;

    _inverseRotation = quat.create();

    /**
      * Clamps the authored shapes, caches the inverse rotation and fires the change
      * callbacks.
      */
    Initialize()
    {
        this.Setup();
        return true;
    }

    /**
      * Returns a fresh sphere centred on the volume position with the largest shape
      * radius, so it covers the ellipsoid on every axis.
      */
    GetBoundingSphere()
    {
        return {
            center: vec3.clone(this.position),
            radius: Math.max(this.shape[0], this.shape[1], this.shape[2])
        };
    }

    /**
      * Returns the falloff weight for a point given in the volume's own space: the
      * point is moved into ellipsoid-local space with the cached inverse rotation,
      * then compared radially against the inner and outer shapes - 1 inside the
      * inner ellipsoid, 0 outside the outer one, and a squared ramp between them.
      */
    GetIntensity(position)
    {
        // Carbon quirk (EveEllipsoidVolume.cpp:79): rotate the query about
        // the origin before subtracting the unrotated authored centre.
        const local = this._query;
        vec3.transformQuat(local, position, this._inverseRotation);
        if (!EveEllipsoidVolume._contains(this.position, this.shape, local)) return 0;
        if (EveEllipsoidVolume._contains(this.position, this.innerShape, local)) return 1;
        vec3.set(this._innerIntersection, 0, 0, 0);
        vec3.subtract(this._direction, this.position, local);
        vec3.normalize(this._direction, this._direction);
        EveEllipsoidVolume._intersect(this._outerIntersection, this.position, this.shape, local, this._direction);
        if (vec3.squaredLength(this.innerShape) !== 0)
        {
            EveEllipsoidVolume._intersect(this._innerIntersection, this.position, this.innerShape, local, this._direction);
        }
        return vec3.squaredDistance(local, this._outerIntersection)
            / vec3.squaredDistance(this._innerIntersection, this._outerIntersection);
    }

    _query = vec3.create();
    _direction = vec3.create();
    _innerIntersection = vec3.create();
    _outerIntersection = vec3.create();

    /** Carbon BoundingSphere.cpp:173, including degenerate-axis comparisons. */
    static _contains(center, radii, point)
    {
        let sum = 0;
        for (let i = 0; i < 3; i++) sum += Math.pow((point[i] - center[i]) / radii[i], 2);
        return sum <= 1;
    }

    /** Carbon IntersectEllipsoidRayClosest, BoundingSphere.cpp:150. */
    static _intersect(out, center, radii, origin, direction)
    {
        let vv = 0, vs = 0, ss = 0;
        for (let i = 0; i < 3; i++)
        {
            const v = direction[i] / radii[i], s = (origin[i] - center[i]) / radii[i];
            vv += v * v; vs += v * s; ss += s * s;
        }
        let pq = Math.pow(vs / vv, 2) - ss / vv + 1 / vv;
        if (pq < 0) return false;
        pq = Math.sqrt(pq);
        const t1 = -pq - vs / vv, t2 = pq - vs / vv;
        vec3.scaleAndAdd(out, origin, direction, Math.abs(t1) < Math.abs(t2) ? t1 : t2);
        return true;
    }

    /**
      * Appends random points expressed in ellipsoid-local space, centred on the ellipsoid rather than offset by its position, split between the inner ellipsoid and the shell by their volume ratio biased with fallOffFactor.
      *
      * @param points Caller-owned array the new points are pushed onto.
      * @param excludeInnerVolume Keeps every point in the shell between the inner and outer shapes.
      */
    GeneratePointsInVolume(points, howManyToAdd, excludeInnerVolume, fallOffFactor)
    {
        const count = Math.max(0, Math.trunc(howManyToAdd));
        let innerSelectionChance = 0;
        if (!excludeInnerVolume)
        {
            innerSelectionChance = this.innerShape[0] * this.innerShape[1] * this.innerShape[2]
                / (this.shape[0] * this.shape[1] * this.shape[2]);
            innerSelectionChance = 1 - Math.pow(
                1 - innerSelectionChance,
                0.6 + 0.4 * fallOffFactor
            );
        }

        for (let i = 0; i < count; i++)
        {
            const angle = Math.PI * 2 * Math.random();
            const z = Math.random() * 2 - 1;
            const radial = Math.sqrt(1 - z * z);
            const direction = vec3.normalize(vec3.create(), vec3.fromValues(
                radial * Math.cos(angle),
                radial * Math.sin(angle),
                z
            ));

            const position = vec3.create();
            if (Math.random() > innerSelectionChance)
            {
                const distance = Math.pow(Math.random(), 0.75 * fallOffFactor);
                for (let axis = 0; axis < 3; axis++)
                {
                    position[axis] = direction[axis]
                        * (this.innerShape[axis] + (this.shape[axis] - this.innerShape[axis]) * distance);
                }
            }
            else
            {
                const distance = Math.pow(Math.random(), 1 / 3);
                for (let axis = 0; axis < 3; axis++)
                {
                    position[axis] = direction[axis] * this.innerShape[axis] * distance;
                }
            }
            points.push(position);
        }
    }

    /**
      * Registers a callback fired whenever the volume changes, returning the id
      * needed to unregister it again.
      */
    RegisterForChanges(callback)
    {
        const id = this._nextCallbackId++;
        this._callbacks.set(id, callback);
        return id;
    }

    /** Drops a change callback by the id RegisterForChanges returned. */
    UnregisterForChanges(callbackId)
    {
        this._callbacks.delete(callbackId);
    }

    /**
      * Re-clamps the shapes and the cached inverse rotation after an authored
      * change, and notifies every registered listener.
      */
    OnValueChanged()
    {
        this.Setup();
        return true;
    }

    /** No debug drawing in this port. */
    RenderDebugInfo()
    {
    }

    /**
      * Carbon Setup (EveEllipsoidVolume.cpp:35-55): clamp the shape to
      * non-negative radii, fit the inner shape inside it, refresh the cached
      * inverse rotation, and fire EVERY change callback - the ellipsoid's
      * callback fan-out lives INSIDE Setup, opposite to the box's, whose
      * OnModified fires them. Carbon also caches the rotation matrix pair and
      * the bounding sphere; this port derives those on demand.
      */
    Setup()
    {
        for (let i = 0; i < 3; i++)
        {
            this.shape[i] = Math.max(0, this.shape[i]);
            this.innerShape[i] = Math.min(Math.max(0, this.innerShape[i]), this.shape[i]);
        }
        quat.invert(this._inverseRotation, this.rotation);
        for (const callback of this._callbacks.values())
        {
            callback?.();
        }
    }

}
