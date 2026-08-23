import { meta } from "utils";
import { vec3 } from "math";
import { Tr2GpuSharedEmitter } from "./Tr2GpuSharedEmitter";


@meta.define("Tr2GpuUniqueEmitter", true)
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
