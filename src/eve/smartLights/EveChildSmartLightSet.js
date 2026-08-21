// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/EveChildSmartLightSet.h
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/EveChildSmartLightSet.cpp
//
// Transcribed from the org's checked port
// (`@carbonenginejs/runtime-trinity` src/eve/smartLights/EveChildSmartLightSet.js),
// which is where the rest of `src/eve/smartLights/**` came from.
//
// TWO ADAPTATIONS, both at the boundary with the parent object:
//
//  1. Carbon's set is an `EveChildTransform`; ccpwgl's effect children all
//     extend `EveChild`, and the parent loops call `UpdateLod`/`ResetLod` on
//     every entry with no guard (`EveShip2.js:724`). Extending EveChild is
//     therefore what keeps a smart light set safe to put in `effectChildren`.
//     Nothing is lost: `EveChildSmartLightSet_Blue.cpp` maps exactly four
//     attributes - name, display, distribution, lightGroups - so the set
//     persists no SRT of its own and its world transform is just the parent's.
//
//  2. Carbon drives children as `UpdateSyncronous(context, params)` +
//     `GetRenderables`; ccpwgl drives them as `Update(dt, parentTransform,
//     perObjectData)` + `GetBatches(mode, accumulator, perObjectData)`. This
//     class is the adapter: it speaks ccpwgl upward and Carbon downward, so the
//     ported distribution methods and light groups keep their Carbon names and
//     do not have to be rewritten.
//
// The `updateContext` the distribution methods want is a duck with a single
// method - a repo-wide grep of `src/eve/distribution/**` and
// `src/eve/smartLights/**` finds `updateContext.GetDeltaT` and nothing else -
// so a scratch bag is cheaper and clearer than porting EveUpdateContext.
import { meta } from "utils";
import { mat4 } from "math";
import { EveChild } from "eve/child";
import { EveChildInheritProperties } from "unsupported/eve/child/EveChildInheritProperties";


@meta.type("EveChildSmartLightSet")
@meta.define({
    wgl: "EveChildSmartLightSet",
    ccp: true
})
export class EveChildSmartLightSet extends EveChild
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    /** m_distribution (IEveDistributionMethodPtr) [READWRITE, PERSIST] */
    @meta.struct("IEveDistributionMethod")
    distribution = null;

    /** m_lightGroups (PIEveSmartLightGroupVector) [READ, PERSIST] */
    @meta.list("IEveSmartLightGroup")
    lightGroups = [];

    _worldTransform = mat4.create();

    /** m_inheritProperties - lazily created, never persisted (EveChildSmartLightSet.h:72). */
    _inheritProperties = null;

    /**
     * The scratch update-context and parameter bag handed to the distribution
     * and the groups. Rebuilt in place each frame: Carbon's params block does
     * not survive the call either (IEveSpaceObjectChild.h), so nothing may hold
     * a reference to it.
     */
    _updateContext = { GetDeltaT: () => this._dt };
    _updateParams = null;
    _dt = 0;

    /**
     * Captures the frustum on the way past and forwards LOD.
     *
     * Carbon culls per placement inside `AddQuadsToQuadRenderer`, which runs at
     * render time with a frustum in hand. ccpwgl builds geometry during update
     * and has no frustum there, so the one place a frustum passes through is
     * captured here and handed to the groups when they build.
     *
     * @param {Tw2Frustum} frustum
     * @param {Number} parentLod
     */
    UpdateLod(frustum, parentLod)
    {
        super.UpdateLod(frustum, parentLod);

        for (let i = 0; i < this.lightGroups.length; i++)
        {
            const group = this.lightGroups[i];
            if (group && "_frustum" in group) group._frustum = frustum;
        }
    }

    /**
     * Returns the local-to-world matrix (EveChildSmartLightSet.cpp:162-165).
     * @param {mat4} [out]
     * @returns {mat4}
     */
    GetLocalToWorldTransform(out)
    {
        return out ? mat4.copy(out, this._worldTransform) : this._worldTransform;
    }

    /**
     * Smart light sets carry no bound (EveChildSmartLightSet.h:39-42).
     * @returns {Boolean}
     */
    GetBoundingSphere()
    {
        return false;
    }

    /**
     * Gets resources from the distribution and every light group.
     * @param {Array} [out=[]]
     * @returns {Array}
     */
    GetResources(out = [])
    {
        this.distribution?.GetResources?.(out);

        for (let i = 0; i < this.lightGroups.length; i++)
        {
            this.lightGroups[i]?.GetResources?.(out);
        }

        return out;
    }

    /**
     * Per frame update. Rebuilds the world transform, then advances the
     * distribution and every light group (EveChildSmartLightSet.cpp:73-99).
     *
     * Carbon splits this into UpdateSyncronous and UpdateAsyncronous; ccpwgl
     * has one update phase, so both are called in Carbon's order.
     *
     * @param {Number} dt
     * @param {mat4} parentTransform
     * @param {Tw2PerObjectData} [perObjectData]
     * @param {?EveShip2} [parentSpaceObject]
     */
    Update(dt, parentTransform, perObjectData, parentSpaceObject)
    {
        mat4.copy(this._worldTransform, parentTransform);

        if (!this.distribution || !this.display) return;

        this._dt = dt;

        const params = this._updateParams || (this._updateParams = {});
        params.spaceObjectParent = parentSpaceObject || null;
        params.childParent = this;
        params.localToWorldTransform = this._worldTransform;
        params.bones = EveChild.GetJointMatrices(perObjectData);
        params.boneCount = params.bones ? params.bones.length / 12 : 0;
        params.activationStrength = perObjectData && perObjectData.activationStrength !== undefined
            ? perObjectData.activationStrength
            : 1;
        params.isVisible = true;

        const context = this._updateContext;

        this.distribution.UpdateSyncronous?.(context, params);

        for (let i = 0; i < this.lightGroups.length; i++)
        {
            this.lightGroups[i]?.UpdateSyncronous?.(context, params, this.distribution);
        }

        this.distribution.UpdateAsyncronous?.(context, params);

        for (let i = 0; i < this.lightGroups.length; i++)
        {
            this.lightGroups[i]?.UpdateAsyncronous?.(context, params, this.distribution);
        }
    }

    /**
     * Renderable fan-out, gated on the distribution and display
     * (EveChildSmartLightSet.cpp:151-160).
     *
     * Carbon collects ITr2Renderable pointers and hands the quads to
     * Tr2QuadRenderer separately; ccpwgl has one batch accumulator, so the
     * groups accumulate directly. The distribution is passed on because a
     * group holds no placement data of its own - Carbon threads it through
     * every group call for the same reason.
     *
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean} true if any batch was accumulated
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.distribution || !this.display) return false;

        let accumulated = false;

        for (let i = 0; i < this.lightGroups.length; i++)
        {
            if (this.lightGroups[i]?.GetBatches?.(mode, accumulator, perObjectData, this.distribution))
            {
                accumulated = true;
            }
        }

        return accumulated;
    }

    /**
     * Fans a controller variable to the distribution and light groups
     * (EveChildSmartLightSet.cpp:167-178).
     * @param {String} name
     * @param {Number} value
     */
    SetControllerVariable(name, value)
    {
        this.distribution?.SetControllerVariable?.(name, value);

        for (let i = 0; i < this.lightGroups.length; i++)
        {
            this.lightGroups[i]?.SetControllerVariable?.(name, value);
        }
    }

    /**
     * Lazily creates the property holder, stores the color set, and fans it out
     * to every light group (EveChildSmartLightSet.cpp:215-227).
     * @param {Array} colorSet
     */
    SetInheritProperties(colorSet)
    {
        if (!this._inheritProperties)
        {
            this._inheritProperties = new EveChildInheritProperties();
        }

        this._inheritProperties.SetProperties?.(colorSet);

        for (let i = 0; i < this.lightGroups.length; i++)
        {
            this.lightGroups[i]?.SetInheritProperties?.(colorSet);
        }
    }

    /**
     * Collects the lights every group emits.
     *
     * The groups that emit actual light (EveSmartLightPointLight,
     * EveSmartLightSpotLight) still speak Carbon's `GetLights(lightManager)`
     * contract rather than ccpwgl's collector, so this forwards and lets a
     * group opt in. The emitter bridge is the SECOND piece of work, after the
     * geometry - see the note at the top of src/index.js.
     *
     * @param {Tw2CarbonLightCollector} collector
     * @param {Object} [parentContext]
     */
    GetLights(collector, parentContext)
    {
        if (!this.distribution || !this.display) return;

        for (let i = 0; i < this.lightGroups.length; i++)
        {
            this.lightGroups[i]?.GetLights?.(collector, parentContext, this.distribution);
        }
    }

}
