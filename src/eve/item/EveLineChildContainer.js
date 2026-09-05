// Source: trinity/trinity/Eve/SpaceObject/Children/LineSetPaths/EveLineChildContainer.cpp
import { meta } from "utils";
import { quat, vec3, vec4, sph3 } from "math";
import { IEveLineSetPath } from "eve/item/IEveLineSetPath";


@meta.define("EveLineChildContainer", true)
export class EveLineChildContainer extends IEveLineSetPath
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.boolean
    isVisible = true;

    @meta.vector3
    translation = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.list()
    lines = [];

    _meshSize = 0;

    OnModified()
    {
        this._regeneratePoints = true;
        return true;
    }

    OnListModified()
    {
        this._regeneratePoints = true;
        return true;
    }

    Update(...args)
    {
        let updateBounds = false;
        for (let i = 0; i < this.lines.length; i++)
        {
            const line = this.lines[i];
            if (line)
            {
                updateBounds = line.Update(...args) || updateBounds;
            }
        }
        if (this._regeneratePoints)
        {
            this.GeneratePoints();
            this.CalculateBoundingSphere();
            updateBounds = true;
        }
        else if (updateBounds)
        {
            // Carbon quirk CE-21: false occupies meshSize, so children are
            // recalculated (cpp:65), rather than passing false as argument two.
            this.CalculateBoundingSphere(0);
        }
        return updateBounds;
    }

    GetPointCount()
    {
        let count = 0;
        for (let i = 0; i < this.lines.length; i++)
        {
            const line = this.lines[i];
            if (line)
            {
                count += line.GetPointCount() || 0;
            }
        }
        return count;
    }

    UpdateVisibility(frustum, parentLodLevel, systemLocation)
    {
        if (!this.display) return;
        const sphere = vec4.clone(this._boundingSphere);
        sph3.transformMat4(sphere, sphere, this.worldTransform);
        this.isVisible = frustum.IsSphereVisible(sphere, sphere[3]);
        if (!this.isVisible) return;

        for (let i = 0; i < this.lines.length; i++)
        {
            this.lines[i].UpdateVisibility(frustum, parentLodLevel, systemLocation);
        }
    }

    /** Regenerates nested paths against the container's world transform. */
    GeneratePoints(parentTransform)
    {
        this.ApplyParentTransform(parentTransform);
        for (const line of this.lines) line.GeneratePoints(this.worldTransform);
        this._regeneratePoints = false;
    }

    /** Carbon deliberately forwards emission without composing the container again. */
    AddLinesToSet(lineSet, color, animColor, scrollSpeed)
    {
        if (!this.display || !this.isVisible) return;
        for (const line of this.lines) line.AddLinesToSet(lineSet, color, animColor, scrollSpeed);
    }

    /** Appends nested instance records, preserving hidden slots. */
    UpdateBuffer(data, offset = 0, systemLocation, viewPosition)
    {
        if (!this.display || !this.isVisible) return this.WriteHiddenInstances(data, offset);
        for (const line of this.lines) offset = line.UpdateBuffer(data, offset, systemLocation, viewPosition);
        return offset;
    }

    /** Carbon's mean-center enclosing sphere, including each path's mesh bonus. */
    CalculateBoundingSphere(meshSize = 0, reCalculateChildren = true)
    {
        if (meshSize !== 0) this._meshSize = meshSize;
        else meshSize = this._meshSize;
        if (!this.lines.length) return;
        const center = vec3.create();
        const sphere = vec4.create();
        let radius = 0;
        for (const line of this.lines)
        {
            if (reCalculateChildren) line.CalculateBoundingSphere(meshSize, true);
            line.GetBoundingSphere(sphere);
            vec3.add(center, center, sphere);
            radius = Math.max(radius, sphere[3]);
        }
        vec3.scale(center, center, 1 / this.lines.length);
        let distanceSquared = 0;
        for (const line of this.lines)
        {
            line.GetBoundingSphere(sphere);
            distanceSquared = Math.max(distanceSquared, vec3.squaredDistance(center, sphere));
        }
        vec4.set(this._boundingSphere, center[0], center[1], center[2], Math.sqrt(distanceSquared) + radius);
    }

    ResetLod()
    {
        super.ResetLod();
        for (let i = 0; i < this.lines.length; i++) this.lines[i].ResetLod();
    }

}
