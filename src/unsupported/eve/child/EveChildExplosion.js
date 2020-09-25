import { meta, mat4, quat, vec3 } from "global";
import { EveChild } from "eve/child";


@meta.notImplemented
@meta.ctor("EveChildExplosion")
export class EveChildExplosion extends EveChild
{

    @meta.string
    name = "";

    @meta.float
    globalDuration = 0;

    @meta.struct("EveChildExplosion")
    globalExplosion = null;

    @meta.float
    globalExplosionDelay = 0;

    @meta.vector3
    globalScaling = vec3.fromValues(1, 1, 1);

    @meta.float
    localDuration = 0;

    @meta.struct("EveChildExplosion")
    localExplosion = null;

    @meta.float
    localExplosionInterval = 0;

    @meta.float
    localExplosionIntervalFactor = 0;

    @meta.struct("EveChildExplosion")
    localExplosionShared = null;

    @meta.list("EveChildExplosion")
    localExplosions = [];

    @meta.matrix4
    localTransform = mat4.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);


    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.localExplosion) this.localExplosion.GetResources(out);
        if (this.localExplosionShared) this.localExplosionShared.GetResources(out);
        for (let i = 0; i < this.localExplosions.length; i++)
        {
            this.localExplosions[i].GetResources(out);
        }
        return out;
    }

}
