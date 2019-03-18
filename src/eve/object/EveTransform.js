import {vec3, quat, mat4, device, Tw2BaseClass} from "../../global";
import {Tw2PerObjectData} from "../../core";
import {EveObject} from "./legacy/EveObject";

/**
 * EveTransform
 * TODO: Implement "distanceBasedScaleArg1"
 * TODO: Implement "distanceBasedScaleArg2"
 * TODO: Implement "overrideBoundsMax"
 * TODO: Implement "overrideBoundsMin"
 * TODO: Implement "sortValueMultiplier"
 * TODO: Implement "useDistanceBasedScale"
 * TODO: Implement "useLodLevel"
 * TODO: Implement "visibilityThreshold"
 * @ccp EveTransform
 *
 * @property {Array.<EveObject>} children                                  -
 * @property {Array.<TriCurveSet>} curveSets                               -
 * @property {Boolean} display                                             -
 * @property {Number} distanceBasedScaleArg1                               -
 * @property {Number} distanceBasedScaleArg2                               -
 * @property {Boolean} hideOnLowQuality                                    -
 * @property {Mesh|Tr2MeshLod} mesh                                        -
 * @property {Number} modifier                                             -
 * @property {Array.<TriObserverLocal>} observers                          -
 * @property {vec3} overrideBoundsMax                                      -
 * @property {vec3} overrideBoundsMin                                      -
 * @property {Array.<ParticleEmitter|ParticleEmitterGPU>} particleEmitters -
 * @property {Array.<ParticleSystem>} particleSystems                      -
 * @property {quat} rotation                                               -
 * @property {vec3} scaling                                                -
 * @property {Number} sortValueMultiplier                                  -
 * @property {vec3} translation                                            -
 * @property {Boolean} update                                              -
 * @property {Boolean} useDistanceBasedScale                               -
 * @property {Boolean} useLodLevel                                         -
 * @property {Number} visibilityThreshold                                  -
 * @property {Object} visible                                              -
 * @property {mat4} localTransform                                         -
 * @property {mat4} worldTransform                                         -
 * @property {Tw2PerObjectData} _perObjectData                             -
 */
export class EveTransform extends EveObject
{
    // ccp
    children = [];
    curveSets = [];
    display = true;
    distanceBasedScaleArg1 = 0.2;
    distanceBasedScaleArg2 = 0.63;
    hideOnLowQuality = false;
    mesh = null;
    modifier = EveTransform.Modifier.NONE;
    observers = [];
    overrideBoundsMax = vec3.create();
    overrideBoundsMin = vec3.create();
    particleEmitters = [];
    particleSystems = [];
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    sortValueMultiplier = 1.0;
    translation = vec3.create();
    update = false;
    useDistanceBasedScale = false;
    useLodLevel = false;
    visibilityThreshold = 0;

    //ccpwgl
    visible = {
        mesh: true,
        children: true
    };

    localTransform = mat4.create();
    worldTransform = mat4.create();
    _perObjectData = Tw2PerObjectData.from(EveTransform.perObjectData);

    /**
     * Initializes the EveTransform
     */
    Initialize()
    {
        mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
    }

    /**
     * Gets transform res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @param {Boolean} [excludeChildren] - True to exclude children's res objects
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [], excludeChildren)
    {
        if (this.mesh)
        {
            this.mesh.GetResources(out);
        }

        if (!excludeChildren)
        {
            for (let i = 0; i < this.children.length; i++)
            {
                this.children[i].GetResources(out);
            }
        }

        return out;
    }

    /**
     * Per frame update
     * @param {mat4} parentTransform
     */
    UpdateViewDependentData(parentTransform)
    {
        const
            d = device,
            g = EveObject.global,
            finalScale = g.vec3_0,
            parentScale = g.vec3_1,
            dir = g.vec3_2,
            viewInv = d.viewInverse;

        quat.normalize(this.rotation, this.rotation);
        mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        mat4.getScaling(parentScale, parentTransform);

        switch (this.modifier)
        {
            case EveTransform.Modifier.BILLBOARD:
            case EveTransform.Modifier.SIMPLE_HALO:
                const dirNorm = g.vec3_3;
                mat4.multiply(this.worldTransform, parentTransform, this.localTransform);
                vec3.multiply(finalScale, this.scaling, parentScale);

                if (this.modifier === EveTransform.Modifier.SIMPLE_HALO)
                {
                    vec3.subtract(dir, d.GetEyePosition(dir), this.worldTransform.subarray(12));
                    vec3.normalize(dirNorm, this.worldTransform.subarray(8));
                    vec3.normalize(dir, dir);
                    let scale = vec3.dot(dir, dirNorm);
                    if (scale < 0) scale = 0;
                    vec3.scale(finalScale, finalScale, scale * scale);
                }

                this.worldTransform[0] = viewInv[0] * finalScale[0];
                this.worldTransform[1] = viewInv[1] * finalScale[0];
                this.worldTransform[2] = viewInv[2] * finalScale[0];
                this.worldTransform[4] = viewInv[4] * finalScale[1];
                this.worldTransform[5] = viewInv[5] * finalScale[1];
                this.worldTransform[6] = viewInv[6] * finalScale[1];
                this.worldTransform[8] = viewInv[8] * finalScale[2];
                this.worldTransform[9] = viewInv[9] * finalScale[2];
                this.worldTransform[10] = viewInv[10] * finalScale[2];
                break;

            case EveTransform.Modifier.EVE_CAMERA_ROTATION:
                const translation = g.vec3_3;
                vec3.transformMat4(translation, this.translation, parentTransform);
                mat4.fromRotationTranslationScale(this.localTransform, this.rotation, translation, this.scaling);
                mat4.multiply(this.worldTransform, viewInv, this.localTransform);
                this.worldTransform[12] = this.localTransform[12];
                this.worldTransform[13] = this.localTransform[13];
                this.worldTransform[14] = this.localTransform[14];
                break;

            case EveTransform.Modifier.EVE_CAMERA_ROTATION_ALIGNED:
            case EveTransform.Modifier.EVE_SIMPLE_HALO:
                const
                    camFwd = g.vec3_3,
                    right = g.vec3_4,
                    up = g.vec3_5,
                    forward = g.vec3_6,
                    dirToCamNorm = g.vec3_7,
                    parentT = g.mat4_0,
                    alignMat = g.mat4_1,
                    rotationT = g.mat4_2;

                // 3 4 3 3 3 4 3 3
                mat4.translate(this.worldTransform, parentTransform, this.translation);
                mat4.transpose(parentT, parentTransform);

                d.GetEyePosition(dir);
                dir[0] -= this.worldTransform[12];
                dir[1] -= this.worldTransform[13];
                dir[2] -= this.worldTransform[14];

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
                    vec3.normalize(forward, this.worldTransform.subarray(8));
                    vec3.normalize(dirToCamNorm, dir);
                    let scale = -vec3.dot(dirToCamNorm, forward);
                    if (scale < 0) scale = 0;
                    mat4.multiply(this.worldTransform, this.worldTransform, alignMat);
                    mat4.scale(this.worldTransform, this.worldTransform, [this.scaling[0] * scale, this.scaling[1] * scale, this.scaling[2] * scale]);
                }
                else
                {
                    mat4.scale(this.worldTransform, this.worldTransform, this.scaling);
                    mat4.multiply(this.worldTransform, this.worldTransform, alignMat);
                }
                break;

            case EveTransform.Modifier.LOOK_AT_CAMERA:
                const lookAt = g.mat4_0;
                mat4.multiply(this.worldTransform, parentTransform, this.localTransform);
                mat4.lookAt(lookAt, viewInv.subarray(12), this.worldTransform.subarray(12), [0, 1, 0]);
                mat4.transpose(lookAt, lookAt);
                vec3.multiply(finalScale, this.scaling, parentScale);
                this.worldTransform[0] = lookAt[0] * finalScale[0];
                this.worldTransform[1] = lookAt[1] * finalScale[0];
                this.worldTransform[2] = lookAt[2] * finalScale[0];
                this.worldTransform[4] = lookAt[4] * finalScale[1];
                this.worldTransform[5] = lookAt[5] * finalScale[1];
                this.worldTransform[6] = lookAt[6] * finalScale[1];
                this.worldTransform[8] = lookAt[8] * finalScale[2];
                this.worldTransform[9] = lookAt[9] * finalScale[2];
                this.worldTransform[10] = lookAt[10] * finalScale[2];
                break;

            default:
                mat4.multiply(this.worldTransform, parentTransform, this.localTransform);
        }

        for (let i = 0; i < this.children.length; ++i)
        {
            this.children[i].UpdateViewDependentData(this.worldTransform);
        }
    }

    /**
     * Per frame update
     * @param {Number} dt - delta time
     */
    Update(dt)
    {
        for (let i = 0; i < this.children.length; ++i)
        {
            this.children[i].Update(dt);
        }

        for (let i = 0; i < this.particleEmitters.length; ++i)
        {
            this.particleEmitters[i].Update(dt);
        }

        for (let i = 0; i < this.particleSystems.length; ++i)
        {
            this.particleSystems[i].Update(dt);
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
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display) return;

        if (this.visible.mesh && this.mesh)
        {
            mat4.transpose(this._perObjectData.ffe.Get("World"), this.worldTransform);
            mat4.invert(this._perObjectData.ffe.Get("WorldInverseTranspose"), this.worldTransform);

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
            ["World", 16],
            ["WorldInverseTranspose", 16]
        ]
    };

    /**
     * Modifier states
     * @type {*}
     */
    static Modifier = {
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

}

Tw2BaseClass.define(EveTransform, Type =>
{
    return {
        isStaging: true,
        type: "EveTransform",
        category: "EveObject",
        props: {
            children: [["EveSpherePin", "EveTransform"]],
            curveSets: [["TriCurveSet"]],
            display: Type.BOOLEAN,
            distanceBasedScaleArg1: Type.NUMBER,
            distanceBasedScaleArg2: Type.NUMBER,
            hideOnLowQuality: Type.BOOLEAN,
            mesh: ["Tr2InstancedMesh", "Tr2Mesh", "Tr2MeshLod"],
            modifier: Type.NUMBER,
            observers: [["TriObserverLocal"]],
            overrideBoundsMax: Type.VECTOR3,
            overrideBoundsMin: Type.VECTOR3,
            particleEmitters: [["Tr2DynamicEmitter", "Tr2GpuUniqueEmitter", "Tr2StaticEmitter"]],
            particleSystems: [["Tr2ParticleSystem"]],
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            sortValueMultiplier: Type.NUMBER,
            translation: Type.TR_TRANSLATION,
            update: Type.BOOLEAN,
            useDistanceBasedScale: Type.BOOLEAN,
            useLodLevel: Type.BOOLEAN,
            visibilityThreshold: Type.NUMBER
        },
        notImplemented: [
            "distanceBasedScaleArg1",
            "distanceBasedScaleArg2",
            "overrideBoundsMax",
            "overrideBoundsMin",
            "sortValueMultiplier",
            "useDistanceBasedScale",
            "useLodLevel",
            "visibilityThreshold"
        ]
    };
});