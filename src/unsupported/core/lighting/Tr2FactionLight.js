import { meta } from "utils";
import { mat4, vec3, vec4, quat } from "math";
import { ComposeNoiseBrightness, Saturate, CEWG_FLAG_ENABLED } from "./CewgLightMath";


/**
 * Generated Carbon/Blue class stub for Tr2FactionLight.
 *
 * Source schema: lights/Tr2FactionLight.json
 * Source: carbonengine trinity/trinity/Lights/Tr2FactionLight.h/.cpp/_Blue.cpp.
 * A Tr2Light (see Tr2PointLight.js for why the shared LightData property set
 * is declared flatly here rather than inherited - ccpwgl has no Tr2Light
 * base class file) that behaves as either a point or spot light depending
 * on `isSpotlight`, and whose color is driven by a faction color palette
 * inherited from its owning object (`SetInheritProperties`) rather than set
 * directly.
 * @property {null} position - Carbon type: LightData; member: m_lightData.position
 * @property {null} rotation - Carbon type: LightData; member: m_lightData.rotation
 * @property {null} boneIndex - Carbon type: LightData; member: m_lightData.boneIndex
 * @property {null} brightness - Carbon type: LightData; member: m_lightData.brightness
 * @property {null} castsShadows - Carbon type: LightData; member: m_lightData.castsShadows
 * @property {number} factionColor - Carbon type: int; member: m_selectedColor
 * @property {null} flags - Carbon type: LightData; member: m_lightData.flags
 * @property {null} innerAngle - Carbon type: LightData; member: m_lightData.innerAngle
 * @property {null} innerRadius - Carbon type: LightData; member: m_lightData.innerRadius
 * @property {boolean} isSpotlight - Carbon type: bool; member: m_isSpotlight
 * @property {null} isVolumetric - Carbon type: LightData; member: m_lightData.isVolumetric
 * @property {null} lightProfile - Carbon type: Tr2LightProfileResPtr; member: m_lightProfile
 * @property {string} lightProfilePath - Carbon type: std::wstring; member: m_lightProfilePath
 * @property {string} name - Carbon type: std::string; member: m_name
 * @property {null} noiseAmplitude - Carbon type: LightData; member: m_lightData.noiseAmplitude
 * @property {null} noiseFrequency - Carbon type: LightData; member: m_lightData.noiseFrequency
 * @property {null} noiseOctaves - Carbon type: LightData; member: m_lightData.noiseOctaves
 * @property {null} outerAngle - Carbon type: LightData; member: m_lightData.outerAngle
 * @property {null} radius - Carbon type: LightData; member: m_lightData.radius
 * @property {number} saturation - Carbon type: float; member: m_saturation
 */
@meta.notImplemented
@meta.type("Tr2FactionLight")
@meta.ccp.define("Tr2FactionLight")
export class Tr2FactionLight
{
    @meta.vector3
    position = vec3.create();

    @meta.rotation
    rotation = quat.create();

    @meta.int32
    boneIndex = -1;

    @meta.float
    brightness = 1;

    // NOTE (drift): Carbon's castsShadows is the PerLightShadowSetting enum
    // (0=DISABLED, 1=ENABLED_ONLY_ON_HIGH_QUALITY, 2=ALWAYS_ENABLED,
    // Tr2Light.h:20-25). The decorator type below is the black WIRE format
    // ccpwgl's pre-existing generated stub was already using (black readers
    // dispatch on decorator type) and must not be changed without
    // re-verifying against real .black data.
    @meta.notImplemented
    @meta.boolean
    castsShadows = null;

    @meta.int32
    factionColor = -1;

    // NOTE (drift): Carbon's flags is a uint16 bitmask (Tr2LightManager.h:100-105).
    // The pre-existing generated stub deliberately left this undecorated
    // (no black reader registered) - kept as-is, see castsShadows note.
    flags = null;

    @meta.float
    innerAngle = 0;

    @meta.float
    innerRadius = 0;

    @meta.boolean
    isSpotlight = false;

    @meta.notImplemented
    @meta.boolean
    isVolumetric = false;

    @meta.notImplemented
    @meta.desc("Tr2LightProfileResPtr - resolved from lightProfilePath. ccpwgl has no Tr2LightProfileRes resource class yet (carbonengine Resources/Tr2LightProfileRes.h). Read-only in Carbon (Be::READ).")
    @meta.struct()
    lightProfile = null;

    @meta.path
    lightProfilePath = "";

    @meta.string
    name = "";

    @meta.float
    noiseAmplitude = 0;

    @meta.float
    noiseFrequency = 1;

    // NOTE (drift): Carbon type is uint32_t (carbonenginejs: num.uint32) but
    // the pre-existing ccpwgl stub read this as float - decorator kept as
    // the observed wire format (see castsShadows note above).
    @meta.float
    noiseOctaves = 1;

    @meta.float
    outerAngle = 0;

    @meta.float
    radius = 0;

    @meta.float
    saturation = 1;

    /**
     * World-space position, updated by Update()
     * @private
     */
    _worldPosition = vec3.create();

    /**
     * Seconds elapsed since construction, used as the noise time base
     * (Carbon: `BeOS->GetCurrentFrameTime() - m_startTime`, Tr2Light.cpp:45)
     * @private
     */
    _elapsed = 0;

    /**
     * Faction color palette inherited from the owning object, indexed by
     * `factionColor`. Carbon: `const Color* m_parentColorSet` (a raw pointer
     * into the owner's SOF color set), set via `SetInheritProperties`.
     * @type {Array<Number[]>|null}
     * @private
     */
    _parentColorSet = null;

    /**
     * Current light color (`m_lightData.color`), derived from the faction
     * palette by `SetLightColorFromFactionColor` - NOT independently
     * settable/persisted. Carbon does not expose "color" to Blue for this
     * class at all (only the read-only "selectedColor" property, see
     * `GetSelectedColor`); this mirrors that by keeping it a plain
     * (non-`@meta`) field rather than a black-reader property.
     * @private
     */
    _color = vec4.fromValues(0, 0, 0, 1);

    /**
     * Per-frame update - see Tr2PointLight.Update for the reproduced Carbon logic
     * @param {Number} dt
     * @param {mat4} parentMatrix
     * @param {Float4x3[]|mat4[]} [bones]
     */
    Update(dt, parentMatrix, bones)
    {
        this._elapsed += dt || 0;

        let worldMatrix = parentMatrix;
        if (bones && this.boneIndex >= 0 && this.boneIndex < bones.length)
        {
            worldMatrix = mat4.multiply(mat4.create(), bones[this.boneIndex], parentMatrix);
        }

        vec3.transformMat4(this._worldPosition, this.position, worldMatrix);
    }

    /**
     * Composes this light's current brightness - see Tr2PointLight.GetComposedBrightness
     * @param {Number} [parentBrightness=1]
     * @returns {Number}
     */
    GetComposedBrightness(parentBrightness = 1)
    {
        return ComposeNoiseBrightness(
            this.brightness, parentBrightness,
            this.noiseAmplitude, this.noiseFrequency, this.noiseOctaves,
            this._elapsed
        );
    }

    /**
     * Gets the light profile's texture array index, or 0 if none is bound - see Tr2PointLight.GetLightProfileIndex
     * @returns {Number}
     */
    GetLightProfileIndex()
    {
        return this.lightProfile && typeof this.lightProfile.GetTextureIndex === "function"
            ? this.lightProfile.GetTextureIndex() + 1
            : 0;
    }

    /**
     * Produces the fields for a CewgLightList Buffer B entry - see
     * Tr2PointLight.GetCewgLightData for the field-mapping rationale.
     * `isSpotlight` mirrors Carbon's dispatch between AsPerPointLightData
     * and AsPerSpotLightData (Tr2FactionLight.cpp:14, Tr2Light.cpp:139-148),
     * but (as documented on Tr2SpotLight.GetCewgLightData) the CEWG struct
     * has no confirmed cone-angle/direction packing, so both branches
     * currently return the same point-light-shaped fields.
     * @param {Object} [options]
     * @param {Number} [options.parentBrightness=1]
     * @param {Number} [options.parentScale=1]
     * @returns {{position: Number[], radius: Number, color: Number[], flags: Number, params: Number[]}}
     */
    GetCewgLightData(options = {})
    {
        const parentBrightness = options.parentBrightness !== undefined ? options.parentBrightness : 1;
        const parentScale = options.parentScale !== undefined ? options.parentScale : 1;

        const brightness = this.GetComposedBrightness(parentBrightness);
        const radius = this.radius * parentScale;
        const enabled = radius > 0 && brightness > 0;

        return {
            position: [ this._worldPosition[0], this._worldPosition[1], this._worldPosition[2] ],
            radius,
            color: [ this._color[0] * brightness, this._color[1] * brightness, this._color[2] * brightness ],
            flags: enabled ? CEWG_FLAG_ENABLED : 0,
            params: [ this.innerRadius * parentScale, 0, 0, 0 ]
        };
    }

    /**
     * Recolors this light from its inherited faction color palette
     *
     * Matches `Tr2FactionLight::SetLightColorFromFactionColor`
     * (Tr2FactionLight.cpp:37-48): `color = Saturate(parentColorSet[factionColor], saturation)`,
     * only if a palette is bound and `factionColor` is a valid index into it
     * (Carbon bounds-checks against `SOFDataFactionColorChooser::TYPE_MAX`;
     * this checks against the bound palette's own length instead, since
     * ccpwgl has no equivalent enum-max constant).
     */
    SetLightColorFromFactionColor()
    {
        if (!this._parentColorSet) return;

        if (this.factionColor >= 0 && this.factionColor < this._parentColorSet.length)
        {
            Saturate(this._parentColorSet[this.factionColor], this.saturation, this._color);
        }
    }

    /**
     * Binds (or re-binds) the faction color palette this light inherits its color from
     *
     * Matches `Tr2FactionLight::SetInheritProperties` (Tr2FactionLight.cpp:50-57).
     * Carbon only updates the bound palette (and recolors) when `colorSet`
     * is non-null - a null/undefined `colorSet` is a deliberate no-op that
     * keeps whatever palette was bound previously.
     * @param {Array<Number[]>} colorSet faction color palette, indexed by `factionColor`
     */
    SetInheritProperties(colorSet)
    {
        if (colorSet)
        {
            this._parentColorSet = colorSet;
            this.SetLightColorFromFactionColor();
        }
    }

    /**
     * Gets this light's current color
     *
     * Matches `Tr2FactionLight::GetSelectedColor` (Tr2FactionLight.cpp:59-62),
     * which simply returns `m_lightData.color`.
     * @returns {vec4}
     */
    GetSelectedColor()
    {
        return this._color;
    }

    /**
     * Change notification hook
     *
     * Carbon's `OnModified(Be::Var*)` (Tr2FactionLight.cpp:17-35) reacts to
     * Blue property-change notifications for `isSpotlight`/`factionColor`/
     * `saturation` (recoloring from the faction palette, or flipping
     * `m_type` between POINT_LIGHT/SPOT_LIGHT). ccpwgl's meta system has no
     * per-property change-notify hook wired up to this class yet, so this
     * is reinterpreted as an explicit call: pass the property name that was
     * just changed (e.g. after `light.factionColor = x`, call
     * `light.OnModified("factionColor")`) rather than a live Be::Var.
     * @param {String} propertyName
     */
    OnModified(propertyName)
    {
        if (propertyName === "factionColor" || propertyName === "saturation")
        {
            this.SetLightColorFromFactionColor();
        }
    }

    /**
     * TODO: port `Tr2FactionLight::RenderDebugInfo` (Tr2FactionLight.cpp:64-102).
     * Draws a debug sphere (point light) or cone (spot light) via
     * `ITr2DebugRenderer2`/`Tr2DebugColor` - ccpwgl's "unsupported" tree has
     * no equivalent debug-rendering interface yet, so this is intentionally
     * a no-op rather than a guess at one.
     */
    RenderDebugInfo()
    {
        // Intentional no-op - see TODO above.
    }

}
