import { meta } from "utils";
import { quat, vec3, mat4, box3, sph3 } from "math";
import { Tw2PerObjectData, Tw2GeometryBatch, Tw2Effect } from "core";
import { resMan } from "global";
import { RM_ADDITIVE } from "constant";


@meta.type("EveBanner")
@meta.notImplemented
export class EveBanner extends meta.Model
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
    usage = 0;

    @meta.matrix4
    transform = mat4.create();

    @meta.struct()
    effect = Tw2Effect.from(EveBanner.defaultBannerEffect);

    /* CCPWGL ONLY */

    constructor()
    {
        super();
        this.effect.SetParameters({ objectId: [ this._id, 0, 0, 0 ] });
    }

    /**
     * Checks if the banner is skinned
     * @returns {boolean}
     */
    get isSkinned()
    {
        return !!this._bone;
    }

    _bone = null;
    _boundsDirty = true;
    _perObjectData = Tw2PerObjectData.from(EveBanner.perObjectData);
    _geometryResource = resMan.GetResource("cdn:/graphics/generic/unit_plane.gr2_json");
    _worldTransform = mat4.create();


    // --------------------------------- testy mctest face  -------------------------//

    get imageMapResPath()
    {
        return this.effect.parameters.ImageMap ? this.effect.parameters.ImageMap.GetValue() : "";
    }

    set imageMapResPath(resPath)
    {
        this.effect.SetParameters({ "ImageMap": resPath });
    }

    get maskMapResPath()
    {
        return this.effect.parameters.MaskMap ? this.effect.parameters.MaskMap.GetValue() : "";
    }

    set maskMapResPath(resPath)
    {
        this.effect.SetParameters({ "MaskMap": resPath });
    }

    get borderMapResPath()
    {
        return this.effect.parameters.BorderMap ? this.effect.parameters.BorderMap.GetValue() : "";
    }

    set borderMapResPath(resPath)
    {
        this.effect.SetParameters({ "BorderMap": resPath });
    }

    // --------------------------------- testy mctest face  -------------------------//


    /**
     * Gets local direction
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetDirection(out)
    {
        vec3.set(out, this.transform[8], this.transform[9], this.transform[10]);
        return vec3.normalize(out, out);
    }

    /**
     * Gets offset direction
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetSkinnedDirection(out)
    {
        if (!this._bone) return this.GetDirection(out);
        const mat4_0 = mat4.multiply(EveBanner.global.mat4_0, this._bone.offsetTransform, this.transform);
        vec3.set(out, mat4_0[8], mat4_0[9], mat4_0[10]);
        return vec3.normalize(out, out);
    }

    /**
     * Gets local direction
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetWorldDirection(out)
    {
        vec3.set(out, this._worldTransform[8], this._worldTransform[9], this._worldTransform[10]);
        return vec3.normalize(out, out);
    }

    /**
     * Gets the banner's local bounding box
     * @param {box3} out
     * @returns {null|box3}
     */
    GetBoundingBox(out)
    {
        const res = this._geometryResource;
        if (!res && !res.IsGood())
        {
            box3.empty(out);
            return null;
        }
        box3.fromBounds(out, res.minBounds, res.maxBounds);
        return box3.transformMat4(out, out, this.transform);
    }

    /**
     * Gets the banner's offset bounding box
     * @param {box3} out
     * @returns {box3|null}
     */
    GetSkinnedBoundingBox(out)
    {
        if (!this.GetBoundingBox(out)) return null;
        return this._bone ? box3.transformMat4(out, out, this._bone.offsetTransform) : out;
    }

    /**
     * Gets the banner's world bounding box
     * @param {box3} out
     * @returns {box3|null}
     */
    GetWorldBoundingBox(out)
    {
        const res = this._geometryResource;
        if (!res && !res.IsGood())
        {
            box3.empty(out);
            return null;
        }
        box3.fromBounds(out, res.minBounds, res.maxBounds);
        return box3.transformMat4(out, out, this._worldTransform);
    }

    /**
     * Gets the banner's local bounding sphere
     * @param {sph3} out
     * @returns {null|sph3}
     */
    GetBoundingSphere(out)
    {
        const res = this._geometryResource;
        if (!res && !res.IsGood())
        {
            sph3.empty(out);
            return null;
        }
        sph3.fromPositionRadius(out, res.boundsSpherePosition, res.boundsSphereRadius);
        return sph3.transformMat4(out, out, this.transform);
    }

    /**
     * Gets the banner's offset bounding sphere
     * @param {sph3} out
     * @returns {null|sph3}
     */
    GetSkinnedBoundingSphere(out)
    {
        if (!this.GetBoundingSphere(out)) return null;
        return this._bone ? sph3.transformMat4(out, out, this._bone.offsetTransform) : out;
    }

    /**
     * Gets the banner's world bounding sphere
     * @param {sph3} out
     * @returns {null|sph3}
     */
    GetWorldBoundingSphere(out)
    {
        const res = this._geometryResource;
        if (!res && !res.IsGood())
        {
            sph3.empty(out);
            return null;
        }
        sph3.fromPositionRadius(out, res.boundsSpherePosition, res.boundsSphereRadius);
        return sph3.transformMat4(out, out, this._worldTransform);
    }

    /**
     * Fits the banner to the current image map
     */
    FitToImageSize(baseWidth)
    {
        const
            { ImageMap: { textureRes: { _height = 0, _width = 0 } = {} } = {} } = this.effect.parameters,
            aspect = _height / _width;

        if (aspect)
        {
            baseWidth = baseWidth || Math.min(this.scaling[0], this.scaling[1], this.scaling[2]);
            this.scaling[0] = baseWidth;
            this.scaling[1] = baseWidth * aspect;
            this.scaling[2] = baseWidth;
            this.UpdateValues();
        }
    }

    /**
     * Gets the local skinned transform
     * @param {mat4} m
     * @returns {mat4}
     */
    GetSkinnedTransform(m)
    {
        return this._bone
            ? mat4.multiply(m, this._bone.offsetTransform, this.transform)
            : mat4.copy(m, this.transform);
    }

    /**
     * Gets the local transform
     * @param {mat4} m
     * @returns {mat4}
     */
    GetTransform(m)
    {
        return mat4.copy(m, this.transform);
    }

    /**
     * Sets the local transform
     * @param {mat4} m
     * @param {Object} [opt]
     */
    SetTransform(m, opt)
    {
        mat4.getRotation(this.rotation, m);
        mat4.getTranslation(this.position, m);
        mat4.getScaling(this.scaling, m);
        this.UpdateValues(opt);
    }

    /**
     * Gets the world transform
     * @param {mat4} m
     * @returns {mat4}
     */
    GetWorldTransform(m)
    {
        return mat4.copy(m, this._worldTransform);
    }

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
        return !!(this._geometryResource && this._geometryResource.IsGood());
    }

    /**
     * Per frame update
     * @param {mat4} parentTransform
     * @param {Array<Tw2Bone>} bones
     */
    UpdateViewDependentData(parentTransform, bones)
    {
        if (!this.display || !this.IsGood()) return;

        mat4.fromRotationTranslationScale(this.transform, this.rotation, this.position, this.scaling);

        this._bone = !bones || this.boneIndex === -1 ? null : bones[this.boneIndex] || null;
        if (this._bone)
        {
            mat4.multiply(this._worldTransform, this._bone.offsetTransform, this.transform);
            mat4.multiply(this._worldTransform, parentTransform, this._worldTransform);
            this._boundsDirty = true;
        }
        else
        {
            mat4.multiply(this._worldTransform, parentTransform, this.transform);
        }
    }

    /**
     * Per frame update
     * @param dt
     */
    Update(dt)
    {

    }

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator|Tw2BatchAccumulator2} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {boolean}
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (mode !== RM_ADDITIVE)
        {
            return false;
        }

        if (!this.display || !this.IsGood() || !this.effect || !this.effect.IsGood()) return false;

        mat4.transpose(this._perObjectData.vs.Get("WorldMat"), this._worldTransform);
        this._perObjectData.ps = perObjectData.ps;

        const batch = new Tw2GeometryBatch();
        batch.renderMode = mode;
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
        this._boundsDirty = true;
    }

    /**
     * Global scratch
     * @type {{mat4_0: mat4}}
     */
    static global = {
        mat4_0: mat4.create()
    };

    /**
     * Default banner effect settings
     * @type {Object}
     */
    static defaultBannerEffect = {
        effectFilePath: "cdn:/graphics/effect/managed/space/spaceobject/v5/fx/banner/unpacked_fxbannerv5.fx",
        parameters: {
            Color: [ 0, 0, 0, 1 ],
            Layer1Transform: [ 1.5, 1.5, 0, 0 ],
            Layer2Transform: [ 1, 0.5, 0, 0 ],
            LayerScroll: [ 10, 10, 1, -0.20000000298023224 ]
        },
        textures: {
            Layer1Map: "cdn:/texture/fx/hologram/hologram_noise.png",
            Layer2Map: "cdn:/texture/fx/hologram/hologram_pulse_brighter.png",
            MaskMap: "cdn:/texture/fx/logo/logomask_1px_border.png",
            BorderMap: "cdn:/texture/global/white.png",
            ImageMap: "cdn:/texture/global/black.png",
        }
    }

    /**
     * Per object data
     * @type {{vs: [[string,number]]}}
     */
    static perObjectData = {
        vs: [
            [ "WorldMat", 16 ]
        ],
    };

}
