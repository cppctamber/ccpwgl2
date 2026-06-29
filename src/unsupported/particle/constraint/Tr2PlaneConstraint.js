import { meta } from "utils";
import { vec4 } from "math";
import { Tw2ParticleConstraint } from "./Tw2ParticleConstraint";


@meta.notImplemented
@meta.type("Tr2PlaneConstraint")
@meta.ccp.define("Tr2PlaneConstraint")
export class Tr2PlaneConstraint extends Tw2ParticleConstraint
{
    @meta.vector4
    plane = vec4.fromValues(0, 1, 0, 0);

    @meta.boolean
    affectPosition = true;

    @meta.boolean
    affectVelocity = true;

    @meta.float
    friction = 1;

    @meta.float
    elasticity = 1;

    @meta.float
    reflectionNoise = 0;

    @meta.string
    particleRadiusComponent = "";

    @meta.vector4
    particleRadiusCoefficient = vec4.fromValues(1, 0, 0, 0);

    @meta.list("Tw2ParticleAttributeGenerator")
    generators = [];

    @meta.list("Tw2ParticleEmitter")
    onCollisionEmitters = [];

    @meta.private
    @meta.boolean
    isValid = false;

    Initialize()
    {
        for (let i = 0; i < this.onCollisionEmitters.length; i++)
        {
            const emitter = this.onCollisionEmitters[i];
            if (emitter && emitter.SetThreadSafeFlag)
            {
                emitter.SetThreadSafeFlag();
            }
        }
        return true;
    }

    OnModified()
    {
        return true;
    }

    ApplyConstraint()
    {
    }

    OnListModified(event, index, count, value, list)
    {
        if (list === this.onCollisionEmitters && value && value.SetThreadSafeFlag)
        {
            value.SetThreadSafeFlag();
        }
    }

    Bind()
    {
        this.isValid = false;
    }

    RenderDebugInfo()
    {
    }

}
