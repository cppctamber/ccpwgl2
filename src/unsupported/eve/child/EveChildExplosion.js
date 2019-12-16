import { meta, mat4, quat, vec3 } from "global";
import { EveChild } from "eve/child";


@meta.notImplemented
@meta.type("EveChildExplosion", true)
export class EveChildExplosion extends EveChild
{

    @meta.black.string
    name = "";

    @meta.black.float
    globalDuration = 0;

    @meta.black.objectOf("EveChildExplosion")
    globalExplosion = null;

    @meta.black.float
    globalExplosionDelay = 0;

    @meta.black.vector3
    globalScaling = vec3.fromValues(1, 1, 1);

    @meta.black.float
    localDuration = 0;

    @meta.black.objectOf("EveChildExplosion")
    localExplosion = null;

    @meta.black.float
    localExplosionInterval = 0;

    @meta.black.float
    localExplosionIntervalFactor = 0;

    @meta.black.objectOf("EveChildExplosion")
    localExplosionShared = null;

    @meta.black.listOf("EveChildExplosion")
    localExplosions = [];

    @meta.black.matrix4
    localTransform = mat4.create();

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
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
