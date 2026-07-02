import { meta } from "utils";
import { vec3, quat, mat4 } from "math";
import { GLESPerObjectDataEveSpaceObject, Tw2PerObjectData } from "core";
import { EveChild } from "./EveChild";


@meta.type("EveChildMesh", true)
@meta.define({
    wgl: "EveChildMesh",
    ccp: true
})
export class EveChildMesh extends EveChild
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.boolean
    castShadow = false;

    @meta.list()
    lights = [];

    @meta.matrix4
    localTransform = mat4.create();

    @meta.notImplemented
    @meta.uint
    lowestLodVisible = 2;

    @meta.struct([ "Tw2Mesh", "Tw2InstancedMesh" ])
    mesh = null;

    @meta.notImplemented
    @meta.float
    minScreenSize = 0;

    @meta.notImplemented
    @meta.uint
    reflectionType = 0;

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.notImplemented
    @meta.float
    sortValueOffset = 0;

    @meta.notImplemented
    @meta.boolean
    staticTransform = false;

    @meta.notImplemented
    @meta.list("EveChildModifier")
    transformModifiers = [];

    @meta.vector3
    translation = vec3.create();

    @meta.notImplemented
    @meta.boolean
    updateAnimation = true;

    @meta.boolean
    useSRT = true;

    @meta.boolean
    useSpaceObjectData = true;

    @meta.uint
    @meta.notImplemented
    reflectionMode = 3;

    _hasBone = false;
    _boneTransform = null;
    _worldTransform = mat4.create();
    _worldTransformLast = mat4.create();
    _perObjectData = null;
    _perObjectDataBagOfStuff = {};


    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.mesh) this.mesh.GetResources(out);
        return out;
    }


    /**
     * Per frame update
     * @param {number} dt
     * @param {mat4} parentTransform
     * @param {Tw2PerObjectData|} perObjectData
     */
    Update(dt, parentTransform, perObjectData)
    {
        mat4.copy(this._worldTransformLast, this._worldTransform);

        if (this.useSRT)
        {
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        }

        // The object or a modifier can set a bone
        this._hasBone = false;

        // Get bone transform
        // This may be unnecessary if there is a bone modifier
        if (this.boneIndex > -1)
        {
            const
                bones = EveChild.GetJointMatrices(perObjectData),
                offset = this.boneIndex;

            if (bones && (bones[offset] || bones[offset + 4] || bones[offset + 8]))
            {
                if (!this._boneTransform) this._boneTransform = mat4.create();
                mat4.fromJointMatIndex(this._boneTransform, bones, offset);
                this._hasBone = true;
            }
        }

        // TODO: Figure out how this should work
        let updatedWorld = false;
        if (this.transformModifiers.length)
        {
            for (let i = 0; i < this.transformModifiers.length; i++)
            {
                if ("ApplyTransform" in this.transformModifiers[i])
                {
                    this.transformModifiers[i].ApplyTransform(this.localTransform);
                }
                else if ("Modify" in this.transformModifiers[i])
                {
                    if (this.transformModifiers[i].Modify(this, perObjectData, parentTransform))
                    {
                        updatedWorld = true;
                    }
                }
            }
        }

        if (!this._hasBone) this._boneTransform = null;

        if (!updatedWorld)
        {
            if (this._hasBone)
            {
                mat4.multiply(this._worldTransform, this._boneTransform, this.localTransform);
                mat4.multiply(this._worldTransform, parentTransform, this._worldTransform);
            }
            else
            {
                mat4.multiply(this._worldTransform, parentTransform, this.localTransform);
            }
        }
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display || !this.mesh || this._lod < this.lowestLodVisible) return false;
        perObjectData = perObjectData || accumulator.GetCurrentPerObjectData?.();
        if (!perObjectData) return false;

        if (this.useSpaceObjectData)
        {
            if (!this._perObjectData)
            {
                this._perObjectData = new GLESPerObjectDataEveSpaceObject();
            }

            GLESPerObjectDataEveSpaceObject.Pack(
                this.GetPerObjectDataBagOfStuff(perObjectData, this._perObjectDataBagOfStuff),
                this._perObjectData
            );
        }
        else
        {
            if (!this._perObjectData)
            {
                this._perObjectData = Tw2PerObjectData.from(EveChild.perObjectData);
            }

            mat4.transpose(this._perObjectData.ffe.Get("world"), this._worldTransform);
            mat4.invert(this._perObjectData.ffe.Get("worldInverseTranspose"), this._worldTransform);
        }

        return this.mesh.GetBatches(mode, accumulator, this._perObjectData);
    }

    /**
     * Gets the child mesh's temporary semantic-ish per-object values.
     * Parent values are read as references and then this child overrides its own transforms.
     * @param {Tw2PerObjectData} perObjectData
     * @param {Object} [out]
     * @returns {Object}
     */
    GetPerObjectDataBagOfStuff(perObjectData, out = {})
    {
        GLESPerObjectDataEveSpaceObject.Unpack(perObjectData, out);

        if (out.boundingSphereRadius === undefined && out.boundingSphereRadiusSq !== undefined)
        {
            out.boundingSphereRadius = Math.sqrt(Math.abs(out.boundingSphereRadiusSq));
        }

        if (!out.boundingSphereCenter && out.clipSphereCenter)
        {
            out.boundingSphereCenter = out.clipSphereCenter;
        }

        delete out.shipData;
        delete out.clipData;
        delete out.clipData1;
        delete out.boundingSphereRadiusSq;
        delete out.clipSphereCenter;
        delete out.clipSphereSignedRadiusSq;

        out.source = this;
        out.parentPerObjectData = perObjectData;
        out.perObjectData = this._perObjectData;
        out.legacyPerObjectData = this._perObjectData;
        out.worldTransform = this._worldTransform;
        out.worldTransformLast = this._worldTransformLast;
        out.inverseWorldTransform = null;
        out.inverseWorldTransformTranspose = null;

        return out;
    }

}
