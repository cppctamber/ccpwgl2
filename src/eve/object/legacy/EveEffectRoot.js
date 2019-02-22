import {vec3, quat, mat4} from "../../../global/index";
import {Tw2PerObjectData} from "../../../core/index";
import {EveObject} from "./EveObject";
import {EveSpaceObject} from "./EveSpaceObject";

/**
 * EveEffectRoot root objects for FX, can be put into scene's objects array
 * TODO: Implement LOD
 *
 * @property {String} name
 * @property {Boolean} display
 * @property {[{}]} curveSets
 * @property {[{}]} effectChildren
 * @property {vec3} scaling
 * @property {quat} rotation
 * @property {vec3} translation
 * @property {mat4} localTransform
 * @property {mat4} rotationTransform
 * @property {vec3} boundingSphereCenter
 * @property {number} boundingSphereRadius
 * @property {number} duration
 * @property {Tw2PerObjectData} _perObjectData
 * @class
 */
export class EveEffectRoot extends EveObject
{

    curveSets = [];
    effectChildren = [];
    duration = 0;
    scaling = vec3.fromValues(1, 1, 1);
    rotation = quat.create();
    translation = vec3.create();
    localTransform = mat4.create();
    rotationTransform = mat4.create();
    boundingSphereCenter = vec3.create();
    boundingSphereRadius = 0;
    _perObjectData = Tw2PerObjectData.from(EveSpaceObject.perObjectData);


    /**
     * Starts playing the effectRoot's curveSets if they exist
     */
    Start()
    {
        for (let i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Play();
        }
    }

    /**
     * Stops the effectRoot's curveSets from playing
     */
    Stop()
    {
        for (let i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Stop();
        }
    }

    /**
     * Gets effect root res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes>} [out]
     */
    GetResources(out = [])
    {
        for (let i = 0; i < this.effectChildren.length; ++i)
        {
            this.effectChildren[i].GetResources(out);
        }
        return out;
    }

    /**
     * Internal per frame update
     * @param {number} dt - Delta Time
     */
    Update(dt)
    {
        quat.normalize(this.rotation, this.rotation); // Don't really need to normalize...
        mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);

        for (let i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Update(dt);
        }

        for (let i = 0; i < this.effectChildren.length; ++i)
        {
            this.effectChildren[i].Update(dt, this.localTransform);
        }
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display) return;

        for (let i = 0; i < this.effectChildren.length; ++i)
        {
            this.effectChildren[i].GetBatches(mode, accumulator, this._perObjectData);
        }
    }

}
