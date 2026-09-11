/* eslint no-unused-vars:0 */
import { meta } from "utils";
import { vec3, mat4 } from "math";
import { Tr2Lod } from "constant/ccpwgl";

export class EveChild extends meta.Model
{

    /** Carbon logical LOD inherited from the owning root. */
    lodLevel = Tr2Lod.TR2_LOD_HIGH;

    @meta.boolean 
    updateOnDisplay = false;

    get isEffectChild()
    {
        return true;
    }

    /**
     * Whether this child is driven by a bone on the parent's skeleton.
     * @returns {Boolean}
     */
    get isSkinned()
    {
        return this._hasBone === true;
    }

    /**
     * Whether this child's transform can change from frame to frame.
     *
     * Worth asking before trusting a position taken from it. Anything that
     * answers true has a transform that is only good for the frame it was
     * read on, so a caller must re-read rather than cache - and a tool
     * offering to move it by hand is offering something the next frame will
     * overwrite.
     *
     * Three separate ways to move, and a child needs only one of them:
     * a bone on the parent's skeleton, an animation of its own, or a
     * transform modifier - which is how a camera-facing child moves every
     * frame while being neither boned nor animated.
     *
     * @returns {Boolean}
     */
    IsAnimated()
    {
        // Authored as a promise that it does not move; believe it.
        if (this.staticTransform) return false;

        if (this._hasBone) return true;
        if (this.updateAnimation && this.animationUpdater) return true;
        if (this.transformModifiers && this.transformModifiers.length > 0) return true;

        return false;
    }

    /**
     * Updates LOD
     * @param {EveUpdateContext} updateContext
     * @param {Number} parentLodLevel
     * @param {mat4} [parentTransform]
     */
    UpdateLod(updateContext, parentLodLevel, parentTransform)
    {
        this.lodLevel = parentLodLevel;
    }

    /**
     * Prepares current-frame transforms needed by bounds aggregation before
     * the owning root has selected its final logical LOD.
     * @param {mat4} parentTransform
     */
    PrepareLod(parentTransform)
    {

    }

    /**
     * Applies Carbon's logical LOD.
     * @param {Number} lodLevel
     */
    ChangeLOD(lodLevel)
    {
        this.lodLevel = lodLevel;
    }

    /**
     * Resets LOD
     */
    ResetLod()
    {
        this.lodLevel = Tr2Lod.TR2_LOD_HIGH;
    }

    /**
     * Per frame update
     *
     * Carbon passes children one `EveChildUpdateParams` block rather than a
     * positional list (`UpdateSyncronous( const EveUpdateContext&, const
     * EveChildUpdateParams& )`). This port spread that block across arguments
     * and paid for it twice: the defaults went missing, so an unset transform
     * arrived as `undefined` and killed the render loop, and two callers put a
     * bone array in the `perObjectData` slot, where it was silently discarded.
     * `dt` stays separate because ccpwgl has no EveUpdateContext.
     *
     * @param {number} dt
     * @param {EveChildUpdateParams} [params]
     */
    // @meta.abstract
    Update(dt, params)
    {

    }

    /** Owned no-op view-dependent update contract for direct root traversal. */
    UpdateViewDependentData(parentTransform, dt)
    {

    }

    /**
     * Gets object resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    //@meta.abstract
    GetResources(out = [])
    {
        return out;
    }

    /**
     * Effect children without authored bounds participate as unbounded nodes.
     * Concrete renderable children override this owned contract.
     * @param {sph3} out
     * @returns {null}
     */
    GetBoundingSphere(out)
    {
        return null;
    }

    /** Owned no-light contract for direct scene traversal. */
    GetLights(collector, parentContext)
    {

    }

    /** Carbon's optional procedural-child variable contract. */
    SetProceduralContainerVariable(name, value)
    {

    }

    /** Carbon's optional all-curve-set owner contract. */
    PlayAllCurveSets()
    {
        return false;
    }

    /** Carbon's optional all-curve-set owner contract. */
    StopAllCurveSets()
    {
        return false;
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {Boolean} Returns true if batches accumulated
     */
    //@meta.abstract
    GetBatches(mode, accumulator, perObjectData)
    {
        return false;
    }

    /**
     * Class globals and scratch variables
     * @type {Object}
     */
    static global = {
        mat4_0: mat4.create(),
        vec3_0: vec3.create(),
        mat4_1: mat4.create()
    };

    /**
     * Gets joint matrices from temporary child update data or legacy packed per-object data.
     * Prefer root bag/update params (`jointMatrices`) over packed GLES data (`vs.JointMat`).
     * @param {Object|Tw2PerObjectData} parentData
     * @returns {Float32Array|Array|null}
     */
    static GetJointMatrices(parentData)
    {
        if (!parentData) return null;
        if (parentData.jointMatrices) return parentData.jointMatrices;
        if (parentData.perObjectData) return this.GetJointMatrices(parentData.perObjectData);

        const vs = parentData.vs;
        if (vs && typeof vs.Has === "function" && vs.Has("JointMat"))
        {
            return vs.Get("JointMat");
        }

        return null;
    }

    /**
     * Per object data
     * @type {{ffe: *[]}}
     */
    static perObjectData = {
        ffe: [
            [ "world", 16 ],
            [ "worldInverseTranspose", 16 ]
        ]
    };

    /**
     * Identifies that the class is a child effect
     * @returns {boolean}
     */
    static __isEffectChild = true;


    /**
     * The transform a child gets when its caller does not supply one.
     *
     * Carbon passes children an `EveChildUpdateParams` struct whose
     * `localToWorldTransform` is constructed as `IdentityMatrix()`
     * (IEveSpaceObjectChild.h:28), so a caller that sets no transform still
     * hands over identity and the child multiplies by it harmlessly.
     * `EveStretch3` is built on exactly that: it sets the transform for its
     * move and dest objects only, and lets source and stretch take the default.
     *
     * This port turned that struct into positional arguments and the defaults
     * went with it, so an unset transform arrived as `undefined` and
     * `mat4.multiply` read `[0]` of it - a dead render loop where Carbon has a
     * no-op. Each subclass defaults its parameter to this rather than guarding
     * at the multiply, because the missing thing is the ARGUMENT.
     *
     * Read only. It is shared by every child and nothing may write through it.
     * @type {mat4}
     */
    static IDENTITY = mat4.identity(mat4.create());
}
