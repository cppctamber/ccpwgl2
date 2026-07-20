import { meta, perArrayChild } from "utils";
import { box3, mat4, sph3, vec3 } from "math";
import { WglTransform } from "core";
import { GLESPerObjectDataInterior } from "../Tr2InteriorPerObjectData";
import { Tr2InteriorAnimationController } from "./Tr2InteriorAnimationController";
import { Tr2InteriorScene } from "../scene/Tr2InteriorScene";

@meta.type("Tr2IntSkinnedObject")
@meta.ccp.define("Tr2IntSkinnedObject")
export class Tr2IntSkinnedObject extends WglTransform
{

    @meta.boolean
    display = true;

    @meta.float
    depthOffset = 0;

    @meta.struct("Tr2InteriorAnimationController")
    animation = new Tr2InteriorAnimationController();

    @meta.struct("Tr2SkinnedModel")
    visualModel = null;

    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.list("Tr2InteriorLightSource")
    interiorLights = [];

    @meta.plain
    visible = {
        visualModel: true
    };

    @meta.vector4
    boundingSphereRadius = new Float32Array([ 0, 0, 0, 0 ]);

    _perObjectData = new GLESPerObjectDataInterior();
    _perMeshObjectData = [];
    _perObjectDataBag = {};
    _inverseWorldTransform = mat4.create();
    _worldTransformLast = mat4.create();
    _ellipsoidCenter = new Float32Array([ 0, 0, 0, 0 ]);
    _ellipsoidRadii = new Float32Array([ 1, 1, 1, 0 ]);
    _interiorScene = null;
    _interiorFrameScene = null;

    /**
     * Initializes the skinned object
     */
    Initialize()
    {
        super.Initialize();
        if (this.visualModel && this.visualModel.Initialize)
        {
            this.visualModel.Initialize();
        }
        this.BindAnimationToVisualModel();
    }

    /**
     * Gets resources
     * @param {Array} [out=[]]
     * @returns {Array}
     */
    GetResources(out = [])
    {
        if (this.animation) this.animation.GetResources(out);
        if (this.visualModel) this.visualModel.GetResources(out);
        return out;
    }

    /**
     * Binds the animation controller to the current model geometry
     * @returns {Boolean}
     */
    BindAnimationToVisualModel()
    {
        const resources = [];
        if (this.visualModel && this.visualModel.GetGeometryResources)
        {
            this.visualModel.GetGeometryResources(resources);
        }
        else if (this.visualModel && this.visualModel.GetGeometryResource)
        {
            const res = this.visualModel.GetGeometryResource();
            if (res) resources.push(res);
        }

        if (!resources.length || !this.animation) return false;

        const
            current = this.animation.geometryResources || [],
            animationOnlyResources = current.length && current[0] === resources[0]
                ? current.filter(resource =>
                    !resources.includes(resource) &&
                    !resource?.meshes?.length &&
                    !!resource?.animations?.length
                )
                : [];

        let reset = !current.length || current[0] !== resources[0];
        for (let i = 0; i < resources.length && !reset; i++)
        {
            reset = !current.includes(resources[i]);
        }

        if (reset)
        {
            this.animation.SetGeometryResource(resources[0]);
        }

        for (let i = reset ? 1 : 0; i < resources.length; i++)
        {
            if (!this.animation.HasGeometryResource(resources[i]))
            {
                this.animation.AddGeometryResource(resources[i]);
            }
        }

        for (let i = 0; i < animationOnlyResources.length; i++)
        {
            if (!this.animation.HasGeometryResource(animationOnlyResources[i]))
            {
                this.animation.AddGeometryResource(animationOnlyResources[i]);
            }
        }

        this.animation.RebuildCachedData();

        return true;
    }

    /**
     * Updates per-frame animation and curves
     * @param {Number} dt
     */
    Update(dt)
    {
        for (let i = 0; i < this.curveSets.length; i++)
        {
            if (this.curveSets[i] && this.curveSets[i].UpdateDelta)
            {
                this.curveSets[i].UpdateDelta(dt);
            }
        }

        this.BindAnimationToVisualModel();

        if (this.animation)
        {
            this.animation.Update(dt);
        }
    }

    /**
     * Updates view dependent data
     * @param {mat4} [parentTransform]
     */
    UpdateViewDependentData(parentTransform)
    {
        if (parentTransform)
        {
            this.SetParentTransform(parentTransform);
        }

        mat4.copy(this._worldTransformLast, this._worldTransform);
        this.RebuildTransforms({ force: true, skipUpdate: true });
        this.UpdatePerObjectData();
    }

    /**
     * Updates the GLES compatibility per-object data
     * @returns {*}
     */
    UpdatePerObjectData(meshIndex = 0, perObjectData = this._perObjectData, geometryResource = null)
    {
        const
            bag = this._perObjectDataBag,
            res = geometryResource || (this.visualModel && this.visualModel.GetGeometryResource
                ? this.visualModel.GetGeometryResource()
                : null);

        this.BindAnimationToVisualModel();

        if (res && res.RebuildBounds)
        {
            res.RebuildBounds();
            this.UpdateDerivedBoundsFromResource(res);
        }

        mat4.invert(this._inverseWorldTransform, this._worldTransform);

        bag.worldTransform = this._worldTransform;
        bag.worldTransformLast = this._worldTransformLast;
        bag.inverseWorldTransform = this._inverseWorldTransform;
        bag.jointMatrices = this.animation ? this.animation.GetBoneMatrices(meshIndex, res) : null;
        bag.pointLights = this.interiorLights;
        bag.perObjectData = perObjectData;
        bag.perFrameVSData = this._interiorFrameScene ? this._interiorFrameScene._perFrameVS : null;
        bag.perFramePSData = this._interiorFrameScene ? this._interiorFrameScene._perFramePS : null;

        return GLESPerObjectDataInterior.Pack(bag, perObjectData);
    }

    /**
     * Gets per-mesh GLES object data with the matching bone palette.
     * @param {*} mesh
     * @param {Number} index
     * @returns {GLESPerObjectDataInterior}
     */
    GetPerMeshObjectData(mesh, index)
    {
        const
            meshIndex = mesh && mesh.meshIndex !== undefined ? mesh.meshIndex : index,
            res = mesh && mesh.geometryResource ? mesh.geometryResource : null,
            resourceIndex = this.animation && res ? this.animation.geometryResources.indexOf(res) : -1,
            key = `${resourceIndex}:${meshIndex}`;

        if (!this._perMeshObjectData[key])
        {
            this._perMeshObjectData[key] = new GLESPerObjectDataInterior();
        }

        return this.UpdatePerObjectData(meshIndex, this._perMeshObjectData[key], res);
    }

    /**
     * Updates derived bounds used by old GLES per-object data
     * @param {*} res
     */
    UpdateDerivedBoundsFromResource(res)
    {
        const
            min = res.minBounds,
            max = res.maxBounds;

        if (min && max)
        {
            this._ellipsoidCenter[0] = (min[0] + max[0]) * 0.5;
            this._ellipsoidCenter[1] = (min[1] + max[1]) * 0.5;
            this._ellipsoidCenter[2] = (min[2] + max[2]) * 0.5;
            this._ellipsoidCenter[3] = 0;

            this._ellipsoidRadii[0] = Math.max((max[0] - min[0]) * 0.5, 1);
            this._ellipsoidRadii[1] = Math.max((max[1] - min[1]) * 0.5, 1);
            this._ellipsoidRadii[2] = Math.max((max[2] - min[2]) * 0.5, 1);
            this._ellipsoidRadii[3] = 0;
        }

        if (res.boundsSpherePosition)
        {
            this.boundingSphereRadius[0] = res.boundsSpherePosition[0] || 0;
            this.boundingSphereRadius[1] = res.boundsSpherePosition[1] || 0;
            this.boundingSphereRadius[2] = res.boundsSpherePosition[2] || 0;
        }
        else
        {
            this.boundingSphereRadius[0] = this._ellipsoidCenter[0];
            this.boundingSphereRadius[1] = this._ellipsoidCenter[1];
            this.boundingSphereRadius[2] = this._ellipsoidCenter[2];
        }

        this.boundingSphereRadius[3] = res.boundsSphereRadius || Math.max(
            this._ellipsoidRadii[0],
            this._ellipsoidRadii[1],
            this._ellipsoidRadii[2],
            1
        );
    }

    /**
     * Rebuilds bounds
     */
    OnRebuildBounds()
    {
        if (this.visualModel && this.visualModel.GetBoundingBox && this.visualModel.GetBoundingBox(this._boundingBox))
        {
            sph3.fromBox3(this._boundingSphere, this._boundingBox);
            this._boundsDirty = false;
            return;
        }

        box3.empty(this._boundingBox);
        sph3.empty(this._boundingSphere);
        this._boundsDirty = true;
    }

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {*} accumulator
     * @returns {Boolean}
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display || !this.visible.visualModel || !this.visualModel) return false;

        this.ApplyInteriorPerFrameData();
        return this.visualModel.GetBatches(mode, accumulator, (mesh, index) => this.GetPerMeshObjectData(mesh, index));
    }

    /**
     * Applies interior frame constants when hosted outside Tr2InteriorScene.
     */
    ApplyInteriorPerFrameData()
    {
        let scene;
        if (this._interiorScene && this._interiorScene.ApplyPerFrameData)
        {
            scene = this._interiorScene.ApplyPerFrameData();
        }
        else
        {
            scene = Tr2InteriorScene.ApplyFallbackPerFrameData();
        }
        this._interiorFrameScene = scene;
        return scene;
    }

    /**
     * Renders debug info
     * @param {*} debugHelper
     */
    RenderDebugInfo(debugHelper)
    {
        if (this.animation && this.animation.RenderDebugInfo)
        {
            this.animation.RenderDebugInfo(debugHelper);
        }
    }

    /**
     * Gets curve set resources and model resources
     * @param {Array} [out=[]]
     * @returns {Array}
     */
    GetCurveSetResources(out = [])
    {
        perArrayChild(this.curveSets, "GetResources", out);
        return out;
    }

    static global = {
        vec3_0: vec3.create()
    };

}
