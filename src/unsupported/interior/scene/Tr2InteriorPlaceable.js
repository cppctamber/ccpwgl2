import { meta } from "utils";
import { box3, mat4, sph3 } from "math";
import { WglTransform } from "core";
import { GLESPerObjectDataInterior } from "../Tr2InteriorPerObjectData";
import { Tr2InteriorScene } from "./Tr2InteriorScene";


@meta.type("Tr2InteriorPlaceable")
@meta.ccp.define("Tr2InteriorPlaceable")
export class Tr2InteriorPlaceable extends WglTransform
{

    @meta.boolean
    display = true;

    @meta.path
    placeableResPath = "";

    @meta.struct("WodPlaceableRes")
    placeableRes = null;

    @meta.list("Tr2InteriorLightSource")
    interiorLights = [];

    @meta.plain
    visible = {
        placeableRes: true
    };

    _perObjectData = new GLESPerObjectDataInterior({ skinned: false });
    _perObjectDataBag = {};
    _inverseWorldTransform = mat4.create();
    _worldTransformLast = mat4.create();
    _interiorScene = null;
    _interiorFrameScene = null;

    /**
     * Initializes the placeable
     */
    Initialize()
    {
        super.Initialize();
        this.UpdatePerObjectData();
    }

    /**
     * Gets resources
     * @param {Array} [out=[]]
     * @returns {Array}
     */
    GetResources(out = [])
    {
        if (this.placeableRes && this.placeableRes.GetResources)
        {
            this.placeableRes.GetResources(out);
        }
        return out;
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
    UpdatePerObjectData()
    {
        const bag = this._perObjectDataBag;

        mat4.invert(this._inverseWorldTransform, this._worldTransform);

        bag.worldTransform = this._worldTransform;
        bag.worldTransformLast = this._worldTransformLast;
        bag.inverseWorldTransform = this._inverseWorldTransform;
        bag.pointLights = this.interiorLights;
        bag.perObjectData = this._perObjectData;
        bag.perFrameVSData = this._interiorFrameScene ? this._interiorFrameScene._perFrameVS : null;
        bag.perFramePSData = this._interiorFrameScene ? this._interiorFrameScene._perFramePS : null;

        return GLESPerObjectDataInterior.Pack(bag, this._perObjectData);
    }

    /**
     * Updates the placeable
     */
    Update()
    {
        this.UpdatePerObjectData();
    }

    /**
     * Rebuilds bounds
     */
    OnRebuildBounds()
    {
        if (this.placeableRes && this.placeableRes.GetBoundingBox && this.placeableRes.GetBoundingBox(this._boundingBox))
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
        if (!this.display || !this.visible.placeableRes || !this.placeableRes) return false;

        this.ApplyInteriorPerFrameData();
        this.UpdatePerObjectData();
        return this.placeableRes.GetBatches(mode, accumulator, this._perObjectData);
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

}
