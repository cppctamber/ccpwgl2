import { meta } from "utils";
import { vec3, mat4, quat, box3, sph3 } from "math";
import { Tw2PerObjectData } from "core";
import { EveObject } from "./EveObject";
import { LodLevelPixels } from "constant/ccpwgl";
import { device } from "global/tw2";


const Modifier = {
    NONE: 0,
    BILLBOARD: 1,
    TRANSLATE_WITH_CAMERA: 2,
    LOOK_AT_CAMERA: 3,
    SIMPLE_HALO: 4,
    EVE_CAMERA_ROTATION_ALIGNED: 100,
    EVE_BOOSTER: 101,
    EVE_SIMPLE_HALO: 102,
    EVE_CAMERA_ROTATION: 103
};



@meta.type("EveTransform")
export class EveTransform extends EveObject
{

    @meta.string
    name = "";

    @meta.list("EveObject")
    children = [];

    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.boolean
    display = true;

    @meta.notImplemented
    @meta.float
    distanceBasedScaleArg1 = 0.2;

    @meta.notImplemented
    @meta.float
    distanceBasedScaleArg2 = 0.63;

    @meta.notImplemented
    @meta.boolean
    hideOnLowQuality = false;

    @meta.struct([ "Tw2Mesh", "Tr2MeshLOD", "Tw2InstancedMesh" ])
    mesh = null;

    @meta.uint
    @meta.enums(Modifier)
    modifier = Modifier.NONE;

    @meta.list("Tr2ObserverLocal")
    observers = [];

    @meta.vector3
    overrideBoundsMax = vec3.create();

    @meta.vector3
    overrideBoundsMin = vec3.create();

    @meta.list("EveParticleEmitter")
    particleEmitters = [];

    @meta.list("EveParticleSystem")
    particleSystems = [];

    @meta.notImplemented
    @meta.float
    sortValueMultiplier = 1.0;

    @meta.boolean
    update = false;

    @meta.notImplemented
    @meta.boolean
    useDistanceBasedScale = false;

    @meta.notImplemented
    @meta.boolean
    useLodLevel = false;

    @meta.notImplemented
    @meta.float
    visibilityThreshold = 0;

    @meta.plain
    visible = {
        mesh: true,
        children: true
    };

    _parentTransform = mat4.create();
    _perObjectData = Tw2PerObjectData.from(EveTransform.perObjectData);

    /**
     * Updates lod
     * @param {Tw2Frustum}frustum
     */
    UpdateLod(frustum)
    {
        this.RebuildBounds();

        const worldSphere = EveObject.global.sph3_0;
        if (this.GetWorldBoundingSphere(worldSphere))
        {
            if (frustum.IsSphereVisible(worldSphere, worldSphere[3]))
            {
                this._pixelSizeAcross = frustum.GetPixelSizeAcross(worldSphere, worldSphere[3]);

                if (this._pixelSizeAcross < LodLevelPixels.ZERO)
                {
                    this._lod = 0;
                }
                else if (this._pixelSizeAcross < LodLevelPixels.ONE)
                {
                    this._lod = 1;
                }
                else if (this._pixelSizeAcross < LodLevelPixels.TWO)
                {
                    this._lod = 2;
                }
                else
                {
                    this._lod = 3;
                }
            }
            else
            {
                this._pixelSizeAcross = 0;
                this._lod = 0;
            }
        }
        // What to do when no bounds?
        else
        {
            this._lod = 3;
        }
    }

    /**
     * Fires when bounds need to be rebuilt
     */
    OnRebuildBounds()
    {
        // How to tell when to use?
        if (!box3.bounds.isEmpty(this.overrideBoundsMin, this.overrideBoundsMax))
        {
            box3.fromBounds(this._boundingBox, this.overrideBoundsMin, this.overrideBoundsMax);
            sph3.fromBox3(this._boundingSphere, this._boundingBox);
            this._boundsDirty = false;
            return;
        }
        // Children
        const { box3_0, sph3_0 } = EveObject.global;

        const unionFromArrayItems = (array = []) =>
        {
            for (let i = 0; i < array.length; i++)
            {
                let bounds = false;
                if ("GetBoundingBox" in array[i])
                {
                    array[i].GetBoundingBox(box3_0);
                    bounds = true;

                }
                else if ("GetBoundingSphere" in array[i])
                {
                    array[i].GetBoundingSphere(sph3_0);
                    box3.fromSph3(box3_0, sph3_0);
                    bounds = true;
                }

                if (bounds)
                {
                    box3.union(this._boundingBox, this._boundingBox, box3_0);
                }
            }
        };

        unionFromArrayItems(this.children);
        unionFromArrayItems(this.particleSystems);
        unionFromArrayItems(this.particleEmitters);

        sph3.fromBox3(this._boundingSphere, this._boundingBox);
        this._boundsDirty = false;
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.mesh) this.mesh.GetResources(out);

        for (let i = 0; i < this.children.length; i++)
        {
            this.children[i].GetResources(out);
        }

        return out;
    }

    /**
     * Per frame update
     * @param {mat4} parentTransform
     */
    UpdateViewDependentData(parentTransform=mat4.create())
    {
        mat4.copy(this._parentTransform, parentTransform);
        this.RebuildTransforms({ force: true, skipUpdate: true });

        for (let i = 0; i < this.children.length; ++i)
        {
            this.children[i].UpdateViewDependentData(this._worldTransform);
        }
    }

    /**
     * Per frame update
     * @param {Number} dt - delta time
     */
    Update(dt)
    {
        //if (this.useLodLevel && this._lod < this.visibilityThreshold) return;

        for (let i = 0; i < this.children.length; ++i)
        {
            this.children[i].Update(dt);
            if (this.children[i]._boundsDirty) this._boundsDirty = true;
        }

        for (let i = 0; i < this.particleEmitters.length; ++i)
        {
            this.particleEmitters[i].Update(dt);
            if (this.particleEmitters[i]._boundsDirty) this._boundsDirty = true;
        }

        for (let i = 0; i < this.particleSystems.length; ++i)
        {
            this.particleSystems[i].Update(dt);
            if (this.particleSystems[i]._boundsDirty) this._boundsDirty = true;
        }

        for (let i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Update(dt);
        }
    }

    /**
     * Gets render batches for accumulation
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} [perObjectData]
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display) return false;

        const c = accumulator.length;

        //if (this.useLodLevel && this._lod < this.visibilityThreshold) return;

        if (this.visible.mesh && this.mesh)
        {
            mat4.transpose(this._perObjectData.ffe.Get("World"), this._worldTransform);
            mat4.invert(this._perObjectData.ffe.Get("WorldInverseTranspose"), this._worldTransform);

            if (perObjectData)
            {
                this._perObjectData.vs = perObjectData.vs;
                this._perObjectData.ps = perObjectData.ps;
            }

            this.mesh.GetBatches(mode, accumulator, this._perObjectData);
        }

        if (this.visible.children)
        {
            for (let i = 0; i < this.children.length; ++i)
            {
                this.children[i].GetBatches(mode, accumulator, perObjectData);
            }
        }

        return accumulator.length !== c;
    }

    /**
     * Rebuilds the object's transform
     * @param opt
     * @return {boolean}
     */
    RebuildTransforms(opt)
    {
        let skipUpdate = opt && opt.skipUpdate;

        mat4.fromRotationTranslationScale(this._localTransform, this.rotation, this.translation, this.scaling);
        this._rebuildLocal = false;

        const
            d = device,
            finalScale = vec3.create(),
            parentScale = vec3.create(),
            dir = vec3.create(),
            viewInv = d.viewInverse;

        mat4.getScaling(parentScale, this._parentTransform);

        switch (this.modifier)
        {
            case EveTransform.Modifier.BILLBOARD:
            case EveTransform.Modifier.SIMPLE_HALO:
                const dirNorm = vec3.create();
                mat4.multiply(this._worldTransform, this._parentTransform, this._localTransform);
                vec3.multiply(finalScale, this.scaling, parentScale);

                if (this.modifier === EveTransform.Modifier.SIMPLE_HALO)
                {
                    vec3.subtract(dir, d.GetEyePosition(dir), this._worldTransform.subarray(12));
                    vec3.normalize(dirNorm, this._worldTransform.subarray(8));
                    vec3.normalize(dir, dir);
                    let scale = vec3.dot(dir, dirNorm);
                    if (scale < 0) scale = 0;
                    vec3.scale(finalScale, finalScale, scale * scale);
                }

                this._worldTransform[0] = viewInv[0] * finalScale[0];
                this._worldTransform[1] = viewInv[1] * finalScale[0];
                this._worldTransform[2] = viewInv[2] * finalScale[0];
                this._worldTransform[4] = viewInv[4] * finalScale[1];
                this._worldTransform[5] = viewInv[5] * finalScale[1];
                this._worldTransform[6] = viewInv[6] * finalScale[1];
                this._worldTransform[8] = viewInv[8] * finalScale[2];
                this._worldTransform[9] = viewInv[9] * finalScale[2];
                this._worldTransform[10] = viewInv[10] * finalScale[2];
                break;

            case EveTransform.Modifier.EVE_CAMERA_ROTATION:
                const translation = vec3.create();
                vec3.transformMat4(translation, this.translation, this._parentTransform);
                mat4.fromRotationTranslationScale(this._localTransform, this.rotation, translation, this.scaling);
                mat4.multiply(this._worldTransform, viewInv, this._localTransform);
                this._worldTransform[12] = this._localTransform[12];
                this._worldTransform[13] = this._localTransform[13];
                this._worldTransform[14] = this._localTransform[14];
                break;

            case EveTransform.Modifier.EVE_CAMERA_ROTATION_ALIGNED:
            case EveTransform.Modifier.EVE_SIMPLE_HALO:

                const
                    camFwd = vec3.create(),
                    right = vec3.create(),
                    up = vec3.create(),
                    forward = vec3.create(),
                    dirToCamNorm = vec3.create(),
                    parentT = mat4.create(),
                    alignMat = mat4.create(),
                    rotationT = mat4.create();

                // 3 4 3 3 3 4 3 3
                mat4.translate(this._worldTransform, this._parentTransform, this.translation);
                mat4.transpose(parentT, this._parentTransform);

                d.GetEyePosition(dir);
                dir[0] -= this._worldTransform[12];
                dir[1] -= this._worldTransform[13];
                dir[2] -= this._worldTransform[14];

                vec3.copy(camFwd, dir);
                vec3.transformMat4(camFwd, camFwd, parentT);
                vec3.divide(camFwd, camFwd, parentScale);
                vec3.normalize(camFwd, camFwd);

                vec3.set(right, d.view[0], d.view[4], d.view[8]);
                vec3.transformMat4(right, right, parentT);
                vec3.normalize(right, right);

                vec3.cross(up, camFwd, right);
                vec3.normalize(up, up);
                vec3.cross(right, up, camFwd);

                alignMat[0] = right[0];
                alignMat[1] = right[1];
                alignMat[2] = right[2];
                alignMat[4] = up[0];
                alignMat[5] = up[1];
                alignMat[6] = up[2];
                alignMat[8] = camFwd[0];
                alignMat[9] = camFwd[1];
                alignMat[10] = camFwd[2];
                alignMat[15] = 1;

                mat4.fromQuat(rotationT, this.rotation);
                mat4.multiply(alignMat, alignMat, rotationT);

                if (this.modifier === EveTransform.Modifier.EVE_SIMPLE_HALO)
                {
                    vec3.normalize(forward, this._worldTransform.subarray(8));
                    vec3.normalize(dirToCamNorm, dir);
                    let scale = -vec3.dot(dirToCamNorm, forward);
                    if (scale < 0) scale = 0;
                    mat4.multiply(this._worldTransform, this._worldTransform, alignMat);
                    mat4.scale(this._worldTransform, this._worldTransform, [ this.scaling[0] * scale, this.scaling[1] * scale, this.scaling[2] * scale ]);
                }
                else
                {
                    mat4.scale(this._worldTransform, this._worldTransform, this.scaling);
                    mat4.multiply(this._worldTransform, this._worldTransform, alignMat);
                }
                break;

            case EveTransform.Modifier.LOOK_AT_CAMERA:
                const lookAt = mat4.create();
                mat4.multiply(this._worldTransform, this._parentTransform, this._localTransform);
                mat4.lookAt(lookAt, viewInv.subarray(12), this._worldTransform.subarray(12), [ 0, 1, 0 ]);
                mat4.transpose(lookAt, lookAt);
                vec3.multiply(finalScale, this.scaling, parentScale);
                this._worldTransform[0] = lookAt[0] * finalScale[0];
                this._worldTransform[1] = lookAt[1] * finalScale[0];
                this._worldTransform[2] = lookAt[2] * finalScale[0];
                this._worldTransform[4] = lookAt[4] * finalScale[1];
                this._worldTransform[5] = lookAt[5] * finalScale[1];
                this._worldTransform[6] = lookAt[6] * finalScale[1];
                this._worldTransform[8] = lookAt[8] * finalScale[2];
                this._worldTransform[9] = lookAt[9] * finalScale[2];
                this._worldTransform[10] = lookAt[10] * finalScale[2];
                break;

            default:
                mat4.multiply(this._worldTransform, this._parentTransform, this._localTransform);
        }

        if (this._worldInverse)
        {
            mat4.invert(this._worldInverse, this._worldTransform);
        }

        if (this._worldTranspose)
        {
            mat4.transpose(this._worldTranspose, this._worldTransform);
        }

        if (this._worldInverseTranspose)
        {
            if (this._worldTranspose)
            {
                mat4.invert(this._worldInverseTranspose, this._worldTranspose);
            }
            else
            {
                mat4.invert(this._worldInverseTranspose, this._worldTransform);
                mat4.transpose(this._worldInverseTranspose, this._worldInverseTranspose);
            }
        }

        if (this["_onWorldTransformModified"])
        {
            this["_onWorldTransformModified"](this._worldTransform);
        }

        if (this["OnWorldTransformModified"])
        {
            this["OnWorldTransformModified"](this._worldTransform);
        }

        if (!skipUpdate)
        {
            this.UpdateValues({ skipTransforms: true });
        }

        this._rebuildWorld = false;
        return true;
    }

    /*

        let
    _camFwd,
    _right,
    _up,
    _forward,
    _dirToCamNorm,
    _alignMat,
    _rotationT;

    RebuildTransforms(opt)
    {
        let force = opt && opt.force,
            skipUpdate = opt && opt.skipUpdate;

        if (force || this._rebuildLocal)
        {
            mat4.fromRotationTranslationScale(this._localTransform, this.rotation, this.translation, this.scaling);
            this._rebuildLocal = false;
            force = true;
        }

        if (!force && !this._rebuildWorld)
        {
            return false;
        }

        let finalScale, dir;

        switch (this.modifier)
        {
            case Modifier.EVE_CAMERA_ROTATION:
                const translation = vec3.copy(vec3_0, this.translation);
                if (this._parentTransform) vec3.transformMat4(translation, translation, this._parentTransform);
                mat4.fromRotationTranslationScale(this._localTransform, this.rotation, translation, this.scaling);
                mat4.multiply(this._worldTransform, device.viewInverse , this._localTransform);
                this._worldTransform[12] = this._localTransform[12];
                this._worldTransform[13] = this._localTransform[13];
                this._worldTransform[14] = this._localTransform[14];
                break;

            case Modifier.LOOK_AT_CAMERA:
                finalScale = vec3_0;
                const lookAt = mat4_0;

                if (this._parentTransform)
                {
                    mat4.multiply(this._worldTransform, this._parentTransform, this._localTransform);
                    mat4.getScaling(finalScale, this._parentTransform);
                    vec3.multiply(finalScale, this.scaling, finalScale);
                }
                else
                {
                    mat4.copy(this._worldTransform, this._localTransform);
                    vec3.copy(finalScale, this.scaling);
                }

                mat4.lookAt(lookAt, device.viewInverse.subarray(12), this._worldTransform.subarray(12), [ 0, 1, 0 ]);
                mat4.transpose(lookAt, lookAt);
                this._worldTransform[0] = lookAt[0] * finalScale[0];
                this._worldTransform[1] = lookAt[1] * finalScale[0];
                this._worldTransform[2] = lookAt[2] * finalScale[0];
                this._worldTransform[4] = lookAt[4] * finalScale[1];
                this._worldTransform[5] = lookAt[5] * finalScale[1];
                this._worldTransform[6] = lookAt[6] * finalScale[1];
                this._worldTransform[8] = lookAt[8] * finalScale[2];
                this._worldTransform[9] = lookAt[9] * finalScale[2];
                this._worldTransform[10] = lookAt[10] * finalScale[2];
                break;

            case Modifier.BILLBOARD:
            case Modifier.SIMPLE_HALO:

                finalScale = vec3_0;
                dir = vec3_1;

                const dirNorm = vec3_2;

                if (this._parentTransform)
                {
                    mat4.multiply(this._worldTransform, this._parentTransform, this._localTransform);
                    mat4.getScaling(finalScale, this._parentTransform);
                    vec3.multiply(finalScale, this.scaling, finalScale);
                }
                else
                {
                    mat4.copy(this._worldTransform, this._localTransform);
                    vec3.copy(finalScale, this.scaling);
                }

                if (this.modifier === Modifier.SIMPLE_HALO)
                {
                    device.GetEyePosition(dir);
                    vec3.subtract(dir, dir, this._worldTransform.subarray(12));
                    vec3.normalize(dirNorm, this._worldTransform.subarray(8));
                    vec3.normalize(dir, dir);
                    let scale = vec3.dot(dir, dirNorm);
                    if (scale < 0) scale = 0;
                    vec3.scale(finalScale, finalScale, scale * scale);
                }

                this._worldTransform[0] = device.viewInverse[0] * finalScale[0];
                this._worldTransform[1] = device.viewInverse[1] * finalScale[0];
                this._worldTransform[2] = device.viewInverse[2] * finalScale[0];
                this._worldTransform[4] = device.viewInverse[4] * finalScale[1];
                this._worldTransform[5] = device.viewInverse[5] * finalScale[1];
                this._worldTransform[6] = device.viewInverse[6] * finalScale[1];
                this._worldTransform[8] = device.viewInverse[8] * finalScale[2];
                this._worldTransform[9] = device.viewInverse[9] * finalScale[2];
                this._worldTransform[10] = device.viewInverse[10] * finalScale[2];
                break;

            case Modifier.EVE_CAMERA_ROTATION_ALIGNED:
            case Modifier.EVE_SIMPLE_HALO:

                dir = vec3_1;

                const
                    parentTranspose = mat4_0,
                    parentScale = vec3_0;

                if (!_camFwd)
                {
                    _camFwd = vec3.create();
                    _right = vec3.create();
                    _up = vec3.create();
                    _forward = vec3.create();
                    _dirToCamNorm = vec3.create();
                    _alignMat = mat4.create();
                    _rotationT = mat4.create();
                }

                // 3 4 3 3 3 4 3 3
                if (this._parentTransform)
                {
                    mat4.translate(this._worldTransform, this._parentTransform, this.translation);
                    mat4.transpose(parentTranspose, this._parentTransform);
                    mat4.getScaling(parentScale, this._parentTransform);
                }
                else
                {
                    mat4.identity(this._worldTransform);
                    this._worldTransform[12] = this.translation[0];
                    this._worldTransform[13] = this.translation[1];
                    this._worldTransform[14] = this.translation[2];
                    mat4.identity(parentTranspose);
                    mat4.transpose(parentTranspose, parentTranspose);
                    vec3.set(parentScale, 1, 1, 1);
                }

                device.GetEyePosition(dir);
                dir[0] -= this._worldTransform[12];
                dir[1] -= this._worldTransform[13];
                dir[2] -= this._worldTransform[14];

                vec3.copy(_camFwd, dir);
                vec3.transformMat4(_camFwd, _camFwd, parentTranspose);
                vec3.divide(_camFwd, _camFwd, parentScale);
                vec3.normalize(_camFwd, _camFwd);

                vec3.set(_right, device.view[0], device.view[4], device.view[8]);
                vec3.transformMat4(_right, _right, parentTranspose);
                vec3.normalize(_right, _right);

                vec3.cross(_up, _camFwd, _right);
                vec3.normalize(_up, _up);
                vec3.cross(_right, _up, _camFwd);

                _alignMat[0] = _right[0];
                _alignMat[1] = _right[1];
                _alignMat[2] = _right[2];
                _alignMat[4] = _up[0];
                _alignMat[5] = _up[1];
                _alignMat[6] = _up[2];
                _alignMat[8] = _camFwd[0];
                _alignMat[9] = _camFwd[1];
                _alignMat[10] = _camFwd[2];
                _alignMat[15] = 1;

                mat4.fromQuat(_rotationT, this.rotation);
                mat4.multiply(_alignMat, _alignMat, _rotationT);

                if (this.modifier === Modifier.EVE_SIMPLE_HALO)
                {
                    vec3.normalize(_forward, this._worldTransform.subarray(8));
                    vec3.normalize(_dirToCamNorm, dir);
                    let scale = -vec3.dot(_dirToCamNorm, _forward);
                    if (scale < 0) scale = 0;
                    mat4.multiply(this._worldTransform, this._worldTransform, _alignMat);
                    mat4.scale(this._worldTransform, this._worldTransform, [
                        this.scaling[0] * scale,
                        this.scaling[1] * scale,
                        this.scaling[2] * scale
                    ]);
                }
                else
                {
                    mat4.scale(this._worldTransform, this._worldTransform, this.scaling);
                    mat4.multiply(this._worldTransform, this._worldTransform, _alignMat);
                }
                break;

            //case Modifier.NONE:
            default:
                if (this._parentTransform)
                {
                    mat4.multiply(this._worldTransform, this._parentTransform, this._localTransform);
                }
                else
                {
                    mat4.copy(this._worldTransform, this._localTransform);
                }
        }

        if (this._worldInverse)
        {
            mat4.invert(this._worldInverse, this._worldTransform);
        }

        if (this._worldTranspose)
        {
            mat4.transpose(this._worldTranspose, this._worldTransform);
        }

        if (this._worldInverseTranspose)
        {
            if (this._worldTranspose)
            {
                mat4.invert(this._worldInverseTranspose, this._worldTranspose);
            }
            else
            {
                mat4.invert(this._worldInverseTranspose, this._worldTransform);
                mat4.transpose(this._worldInverseTranspose, this._worldInverseTranspose);
            }
        }

        if (this["_onWorldTransformModified"])
        {
            this["_onWorldTransformModified"](this._worldTransform);
        }

        if (this["OnWorldTransformModified"])
        {
            this["OnWorldTransformModified"](this._worldTransform);
        }

        if (!skipUpdate)
        {
            this.UpdateValues({ skipTransforms: true });
        }

        this._rebuildWorld = false;
        return true;
    }

    /**
     * multiply3x3
     */
    static Multiply3x3(a, b, c)
    {
        c || (c = b);
        let d = b[0],
            e = b[1];
        b = b[2];
        c[0] = a[0] * d + a[4] * e + a[8] * b;
        c[1] = a[1] * d + a[5] * e + a[9] * b;
        c[2] = a[2] * d + a[6] * e + a[10] * b;
        return c;
    }

    /**
     * Per object data
     * @type {*}
     */
    static perObjectData = {
        ffe: [
            [ "World", 16 ],
            [ "WorldInverseTranspose", 16 ]
        ]
    };

    /**
     * World transform modifier
     * @type {*}
     */
    static Modifier = Modifier;

}
