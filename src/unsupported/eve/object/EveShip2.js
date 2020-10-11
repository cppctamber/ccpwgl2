import { meta, vec3, mat4, WrappedType } from "global";
import { EveObject } from "eve/object/EveObject";
import { Tw2PerObjectData } from "core/data";
import { Tw2AnimationController } from "core/model";

import { EveTurretSet, EvePlaneSet, EveSpriteSet, EveSpotlightSet, EveCurveLineSet } from "eve/item";
import { EveMeshOverlayEffect } from "eve/effect";


@meta.ctor("EveShip2")
export class EveShip2 extends EveObject
{

    @meta.struct("Tw2Animation")
    @meta.isPrivate
    animation = new Tw2AnimationController();

    @meta.list("EveObjectSet")
    attachments = [];

    @meta.struct("EveBoosterSet2")
    boosters = null;

    @meta.vector3
    boundingSphereCenter = vec3.create();

    @meta.float
    boundingSphereRadius = 0;

    @meta.list("EveObject")
    children = [];

    @meta.list("EveCustomMask")
    customMasks = [];

    @meta.list("EveSpaceObjectDecal")
    decals = [];

    @meta.string
    dna = "";

    @meta.list("EveLocatorSets")
    locatorSets = [];

    @meta.list("EveLocator2")
    locators = [];

    @meta.struct("Tw2Mesh", "Tw2InstancedMesh", "Tr2MeshLod")
    mesh = null;

    @meta.struct("EveCurve") // Tr2RotationAdapter
    rotationCurve = null;

    @meta.struct("Tw2Effect")
    shadowEffect = null;

    @meta.vector3
    shapeEllipsoidCenter = vec3.create();

    @meta.vector3
    shapeEllipsoidRadius = vec3.create();

    @meta.struct("EveCurve") // Tr2TranslationAdapter
    translationCurve = null;

    /*

        CCPWGL only

     */
    @meta.uint
    killCount = 0;

    @meta.float
    boosterGain = 1;

    @meta.plain
    visible = {
        mesh: true,
        children: true,
        //effectChildren: true,
        planeSets: true,
        spotlightSets: true,
        decals: true,
        spriteSets: true,
        overlayEffects: true,
        lineSets: true,
        killmarks: true,
        customMasks: true,
        turretSets: true,
        boosters: true
    };

    // Testing...
    _enableCurves = false;
    _pixelSizeAcross = 0;

    _lod = 3;
    _worldSpriteScale = 1;
    _localTransform = mat4.create();
    _worldTransform = mat4.create();
    _perObjectData = Tw2PerObjectData.from(EveShip2.perObjectData);

    /**
     * Initializes the ship
     */
    Initialize()
    {
        this.RebuildBoosterSet();
    }

    /**
     * Finds a turret set by it's locator
     * @param {String} locator
     * @returns {EveTurretSet}
     */
    FindTurretSetByLocatorName(locator)
    {
        for (let  i = 0; i < this.attachments.length; i++)
        {
            if (this.attachments[i] instanceof EveTurretSet && this.attachments[i].locatorName === locator)
            {
                return this.attachments[i];
            }
        }
    }

    /**
     * Finds all turret prefixes
     * @param {Array<String>} [out=[]] - Receiving array
     * @returns {Array<String>} out    - Receiving array
     */
    FindTurretPrefixes(out = [])
    {
        function add(match)
        {
            if (!match) return false;
            const name = match[0].substring(0, match[0].length - 1);
            if (!out.includes(name)) out.push(name);
            return true;
        }

        for (let i = 0; i < this.locators.length; i++)
        {
            const name = this.locators[i].name;
            if (!add((/^locator_turret_([0-9]+)[a-z]$/i).exec(name)))
            {
                add((/^locator_xl_([0-9]+)[a-z]$/i).exec(name));
            }
        }

        out.sort();
        return out;
    }

    /**
     * Gets locator count for a specific locator group
     * @param {String} prefix
     * @returns {number}
     */
    GetLocatorCount(prefix)
    {
        const locators = this.FindLocatorsByPrefix(prefix);
        return locators.length;
    }

    /**
     * Finds a locator's joint by name
     * @param {String} name
     * @returns {?mat4}
     */
    FindLocatorJointByName(name)
    {
        const locator = this.FindLocatorBoneByName(name);
        return locator ? locator.worldTransform : null;
    }

    /**
     * Finds a locator's transform by it's name
     * @param {String} name
     * @returns {?mat4}
     */
    FindLocatorTransformByName(name)
    {
        const locator = this.FindLocatorByName(name);
        return locator ? locator.transform : null;
    }

    /**
     * Checks if a locator prefix exists
     * @param {String} prefix
     * @returns {Boolean}
     */
    HasLocatorPrefix(prefix)
    {
        for (let i = 0; i < this.locators.length; i++)
        {
            if (this.locators[i].name.indexOf(prefix) === 0)
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Finds a locator's bone by it's name
     * @param {String} name
     * @returns {?Tw2Bone} null if not found
     */
    FindLocatorBoneByName(name)
    {
        return this.animation ? this.animation.FindBoneForMesh(name, 0) : null;
    }

    /**
     * Finds a locator by name
     * @param {String} name
     * @returns {?EveLocator2}
     */
    FindLocatorByName(name)
    {
        for (let i = 0; i < this.locators.length; i++)
        {
            if (this.locators[i].name === name)
            {
                return this.locators[i];
            }
        }
        return null;
    }

    /**
     * Finds locators with a given prefix
     * @param {String} prefix
     * @param {Array} [out=[]}
     * @returns {Array<EveLocator2>}
     */
    FindLocatorsByPrefix(prefix, out = [])
    {
        for (let i = 0; i < this.locators.length; i++)
        {
            if (this.locators[i].name.indexOf(prefix) === 0)
            {
                out.push(this.locators[i]);
            }
        }
        return out;
    }

    /**
     * Resets LOD
     */
    ResetLod()
    {
        this._lod = 3;
    }

    /**
     * Updates lod
     * @param {Tw2Frustum} frustum
     */
    UpdateLod(frustum)
    {
        const center = vec3.transformMat4(EveObject.global.vec3_0, this.boundingSphereCenter, this._worldTransform);

        if (frustum.IsSphereVisible(center, this.boundingSphereRadius))
        {
            this._pixelSizeAcross = frustum.GetPixelSizeAcross(center, this.boundingSphereRadius);

            if (this._pixelSizeAcross < 100)
            {
                this._lod = 1;
            }
            else
            {
                this._lod = 2;
            }
        }
        else
        {
            this._pixelSizeAcross = 0;
            this._lod = 0;
        }
    }

    /**
     * @param local
     */
    SetTransform(local)
    {
        mat4.copy(this._localTransform,  local);
    }

    /**
     * Gets the local transform
     * @param {mat4} out
     * @returns {mat4}
     */
    GetTransform(out)
    {
        return mat4.copy(out, this._localTransform);
    }

    /**
     *
     * @param {Array} [out=[]]
     * @returns {Array}
     */
    GetResources(out=[])
    {
        this.PerChild(x =>
        {
            if ("GetResources" in x.struct)
            {
                x.struct.GetResources(out);
            }
        });
        return out;
    }

    RebuildBoosterSet()
    {
        if (this.boosters)
        {
            this.boosters.UpdateItemsFromLocators(this.FindLocatorsByPrefix("locator_booster"));
            return true;
        }
        return false;
    }

    RebuildTurretSet(turretSet)
    {
        const
            prefix = turretSet.locatorName,
            count = this.GetLocatorCount(prefix),
            locators = [];

        for (let j = 0; j < count; ++j)
        {
            const
                name = prefix + String.fromCharCode("a".charCodeAt(0) + j),
                locator = this.FindLocatorByName(name);

            if (locator)
            {
                locator.FindBone(this.animation);
                locators.push(locator);
            }
        }

        turretSet.UpdateItemsFromLocators(locators);
        return true;
    }

    RebuildOverlays(overlays=[])
    {
        let updated = false;
        for (let i = 0; i < this.attachments.length; i++)
        {
            if (this.attachments[i] instanceof EveMeshOverlayEffect)
            {
                updated = true;
                this.attachments.splice(i, 1);
                i--;
            }
        }

        for (let i = 0; i < overlays.length; i++)
        {
            this.attachments.push(overlays[i]);
            updated = true;
        }

        return updated;
    }

    Update(dt)
    {
        if (this._lod < 1 || !this.display)
        {
            return;
        }

        if (this.boosters)
        {
            if (this.boosters._locatorDirty)
            {
                this.RebuildBoosterSet();
            }

            this.boosters.Update(dt, this._worldTransform);
        }

        for (let i = 0; i < this.attachments.length; i++)
        {
            // TODO: Normalize
            if (this.attachments[i] instanceof EveTurretSet && this.attachments[i]._locatorDirty)
            {
                this.RebuildTurretSet(this.attachments[i]);
            }

            this.attachments[i].Update(dt, this);
        }

        for  (let i = 0; i < this.children.length;  i++)
        {
            this.children[i].Update(dt);
        }

        /*
        // Where have these gone?
        for  (let i =  0;  i < this.effectChildren.length; i++)
        {
            this.effectChildren[i].Update(dt, this._worldTransform, this._lod);
        }
         */

        if (this.animation)
        {
            this.animation.Update(dt);
        }
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display || this._lod < 1) return;

        const
            show = this.visible,
            res = this.mesh && this.mesh.IsGood() ? this.mesh.geometryResource : null;

        if (show.mesh && res)
        {
            this.mesh.GetBatches(mode, accumulator, this._perObjectData);
        }

        let doFiringEffects = show.firingEffect;

        if (this._lod > 1)
        {
            if (show.boosters && this.boosters)
            {
                this._perObjectData.vs.Get("Shipdata")[0] = this.boosterGain;
                this._perObjectData.ps.Get("Shipdata")[0] = this.boosterGain;
                this.boosters.GetBatches(mode, accumulator, this._perObjectData);
            }

            // TODO: normalize GetBatches for all attachments
            for (let i = 0; i < this.attachments.length; i++)
            {
                const item = this.attachments[i];
                switch(item.constructor)
                {
                    case EveTurretSet:
                        if (show.turretSets)
                        {
                            doFiringEffects = false;
                            item.GetBatches(mode, accumulator, this._perObjectData, show.firingEffect);
                        }
                        break;

                    case EveSpotlightSet:
                        if (show.spotlightSets)
                        {
                            item.GetBatches(mode, accumulator, this._perObjectData, this._worldTransform);
                        }
                        break;

                    case EvePlaneSet:
                        if (show.planeSets)
                        {
                            item.GetBatches(mode, accumulator, this._perObjectData);
                        }
                        break;

                    case EveSpriteSet:
                        if (show.spriteSets)
                        {
                            item.GetBatches(mode, accumulator, this._perObjectData, this._worldTransform);
                        }
                        break;

                    case EveCurveLineSet:
                        if (show.lineSets)
                        {
                            item.GetBatches(mode, accumulator);
                        }
                        break;

                    case EveMeshOverlayEffect:
                        if (show.overlayEffects)
                        {
                            item.GetBatches(mode, accumulator, this._perObjectData, this.mesh);
                        }
                        break;

                    default:
                        console.log("Attachment not supported");
                        break;
                }
            }

            if (res)
            {
                if (show.decals)
                {
                    const killMarks = show.killmarks && this._lod > 2 ? this.killCount : 0;
                    for (let i = 0; i < this.decals.length; i++)
                    {
                        this.decals[i].GetBatches(mode, accumulator, this._perObjectData, res, killMarks);
                    }
                }
            }
        }

        if (doFiringEffects)
        {
            for (let i = 0; i < this.attachments.length; i++)
            {
                if (this.attachments[i] instanceof EveTurretSet)
                {
                    this.attachments[i].GetFiringEffectBatches(mode, accumulator, this._perObjectData);
                }
            }
        }

        if (show.children)
        {
            for (let i = 0; i < this.children.length; i++)
            {
                this.children[i].GetBatches(mode, accumulator, this._perObjectData);
            }
        }

        /* Where have these gone?
        if (show.effectChildren)
        {
            for (let i = 0; i < this.effectChildren.length; i++)
            {
                this.effectChildren[i].GetBatches(mode, accumulator, this._perObjectData);
            }
        }
         */

    }

    /**
     *
     * @param {mat4} parentTransform
     * @param {Number} dt
     * @param {Number} worldSpriteScale
     */
    UpdateViewDependentData(parentTransform,  dt, worldSpriteScale)
    {
        mat4.transpose(this._perObjectData.vs.Get("WorldMatLast"), this._worldTransform);

        if (this._enableCurves && this.rotationCurve || this.translationCurve)
        {
            const
                rotation = EveObject.global.quat_0,
                translation = EveObject.global.vec3_0,
                scaling =  mat4.getScaling(EveObject.global.vec3_0, this._localTransform);

            if (this.rotationCurve)
            {
                this.rotationCurve.GetValueAt(dt, rotation);
            }

            if (this.translationCurve)
            {
                this.translationCurve.GetValueAt(dt, translation);
            }

            mat4.fromRotationTranslationScale(this._localTransform, rotation, translation, scaling);
        }

        if (parentTransform)
        {
            mat4.multiply(this._worldTransform, parentTransform, this._localTransform);
        }
        else
        {
            mat4.copy(this._worldTransform, this._localTransform);
        }

        const res = this.mesh && this.mesh.IsGood() ? this.mesh.geometryResource : null;

        if (res && this.animation)
        {
            if (!this.animation.HasGeometryResource(res))
            {
                this.animation.SetGeometryResource(res);
            }

            if (this.animation.animations.length)
            {
                this._perObjectData.vs.Set("JointMat", this.animation.GetBoneMatrices(0));
            }
        }

        // TODO: Replace in Update or ViewDependantUpdate
        if (worldSpriteScale  !== this._worldSpriteScale)
        {
            this._worldSpriteScale = worldSpriteScale;

            if (this.boosters)
            {
                this.boosters.SetWorldSpriteScale(worldSpriteScale);
            }

            for (let i = 0; i < this.attachments.length; i++)
            {
                if ("SetWorldSpriteScale" in this.attachments[i])
                {
                    this.attachments[i].SetWorldSpriteScale(worldSpriteScale);
                }
            }
        }

        for (let i = 0; i < this.children.length; ++i)
        {
            this.children[i].UpdateViewDependentData(this._worldTransform);
        }

        mat4.transpose(this._perObjectData.vs.Get("WorldMat"), this._worldTransform);

        const
            center = this._perObjectData.vs.Get("EllipsoidCenter"),
            radii = this._perObjectData.vs.Get("EllipsoidRadii");

        if (this.shapeEllipsoidRadius[0] > 0)
        {
            center[0] = this.shapeEllipsoidCenter[0];
            center[1] = this.shapeEllipsoidCenter[1];
            center[2] = this.shapeEllipsoidCenter[2];
            radii[0] = this.shapeEllipsoidRadius[0];
            radii[1] = this.shapeEllipsoidRadius[1];
            radii[2] = this.shapeEllipsoidRadius[2];
        }
        else if (res)
        {
            const { maxBounds, minBounds } = res;
            vec3.subtract(center, maxBounds, minBounds);
            vec3.scale(center, center, 0.5 * 1.732050807);
            vec3.add(radii, maxBounds, minBounds);
            vec3.scale(radii, radii, 0.5);
        }

        for (let i = 0; i < this.customMasks.length; ++i)
        {
            this.customMasks[i].UpdatePerObjectData(this._worldTransform, this._perObjectData, i, this.visible.customMasks);
        }

        for (let i = 0; i < this.attachments.length; i++)
        {
            if ("UpdateViewDependentData" in this.attachments[i])
            {
                this.attachments[i].UpdateViewDependentData(this._worldTransform, dt, worldSpriteScale);
            }
        }

    }

    /**
     * Identifies the object's wrapped type
     * @type {number}
     */
    static wrappedType = WrappedType.SPACE_SHIP;

    /**
     * Per object data
     * @type {{ps: ((string|number[])[]|(string|number)[])[], vs: ((string|number)[]|(string|number[])[])[]}}
     */
    static perObjectData = {
        vs: [
            [ "WorldMat", 16 ],
            [ "WorldMatLast", 16 ],
            [ "Shipdata", [ 0, 1, 0, -10 ] ],
            [ "Clipdata1", 4 ],
            [ "EllipsoidRadii", 4 ],
            [ "EllipsoidCenter", 4 ],
            [ "Unknown0", [ 0, 1, 0, 0 ] ], //  1: Used to be shipdata 1 ??
            [ "Unknown1", 4 ],
            [ "Unknown2", 4 ],
            [ "Unknown3", 4 ],
            [ "CustomMaskMatrix0", mat4.create() ],
            [ "CustomMaskMatrix1", mat4.create() ],
            [ "CustomMaskData0", [ 1, 0, 0, 0 ] ],
            [ "CustomMaskData1", [ 1, 0, 0, 0 ] ],
            [ "JointMat", 696 ]
        ],
        ps: [
            [ "Shipdata", [ 0, 1, 0, 1 ] ],
            [ "Clipdata1", 4 ],
            [ "Clipdata2", 4 ],
            [ "ShLighting", 4 * 7 ],
            [ "CustomMaskMaterialID0", 4 ],
            [ "CustomMaskMaterialID1", 4 ],
            [ "CustomMaskTarget0", 4 ],
            [ "CustomMaskTarget1", 4 ]
        ]
    };

}
