import { meta, perArrayChild } from "utils";
import { box3, vec3, mat4, sph3 } from "math";
import { Tw2AnimationController, Tw2PerObjectData } from "core";
import { EveObject } from "../EveObject";
import { LodLevelPixels } from "constant/ccpwgl";


@meta.type("EveSpaceObject")
export class EveSpaceObject extends EveObject
{

    @meta.struct("Tw2AnimationController")
    @meta.isPrivate
    animation = new Tw2AnimationController();

    @meta.vector3
    @meta.isPrivate
    boundingSphereCenter = vec3.create();

    @meta.float
    @meta.isPrivate
    boundingSphereRadius = 0;

    @meta.list("EveObject")
    children = [];

    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.list("EveCustomMask")
    customMasks = [];

    @meta.list("EveSpaceObjectDecal")
    decals = [];

    @meta.list("EveChild")
    effectChildren = [];

    @meta.float
    killCount = 0;

    @meta.list("EveCurveLineSet")
    lineSets = [];

    @meta.list("EveLocator")
    locators = [];

    @meta.struct("Tw2Mesh")
    mesh = null;

    @meta.list("EveMeshOverlayEffect")
    overlayEffects = [];

    @meta.list("EvePlaneSet")
    planeSets = [];

    @meta.vector3
    @meta.isPrivate
    shapeEllipsoidRadius = vec3.create();

    @meta.vector3
    @meta.isPrivate
    shapeEllipsoidCenter = vec3.create();

    @meta.list("EveSpotlightSet")
    spotlightSets = [];

    @meta.list("EveSpriteSet")
    spriteSets = [];

    @meta.list("EveTurretSet")
    turretSets = [];

    @meta.plain
    visible = {
        mesh: true,
        children: true,
        effectChildren: true,
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

    /**
     * Alias for _localTransform
     * @return {mat4}
     */
    @meta.matrix4
    get transform()
    {
        return this._localTransform;
    }

    set transform(m)
    {
        mat4.copy(this._localTransform, m);
    }

    _lod = 3;
    _worldSpriteScale = 1;
    _parentTransform = mat4.create();
    _perObjectData = Tw2PerObjectData.from(EveSpaceObject.perObjectData);

    /**
     * Initializes the EveSpaceObject
     */
    Initialize()
    {
        if (this.mesh)
        {
            this.animation.SetGeometryResource(this.mesh.geometryResource);
        }

        super.Initialize();
    }

    OnRebuildBounds()
    {
        if (this.animation && this.animation.animations.length)
        {
            throw new Error("Rebuilding bounds on animated meshes not yet supported");
        }

        if (!this.mesh || !this.mesh.IsGood())
        {
            this._boundsDirty = true;
            return;
        }

        const { box3_0, sph3_0 } = EveObject.global;

        box3.empty(this._boundingBox);
        this.mesh.geometryResource.GetBoundingBox(this._boundingBox);

        const unionFromArrayItems = (array = []) =>
        {
            for (let i = 0; i < array.length; i++)
            {
                if ("GetBoundingBox" in array[i])
                {
                    array[i].GetBoundingBox(box3_0);
                    box3.union(this._boundingBox, this._boundingBox, box3_0);
                }
                else if ("GetBoundingSphere" in array[i])
                {
                    array[i].GetBoundingSphere(sph3_0);
                    box3.fromSph3(box3_0, sph3_0);
                    box3.union(this._boundingBox, this._boundingBox, box3_0);
                }
            }
        };

        unionFromArrayItems(this.spriteSets);
        unionFromArrayItems(this.spotlightSets);
        unionFromArrayItems(this.planeSets);
        unionFromArrayItems(this.children);
        unionFromArrayItems(this.effectChildren);
        unionFromArrayItems(this.boosters);
        unionFromArrayItems(this.turretSets);

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
        if (this.animation) this.animation.GetResources(out);
        const per = perArrayChild;
        per(this.spriteSets, "GetResources", out);
        per(this.turretSets, "GetResources", out);
        per(this.decals, "GetResources", out);
        per(this.spotlightSets, "GetResources", out);
        per(this.planeSets, "GetResources", out);
        per(this.lineSets, "GetResources", out);
        per(this.overlayEffects, "GetResources", out);
        per(this.effectChildren, "GetResources", out);
        per(this.children, "GetResources", out);
        return out;
    }

    /**
     * Resets the lod
     */
    ResetLod()
    {
        this._lod = 3;
    }

    /**
     * Updates the lod
     * @param {Tw2Frustum} frustum
     */
    UpdateLod(frustum)
    {
        const center = vec3.transformMat4(EveObject.global.vec3_0, this.boundingSphereCenter, this.transform);

        if (frustum.IsSphereVisible(center, this.boundingSphereRadius))
        {
            this._pixelSizeAcross = frustum.GetPixelSizeAcross(center, this.boundingSphereRadius);

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

        for (let i = 0; i < this.children.length; i++)
        {
            if (this.children[i].UpdateLod)
            {
                this.children[i].UpdateLod(frustum, this._lod);
            }
        }

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            if (this.effectChildren[i].UpdateLod)
            {
                this.effectChildren[i].UpdateLod(frustum, this._lod);
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
     * Rebuilds overlay effects
     * @param {Array<EveMeshOverlayEffect>} [overlays=[]] - The overlays that should be in effect
     * @return {Boolean} true if updated
     */
    RebuildOverlays(overlays = [])
    {
        if (overlays.length === 0 && this.overlayEffects.length === 0)
        {
            return false;
        }

        this.overlayEffects.splice(0);

        for (let i = 0; i < overlays.length; i++)
        {
            this.overlayEffects.push(overlays[i]);
        }

        return true;
    }

    /**
     * A Per frame function that updates view dependent data
     * @param {undefined|mat4} parentTransform
     * @param {Number} dt
     * @param {Number} worldSpriteScale
     */
    UpdateViewDependentData(parentTransform, dt, worldSpriteScale)
    {
        mat4.copy(this._parentTransform, parentTransform);
        mat4.transpose(this._perObjectData.vs.Get("WorldMatLast"), this._worldTransform);

        this.RebuildTransforms({ force: true, skipUpdate: true });

        const res = this.mesh && this.mesh.IsGood() ? this.mesh.geometryResource : null;

        if (res)
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

        // Temporary
        if (this._worldSpriteScale !== worldSpriteScale)
        {
            this._worldSpriteScale = worldSpriteScale;

            for (let i = 0; i < this.spriteSets.length; i++)
            {
                this.spriteSets[i].SetWorldSpriteScale(worldSpriteScale);
            }
        }

        for (let i = 0; i < this.children.length; ++i)
        {
            this.children[i].UpdateViewDependentData(this._worldTransform, dt, worldSpriteScale);
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

        const worldNoTranslation = mat4.copy(EveObject.global.mat4_0, this._worldTransform);
        worldNoTranslation[12] = 0;
        worldNoTranslation[13] = 0;
        worldNoTranslation[14] = 0;

        for (let i = 0; i < this.customMasks.length; ++i)
        {
            this.customMasks[i].UpdatePerObjectData(worldNoTranslation, this._perObjectData, i, this.visible.customMasks);
        }

        for (let i = 0; i < this.lineSets.length; ++i)
        {
            this.lineSets[i].UpdateViewDependentData(this._worldTransform);
        }
    }

    /**
     * Per frame update
     * @param {Number} dt - delta time
     */
    Update(dt)
    {
        if (this._lod > 0)
        {
            for (let i = 0; i < this.spriteSets.length; ++i)
            {
                this.spriteSets[i].Update(dt);
            }

            for (let i = 0; i < this.planeSets.length; i++)
            {
                this.planeSets[i].Update(dt);
            }

            for (let i = 0; i < this.spotlightSets.length; i++)
            {
                this.spotlightSets[i].Update(dt);
            }

            for (let i = 0; i < this.children.length; ++i)
            {
                this.children[i].Update(dt);
            }

            for (let i = 0; i < this.effectChildren.length; ++i)
            {
                this.effectChildren[i].Update(dt, this._worldTransform, this._lod);
            }

            for (let i = 0; i < this.curveSets.length; ++i)
            {
                this.curveSets[i].Update(dt);
            }

            for (let i = 0; i < this.overlayEffects.length; ++i)
            {
                this.overlayEffects[i].Update(dt);
            }

            for (let i = 0; i < this.lineSets.length; i++)
            {
                this.lineSets[i].Update(dt);
            }

            if (this.animation)
            {
                this.animation.Update(dt);
            }
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

        if (this._lod > 1)
        {
            if (show.spriteSets)
            {
                for (let i = 0; i < this.spriteSets.length; i++)
                {
                    this.spriteSets[i].GetBatches(mode, accumulator, this._perObjectData, this._worldTransform);
                }
            }

            if (show.spotlightSets)
            {
                for (let i = 0; i < this.spotlightSets.length; i++)
                {
                    this.spotlightSets[i].GetBatches(mode, accumulator, this._perObjectData);
                }
            }

            if (show.planeSets)
            {
                for (let i = 0; i < this.planeSets.length; i++)
                {
                    this.planeSets[i].GetBatches(mode, accumulator, this._perObjectData);
                }
            }


            if (show.lineSets)
            {
                for (let i = 0; i < this.lineSets.length; i++)
                {
                    this.lineSets[i].GetBatches(mode, accumulator);
                }
            }

            if (res)
            {
                if (show.decals)
                {
                    for (let i = 0; i < this.decals.length; i++)
                    {
                        this.decals[i].GetBatches(mode, accumulator, this._perObjectData, res, show.killmarks ? this.killCount : 0);
                    }
                }

                if (show.overlayEffects)
                {
                    for (let i = 0; i < this.overlayEffects.length; i++)
                    {
                        this.overlayEffects[i].GetBatches(mode, accumulator, this._perObjectData, this.mesh);
                    }
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

        if (show.effectChildren)
        {
            for (let i = 0; i < this.effectChildren.length; i++)
            {
                this.effectChildren[i].GetBatches(mode, accumulator, this._perObjectData);
            }
        }
    }

    /**
     * RenderDebugInfo
     * @param debugHelper
     */
    RenderDebugInfo(debugHelper)
    {
        if (this.animation)
        {
            this.animation.RenderDebugInfo(debugHelper);
        }
    }

    /**
     * Per object data
     * @type {{vs: *[], ps: *[]}}
     */
    static perObjectData = {
        vs: [
            [ "WorldMat", 16 ],
            [ "WorldMatLast", 16 ],
            [ "Shipdata", [ 0, 1, 0, -10 ] ],
            [ "Clipdata1", 4 ],
            [ "EllipsoidRadii", 4 ],
            [ "EllipsoidCenter", 4 ],
            [ "CustomMaskMatrix0", mat4.identity([]) ],
            [ "CustomMaskMatrix1", mat4.identity([]) ],
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

export { EveSpaceObject as EveStation };
