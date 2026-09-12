// Source: trinity/trinity/Eve/Volume/EveSphereVolume.h
// Source: trinity/trinity/Eve/Volume/EveSphereVolume.cpp
// Source: trinity/trinity/Eve/Volume/EveSphereVolume_Blue.cpp
import { vec3 } from "math";
import { IEveVolume } from "./IEveVolume";
import { meta } from "utils";


/**
  * Sphere of influence with a solid inner radius and a falloff out to the outer
  * radius, weighting points and seeding random ones inside it.
  */
@meta.define("EveSphereVolume", true)
export class EveSphereVolume extends IEveVolume
{
    @meta.vector3
    position = vec3.create();
    @meta.float
    radius = 1;
    @meta.float
    innerRadius = 1;
    @meta.string
    name = "";

    _callbacks = new Map();

    _nextCallbackId = 1;

    /** Returns a fresh sphere centred on the volume position with its outer radius. */
    GetBoundingSphere()
    {
        return {
            center: vec3.clone(this.position),
            radius: this.radius
        };
    }

    /**
      * Returns the falloff weight for a point given in the volume's own space: 1
      * within the inner radius, 0 past the outer radius, and a ramp that is linear
      * in squared distance between them.
      */
    GetIntensity(position)
    {
        const distanceSq = vec3.squaredDistance(position, this.position);
        const outerRadiusSq = this.radius * this.radius;
        if (distanceSq > outerRadiusSq)
        {
            return 0;
        }
        const innerRadiusSq = this.innerRadius * this.innerRadius;
        if (distanceSq <= innerRadiusSq)
        {
            return 1;
        }
        const interpolationDistance = outerRadiusSq - innerRadiusSq;
        return interpolationDistance > 0 ? 1 - (distanceSq - innerRadiusSq) / interpolationDistance : 0;
    }

    /**
      * Appends random points expressed relative to the sphere centre rather than offset by its position, spread in direction uniformly over the sphere and in distance between the inner and outer radius as shaped by fallOffFactor.
      *
      * @param points Caller-owned array the new points are pushed onto.
      * @param excludeInnerVolume Keeps every point outside the inner radius.
      */
    GeneratePointsInVolume(points, howManyToAdd, excludeInnerVolume, fallOffFactor)
    {
        const count = Math.max(0, Math.trunc(howManyToAdd));
        const radiusRange = this.radius - this.innerRadius;
        let innerSelectionChance = 0;
        if (!excludeInnerVolume)
        {
            const adjustedOuterRadius = this.innerRadius + 0.5 * radiusRange;
            innerSelectionChance = this.innerRadius ** 2 / adjustedOuterRadius ** 2;
        }

        for (let i = 0; i < count; i++)
        {
            let distance;
            if (excludeInnerVolume)
            {
                distance = this.innerRadius + radiusRange * Math.pow(Math.random(), 1 / 3);
            }
            else if (Math.random() < innerSelectionChance)
            {
                distance = this.innerRadius * Math.pow(Math.random(), 1 / 3);
            }
            else
            {
                distance = this.innerRadius + radiusRange * Math.pow(Math.random(), fallOffFactor);
            }

            const angle = Math.PI * 2 * Math.random();
            const z = Math.random() * 2 - 1;
            const radial = Math.sqrt(1 - z * z);
            points.push(vec3.fromValues(
                radial * Math.cos(angle) * distance,
                radial * Math.sin(angle) * distance,
                z * distance
            ));
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
      * Clamps the radii so the outer radius stays non-negative and never smaller
      * than the inner one, then notifies every registered listener.
      */
    OnValueChanged()
    {
        // Legacy meta has no per-field flags. Compare the last observed radii
        // to retain Carbon's distinction between editing inner and outer.
        if (this.innerRadius !== this._lastInnerRadius && this.innerRadius > this.radius)
        {
            this.radius = this.innerRadius;
        }
        if (this.radius !== this._lastRadius)
        {
            this.radius = Math.max(0, this.radius);
            this.innerRadius = Math.min(this.innerRadius, this.radius);
        }
        this._lastInnerRadius = this.innerRadius;
        this._lastRadius = this.radius;
        for (const callback of this._callbacks.values()) if (callback) callback();
        return true;
    }

    _lastRadius = 1;
    _lastInnerRadius = 1;

    /** No debug drawing in this port. */
    RenderDebugInfo()
    {
    }
}
