import { meta } from "utils";
import { quat, vec3 } from "math";
import { IEveLineSetPath } from "eve/item/IEveLineSetPath";


@meta.notImplemented
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

    OnModified()
    {
        return true;
    }

    OnListModified()
    {
        return true;
    }

    Update(...args)
    {
        let updateBounds = false;
        for (let i = 0; i < this.lines.length; i++)
        {
            const line = this.lines[i];
            if (line && typeof line.Update === "function")
            {
                updateBounds = line.Update(...args) || updateBounds;
            }
        }
        return updateBounds;
    }

    GetPointCount()
    {
        let count = 0;
        for (let i = 0; i < this.lines.length; i++)
        {
            const line = this.lines[i];
            if (line && typeof line.GetPointCount === "function")
            {
                count += line.GetPointCount() || 0;
            }
        }
        return count;
    }

    UpdateVisibility(frustum, parentLodLevel, systemLocation)
    {
        super.UpdateVisibility(frustum, parentLodLevel, systemLocation);
        if (!this.isVisible) return;

        for (let i = 0; i < this.lines.length; i++)
        {
            this.lines[i].UpdateVisibility(frustum, parentLodLevel, systemLocation);
        }
    }

    ResetLod()
    {
        super.ResetLod();
        for (let i = 0; i < this.lines.length; i++) this.lines[i].ResetLod();
    }

}
