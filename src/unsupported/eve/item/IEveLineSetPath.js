import { meta } from "utils";
import { vec4 } from "math";


@meta.notImplemented
@meta.define({
    wgl: "IEveLineSetPath",
    ccp: true
})
export class IEveLineSetPath extends meta.Model
{
    Initialize()
    {
        return true;
    }

    OnModified()
    {
        return true;
    }

    Update()
    {
        return false;
    }

    GeneratePoints()
    {
        return undefined;
    }

    UpdateVisibility()
    {
        return undefined;
    }

    AddLinesToSet()
    {
        return undefined;
    }

    CalculateBoundingSphere()
    {
        return undefined;
    }

    RenderDebugInfo()
    {
        return undefined;
    }

    GetDebugOptions()
    {
        return undefined;
    }

    UpdateBuffer()
    {
        return undefined;
    }

    GetPointCount()
    {
        return 0;
    }

    GetBoundingSphere(out = vec4.create())
    {
        vec4.set(out, 0, 0, 0, 0);
        return out;
    }
}
