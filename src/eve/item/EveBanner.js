import { meta } from "utils";
import { quat, vec3, mat4 } from "math";
import { Tw2PerObjectData, Tw2GeometryBatch } from "core";
import { device } from "global";



@meta.type("EveBanner")
@meta.notImplemented
export class EveBanner extends meta.Model // Tw2Transform
{

    @meta.string
    name = "";

    @meta.float
    @meta.notImplemented
    angleX = 0;

    @meta.float
    @meta.notImplemented
    angleY = 0;

    @meta.uint
    @meta.notImplemented
    boneIndex = -1;

    @meta.boolean
    display = true;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.uint
    @meta.notImplemented
    usage = 0;

    @meta.matrix4
    transform = mat4.create();

    @meta.struct()
    effect = null;

    _perObjectData = Tw2PerObjectData.from(EveBanner.perObjectData);

    _geometryResource = null;
    _localTransform = mat4.create();
    _worldTransform = mat4.create();


    /**
     * Gets the item's resources
     * @param out
     * @returns {*[]}
     */
    GetResources(out = [])
    {
        if (this.effect) this.effect.GetResources(out);
        if (this._geometryResource && !out.includes(this._geometryResource))
        {
            out.push(this._geometryResource);
        }
        return out;
    }

    /**
     * Checks if the item is good
     * @returns {Boolean}
     */
    IsGood()
    {
        return !!(this.effect && this.effect.IsGood() && this._geometryResource && this._geometryResource.IsGood());
    }

    /**
     * Per frame update
     * @param dt
     */
    Update(dt)
    {

    }

    /*
    UpdateViewDependentData(parentTransform, dt, spriteScale, perObjectData)
    {
        // Do bone calculation here?
    }
     */

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator|Tw2BatchAccumulator2} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {mat4} parentTransform
     * @returns {boolean}
     */
    GetBatches(mode, accumulator, perObjectData, parentTransform)
    {
        if (!this.display || mode !== device.RM_ADDITIVE || !this.IsGood())
        {
            return false;
        }

        let hasBone;
        if (this.boneIndex > -1)
        {
            const
                mat4_0 = EveBanner.global.mat4_0,
                bones = perObjectData.vs.Get("JointMat"),
                offset = this.boneIndex * 12;

            if (bones[offset] || bones[offset + 4] || bones[offset + 8])
            {
                mat4.fromJointMatIndex(mat4_0, bones, offset);
                mat4.multiply(mat4_0, mat4_0, this._localTransform);
                mat4.multiply(this._worldTransform, parentTransform, mat4_0);
                hasBone = true;
            }
        }

        if (!hasBone)
        {
            mat4.multiply(this._worldTransform, parentTransform, this._localTransform);
        }

        mat4.transpose(this._perObjectData.vs.Get("WorldMat"), this._worldTransform);
        this._perObjectData.ps = perObjectData.ps;

        const batch = new Tw2GeometryBatch();
        batch.renderMode = device.RM_ADDITIVE;
        batch.perObjectData = this._perObjectData;
        batch.geometryRes = this._geometryResource;
        batch.meshIx = 0;
        batch.start = 0;
        batch.count = this._geometryResource.meshes[0].areas.length;
        batch.effect = this.effect;
        accumulator.Commit(batch);

        return true;
    }

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        mat4.fromRotationTranslationScale(this._localTransform, this.rotation, this.position, this.scaling);
    }

    static global = {
        mat4_0 : mat4.create()
    }

    static perObjectData = {
        vs: [
            [ "WorldMat", 16 ]
        ],
    };

}
