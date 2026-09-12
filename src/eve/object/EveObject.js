/* eslint no-unused-vars:0 */
import { meta } from "utils";
import { mat4, vec3, sph3, box3 } from "math";
import { WglTransform } from "core/WglTransform";
import { EvePlaneSet } from "eve";
import { Tw2TextureParameter } from "core";
import { Tr2Lod } from "constant/ccpwgl";

// ccpwgl editor visibility groups also govern the lights emitted by each set.
const attachmentLightVisibility = {
    EveSpriteSet: "spriteSets", EveSpotlightSet: "spotlightSets",
    EvePlaneSet: "planeSets", EveHazeSet: "hazeSets",
    EveSpriteLineSet: "spriteLineSets", EveBanner: "banners", EveBannerSet: "banners"
};


export class EveObject extends WglTransform
{

    _controllerUpdateFrequency = 0.5;

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.float
    clip = 1.0;

    /** Carbon logical LOD. Visibility is tracked independently. */
    lodLevel = Tr2Lod.TR2_LOD_HIGH;

    /** Logical LOD after bounds contributed by children are included. */
    lodLevelWithChildren = Tr2Lod.TR2_LOD_HIGH;

    /** Whether the complete object graph passed the last visibility update. */
    isVisible = true;

    /** Whether the root mesh sphere intersects the current frustum. */
    _isMeshVisible = true;

    /** Current projected diameter of the root mesh sphere in pixels. */
    estimatedPixelDiameter = 0;

    /** Current projected diameter of the combined object bounds in pixels. */
    estimatedPixelDiameterWithChildren = 0;

    /**
     * Resets LOD
     */
    ResetLod()
    {
        this._controllerUpdateFrequency = 1;
        this._SetLodState(true, Tr2Lod.TR2_LOD_HIGH, Tr2Lod.TR2_LOD_HIGH, true);
    }

    /**
     * Updates LOD
     * @param {EveUpdateContext} updateContext
     */
    UpdateLod(updateContext)
    {
        this._SetLodState(true, Tr2Lod.TR2_LOD_HIGH, Tr2Lod.TR2_LOD_HIGH, true);
    }

    /**
     * Commits Carbon logical visibility and detail.
     * @param {Boolean} visible
     * @param {Number} lodLevel
     * @param {Number} lodLevelWithChildren
     * @param {Boolean} meshVisible
     * @protected
     */
    _SetLodState(visible, lodLevel, lodLevelWithChildren, meshVisible)
    {
        this.isVisible = visible;
        this._isMeshVisible = meshVisible;
        this.lodLevel = lodLevel;
        this.lodLevelWithChildren = lodLevelWithChildren;
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    @meta.abstract
    GetResources(out = [])
    {
        return out;
    }

    /**
     * Per frame update
     * @param {number} dt - delta time
     */
    @meta.abstract
    Update(dt)
    {

    }

    /**
     * Prepares current-frame transform and per-object state before visibility
     * and batch collection. Concrete scene objects override as needed.
     * @param {mat4} parentTransform
     * @param {Number} dt
     */
    @meta.abstract
    UpdateViewDependentData(parentTransform, dt)
    {

    }

    /**
     * Accumulates batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @returns {Boolean} true if batches accumulated
     */
    @meta.abstract
    GetBatches(mode, accumulator)
    {
        return false;
    }

    /**
     * Collects dynamic lights for the Carbon (translated DX11) shader
     * path by forwarding to any light-owning child effects (e.g.
     * EveChildContainer). Subclasses with their own light sources
     * should extend this. Inert for the legacy v8 shader path.
     * @param {Tw2CarbonLightCollector} collector
     * @param {Object} [parentContext]
     */
    GetLights(collector, parentContext = {})
    {
        if (!this.display) return;

        const bones = this._jointMatrices || parentContext.bones || null;
        const context = {
            ...parentContext,
            bones,
            activationStrength: this.activationStrength ?? parentContext.activationStrength ?? 1,
            boosterGain: this.visible && this.visible.boosters === false ? 0 : (this.boosterGain ?? 0)
        };

        // Effect children AND attachments. Carbon reaches attachment lights a
        // different way: a set that owns lights registers itself as an
        // `ITr2LightOwner` with the component registry
        // (`EvePlaneSet.cpp:535-541`), and the scene collects from the registry
        // rather than walking the tree - which is why
        // `EveSpaceObject2::GetLights` emits only the object's OWN lights and
        // never descends.
        //
        // ccpwgl declares the same component type (`EveComponentType.LightOwner`)
        // but nothing wires a registry yet - every registration is optional
        // chained away - and the scene collects by walking
        // (`EveSpaceScene.PerChildObject("GetLights", ...)`). So the walk stands
        // in for the registry. Without visiting attachments, a plane, spotlight
        // or sprite set could fill its lights from SOF and still never have one
        // collected.
        for (const list of [ this.effectChildren, this.attachments ])
        {
            if (!list) continue;
            if (list === this.effectChildren && this.visible && this.visible.effectChildren === false) continue;

            for (let i = 0; i < list.length; i++)
            {
                const child = list[i];
                if (!child) continue;
                const group = attachmentLightVisibility[child.GetClassName()];
                if (group && this.visible && this.visible[group] === false) continue;
                if (list === this.attachments && child.UpdateLights)
                {
                    const boneCount = bones ? (typeof bones[0] === "number" ? bones.length / 12 : bones.length) : 0;
                    child.UpdateLights(this._worldTransform, bones, boneCount, context.activationStrength, context.boosterGain);
                }
                child.GetLights(collector, context);
            }
        }
    }

    /**
     * Finds planeSets with names that include billboard
     * TODO: why is this here, this looks like a specific helper function.
     * @param out
     * @returns {*[]}
     * @constructor
     */
    FindPlaneSetsWithVideos(out=[])
    {
        let arr = "attachments" in this ? this.attachments : this.planeSets;
        if (arr)
        {
            for (let i = 0; i < arr.length; i++)
            {
                if (arr[i] instanceof EvePlaneSet && arr[i].effect)
                {
                    const { parameters } = arr[i].effect;
                    for (const key in parameters)
                    {
                        if (
                            parameters.hasOwnProperty(key) &&
                            parameters[key] instanceof Tw2TextureParameter &&
                            parameters[key].textureRes._runtime &&
                            !out.includes(parameters[key])
                        )
                        {
                            out.push(arr[i]);
                            break;
                        }
                    }
                }
            }
        }

        if ("children" in this)
        {
            for (let i = 0; i < this.children.length; i++)
            {
                if ("FindPlaneSetsWithVideos" in this.children[i])
                {
                    this.children[i].FindPlaneSetsWithVideos(out);
                }
            }
        }

        return out;
    }

    /**
     * Global and scratch variables
     * @type {*}
     */
    static global = {
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        vec3_2: vec3.create(),
        vec3_3: vec3.create(),
        vec3_4: vec3.create(),
        vec3_5: vec3.create(),
        vec3_6: vec3.create(),
        vec3_7: vec3.create(),
        mat4_0: mat4.create(),
        mat4_1: mat4.create(),
        mat4_2: mat4.create(),
        mat4_ID: mat4.create(),
        box3_0: box3.create(),
        sph3_0: sph3.create(),
        sph3_1: sph3.create(),
        sph3_2: sph3.create()
    };

}
