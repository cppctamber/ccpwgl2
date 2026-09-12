import { meta } from "utils";
import { mat4 } from "math";
import { device } from "global";
import { EveObjectSet } from "./EveObjectSet";
import { EvePlaneSet } from "./EvePlaneSet";
import { CjsLightData } from "../lights/CjsLightData";
import { CopyLightData } from "../lights/lightConversion";
import { Tr2LightProfileRes } from "core/resource/Tr2LightProfileRes";
import { Saturate } from "./EveSpaceObjectAttachmentUtils";

/** Carbon EveBannerSet.h:32: a runtime light record, not a Blue-persisted item. */
@meta.define("EveBannerLight")
export class EveBannerLight extends meta.Model
{
    @meta.struct("CjsLightData")
    lightData = new CjsLightData();

    @meta.float
    saturation = 1;

    @meta.uint
    index = 0;

    @meta.matrix4
    boneMatrix = mat4.create();

    @meta.path
    lightProfilePath = "";

    lightProfile = null;
    _resolvedProfilePath = "";

    OnValueChanged()
    {
        if (this.lightProfilePath !== this._resolvedProfilePath)
        {
            this._resolvedProfilePath = this.lightProfilePath;
            this.lightProfile = Tr2LightProfileRes.Resolve(this.lightProfilePath);
        }
    }
}

/**
 * Carbon's banner light owner. ccpwgl still draws banners through the legacy
 * EveBanner adapter, which delegates its lighting here. Set geometry is absent.
 */
@meta.define("EveBannerSet", true)
@meta.partialImplementation
export class EveBannerSet extends EveObjectSet
{
    @meta.list("EveBannerLight")
    lights = [];

    _activationStrength = 1;
    _primaryTextureParameter = null;
    _lightDataCopy = new CjsLightData();

    /** Carbon EveBannerSet::SetPrimaryTextureParameter. */
    SetPrimaryTextureParameter(parameter)
    {
        this._primaryTextureParameter = parameter;
    }

    /** Carbon EveBannerSet::AddLightFromSOF. */
    AddLightFromSOF(light)
    {
        // Carbon pushes the record and its LightData by value, but keeps the profile shared.
        const values = light.GetValues ? light.GetValues() : { ...light };
        const data = values.lightData;
        values.lightData = CjsLightData.from(data.GetValues ? data.GetValues() : data);
        const record = EveBannerLight.from(values);
        record.lightProfile = light.lightProfile || null;
        this.lights.push(record);
    }

    /** Carbon's banner/plane UpdateLights loops are identical. */
    UpdateLights(parentTransform, bones, boneCount, activationStrength, boosterGain)
    {
        EvePlaneSet.prototype.UpdateLights.call(this, parentTransform, bones, boneCount, activationStrength, boosterGain);
    }

    /** Carbon EveBannerSet.cpp:441: no image means transparent black. */
    GetAverageColor()
    {
        const resource = this._primaryTextureParameter && this._primaryTextureParameter.textureRes;
        return resource ? resource.GetAverageColor() : [ 0, 0, 0, 0 ];
    }

    /** Carbon EveBannerSet.cpp:466; tint a copy so texture changes never accumulate. */
    GetLights(collector, parentContext = {})
    {
        if (!this.display || !this.lights.length) return;
        const average = this.GetAverageColor();
        if (average[3] === 0) return;
        for (const light of this.lights)
        {
            light.OnValueChanged();
            const data = this._lightDataCopy;
            CopyLightData(data, light.lightData);
            Saturate(data.color, average, light.saturation);
            const profile = light.lightProfile;
            const record = data.AsPerPointLightData(light.boneMatrix, {
                parentBrightness: this._activationStrength, parentScale: 1,
                profileIndex: profile ? profile.GetTextureIndex() + 1 : 0,
                animationTime: parentContext.animationTime ?? device.currentTime ?? 0
            }, parentContext.shadowQuality ?? 0);
            record.owner = this;
            record.lightType = 1;
            record.lightProfile = profile;
            collector.Collect([ record ]);
        }
    }

    GetResources(out = [])
    {
        if (this._primaryTextureParameter) this._primaryTextureParameter.GetResources(out);
        for (const light of this.lights)
        {
            light.OnValueChanged();
            if (light.lightProfile && !out.includes(light.lightProfile)) out.push(light.lightProfile);
        }
        return out;
    }

    /** Set geometry remains unimplemented; the existing EveBanner draws it. */
    GetBatches(mode, accumulator, perObjectData)
    {
        return false;
    }
}
