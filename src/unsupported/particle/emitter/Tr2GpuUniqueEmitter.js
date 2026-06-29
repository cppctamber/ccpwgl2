import { meta } from "utils";
import { vec3 } from "math";
import { Tr2GpuSharedEmitter } from "./Tr2GpuSharedEmitter";


@meta.type("Tr2GpuUniqueEmitter")
@meta.ccp.define("Tr2GpuUniqueEmitter")
@meta.notImplemented
export class Tr2GpuUniqueEmitter extends Tr2GpuSharedEmitter
{
    @meta.boolean
    scaledByParent = false;

    @meta.vector3
    attractorPosition = vec3.create();

    @meta.float
    attractorStrength = 0;

    GenerateID()
    {
    }

    Update(...args)
    {
        return super.Update(...args);
    }

    SpawnParticles(...args)
    {
        return super.SpawnParticles(...args);
    }
}
