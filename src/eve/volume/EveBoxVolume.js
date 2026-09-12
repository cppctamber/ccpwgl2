// Source: trinity/trinity/Eve/Volume/EveBoxVolume.h
// Source: trinity/trinity/Eve/Volume/EveBoxVolume.cpp
// Source: trinity/trinity/Eve/Volume/EveBoxVolume_Blue.cpp
import { quat } from "math";
import { vec3 } from "math";
import { IEveVolume } from "./IEveVolume";
import { meta } from "utils";


/**
  * Oriented box of influence with a hollow inner box, weighting points by falloff
  * and seeding random points across its shell.
  */
@meta.define("EveBoxVolume", true)
export class EveBoxVolume extends IEveVolume
{
    @meta.vector3
    position = vec3.create();
    @meta.vector3
    scaling = vec3.create();
    @meta.vector3
    innerScaling = vec3.create();
    @meta.quaternion
    rotation = quat.create();
    @meta.string
    name = "";
    @meta.boolean
    debugShowIntersection = false;

    _callbacks = new Map();

    _nextCallbackId = 1;

    _inverseRotation = quat.create();

    /**
      * Clamps the authored scalings and caches the inverse rotation the intensity
      * test needs.
      */
    Initialize()
    {
        this.Setup();
        return true;
    }

    /**
      * Returns a fresh sphere centred on the box position whose radius is half the
      * length of the scaling vector.
      */
    GetBoundingSphere()
    {
        return {
            center: vec3.clone(this.position),
            radius: vec3.length(this.scaling) * 0.5
        };
    }

    /**
      * Returns the falloff weight for a point given in the volume's own space: the
      * point is moved into box-local space with the cached inverse rotation, then
      * compared radially against the inner and outer boxes - 1 inside the inner
      * box, 0 outside the outer one, and a squared ramp between them.
      */
    GetIntensity(position)
    {
        const local = this._query, inner = this._innerQuery;
        vec3.subtract(local, position, this.position);
        vec3.transformQuat(local, local, this._inverseRotation);
        // A zero outer axis defines no volume. Carbon's inverse is singular;
        // the browser declines that degenerate query rather than propagating NaN.
        if (this.scaling[0] === 0 || this.scaling[1] === 0 || this.scaling[2] === 0) return 0;
        for (let i = 0; i < 3; i++)
        {
            inner[i] = local[i] / this.innerScaling[i];
            local[i] /= this.scaling[i];
        }
        if (!EveBoxVolume._inside(local)) return 0;
        if (EveBoxVolume._inside(inner)) return 1;
        vec3.negate(this._direction, local);
        vec3.normalize(this._direction, this._direction);
        EveBoxVolume._ray(this._outerIntersection, local, this._direction);
        if (this.innerScaling[0] === 0 || this.innerScaling[1] === 0 || this.innerScaling[2] === 0)
        {
            vec3.set(this._innerIntersection, 0, 0, 0);
        }
        else
        {
            // Carbon intentionally uses the outer-space direction for both rays.
            EveBoxVolume._ray(this._innerIntersection, inner, this._direction);
            // Carbon innerBoxTransform * inverseBoxTransform: same centre and
            // rotation cancel, leaving this component-wise scale ratio.
            for (let i = 0; i < 3; i++) this._innerIntersection[i] *= this.innerScaling[i] / this.scaling[i];
        }
        return vec3.squaredDistance(local, this._outerIntersection)
            / vec3.squaredDistance(this._innerIntersection, this._outerIntersection);
    }

    _query = vec3.create();
    _innerQuery = vec3.create();
    _direction = vec3.create();
    _innerIntersection = vec3.create();
    _outerIntersection = vec3.create();

    /** Carbon's unit AABB containment test. */
    static _inside(p)
    {
        return p[0] >= -0.5 && p[0] <= 0.5 && p[1] >= -0.5 && p[1] <= 0.5 && p[2] >= -0.5 && p[2] <= 0.5;
    }

    /** Carbon BoundingBox.cpp:294 chooses the entry hit even from inside. */
    static _ray(out, origin, direction)
    {
        let minT = -Infinity;
        for (let i = 0; i < 3; i++)
        {
            if (direction[i] !== 0) minT = Math.max(minT, Math.min((-0.5 - origin[i]) / direction[i], (0.5 - origin[i]) / direction[i]));
        }
        vec3.scaleAndAdd(out, origin, direction, minT);
    }

    /**
      * Appends random points expressed in box-local space, centred on the box rather than offset by its position, choosing between the inner box and the six shell zones in proportion to their volumes and biasing shell samples outward by fallOffFactor. Generates nothing when any scaling axis is zero.
      *
      * @param points Caller-owned array the new points are pushed onto.
      * @param excludeInnerVolume Drops the inner box from the choice, keeping every point in the shell.
      */
    GeneratePointsInVolume(points, howManyToAdd, excludeInnerVolume, fallOffFactor)
    {
        if (this.scaling[0] === 0 || this.scaling[1] === 0 || this.scaling[2] === 0)
        {
            return;
        }

        const leftRightSideSize = (this.scaling[0] - this.innerScaling[0])
            * this.scaling[1] * this.scaling[2];
        const topBottomSize = this.innerScaling[0]
            * (this.scaling[1] - this.innerScaling[1]) * this.scaling[2];
        const frontBackLidSize = this.innerScaling[0] * this.innerScaling[1]
            * (this.scaling[2] - this.innerScaling[2]);
        const outerSidesSize = 2 * (leftRightSideSize + topBottomSize + frontBackLidSize);
        let innerToOuterSizeRatio = 0;

        if (!excludeInnerVolume)
        {
            const rangeX = this.scaling[0] - this.innerScaling[0];
            const rangeY = this.scaling[1] - this.innerScaling[1];
            const rangeZ = this.scaling[2] - this.innerScaling[2];
            const adjustedOuterCubeSize = (this.innerScaling[0] + 0.5 * rangeX)
                * (this.innerScaling[1] + 0.5 * rangeY)
                * (this.innerScaling[2] + 0.5 * rangeZ);
            innerToOuterSizeRatio = this.innerScaling[0] * this.innerScaling[1]
                * this.innerScaling[2] / adjustedOuterCubeSize;
            innerToOuterSizeRatio = 1 - Math.pow(
                1 - innerToOuterSizeRatio,
                0.8 + 0.2 * fallOffFactor
            );
        }

        const count = Math.max(0, Math.trunc(howManyToAdd));
        for (let i = 0; i < count; i++)
        {
            let zonePicker = Math.random();
            if (zonePicker < innerToOuterSizeRatio)
            {
                points.push(vec3.fromValues(
                    this.innerScaling[0] * Math.random() - 0.5 * this.innerScaling[0],
                    this.innerScaling[1] * Math.random() - 0.5 * this.innerScaling[1],
                    this.innerScaling[2] * Math.random() - 0.5 * this.innerScaling[2]
                ));
                continue;
            }

            zonePicker *= outerSidesSize;
            const position = vec3.create();
            if (zonePicker < 2 * leftRightSideSize)
            {
                const distance = 0.5 * this.innerScaling[0]
                    + Math.pow(Math.random(), fallOffFactor)
                    * (this.scaling[0] - this.innerScaling[0]) * 0.5;
                position[0] = zonePicker < leftRightSideSize ? distance : -distance;
                position[1] = Math.random() * this.scaling[1] - 0.5 * this.scaling[1];
                position[2] = Math.random() * this.scaling[2] - 0.5 * this.scaling[2];
            }
            else if (zonePicker < 2 * (leftRightSideSize + topBottomSize))
            {
                const distance = 0.5 * this.innerScaling[1]
                    + Math.pow(Math.random(), fallOffFactor)
                    * (this.scaling[1] - this.innerScaling[1]) * 0.5;
                position[0] = Math.random() * this.innerScaling[0] - 0.5 * this.innerScaling[0];
                position[1] = zonePicker < 2 * leftRightSideSize + topBottomSize ? distance : -distance;
                position[2] = Math.random() * this.scaling[2] - 0.5 * this.scaling[2];
            }
            else
            {
                // Carbon uses the Y dimensions for the front/back distance here.
                const distance = 0.5 * this.innerScaling[1]
                    + Math.pow(Math.random(), fallOffFactor)
                    * (this.scaling[1] - this.innerScaling[1]) * 0.5;
                position[0] = Math.random() * this.innerScaling[0] - 0.5 * this.innerScaling[0];
                position[1] = Math.random() * this.innerScaling[1] - 0.5 * this.innerScaling[1];
                position[2] = zonePicker < outerSidesSize - frontBackLidSize ? distance : -distance;
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
      * Re-clamps the scalings and the cached inverse rotation after an authored
      * change, then notifies every registered listener.
      */
    OnValueChanged()
    {
        this.Setup();
        for (const callback of this._callbacks.values())
        {
            callback?.();
        }
        return true;
    }

    /** No debug drawing in this port. */
    RenderDebugInfo()
    {
    }

    /**
      * Carbon Setup (EveBoxVolume.cpp:99-112): clamp the scalings, keep the
      * inner scaling inside the outer, refresh the cached derived state.
      * Carbon caches four full matrices plus the bounding sphere; this port
      * computes transforms and the sphere on demand, so the cached state is
      * the inverse rotation the intensity test reads. Box's Setup does NOT
      * fire change callbacks - OnModified does (cpp:194-215), unlike the
      * ellipsoid, whose Setup fires them itself.
      */
    Setup()
    {
        for (let i = 0; i < 3; i++)
        {
            this.scaling[i] = Math.max(0, this.scaling[i]);
            this.innerScaling[i] = Math.min(Math.max(0, this.innerScaling[i]), this.scaling[i]);
        }
        quat.invert(this._inverseRotation, this.rotation);
    }

}
