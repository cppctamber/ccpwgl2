import { meta } from "utils";
import { vec3, vec4 } from "math";


/**
 * Gamma (2.2) to linear conversion, matches `TriGammaToLinear(const Vector3&)`
 * (carbonengine trinity/trinity/TriUtil.h:164-167).
 * @param {Number[]} rgb
 * @returns {Number[]}
 * @private
 */
function TriGammaToLinear(rgb)
{
    return [ Math.pow(rgb[0], 2.2), Math.pow(rgb[1], 2.2), Math.pow(rgb[2], 2.2) ];
}


/**
 * Tr2InteriorLightSource
 *
 * Source: carbonengine trinity/trinity/Interior/Tr2InteriorLightSource.h/.cpp/_Blue.cpp.
 * A point/spot light for interior (ship-interior) scenes, managed by
 * `Tr2InteriorLightSet` at the `Tr2InteriorScene` level (an entirely
 * separate light-collection path from Tr2LightManager/space-scene lights -
 * see the survey report's LIGHT COLLECTION section).
 *
 * NOTE (drift): `importanceBias`/`importanceScale` below were present in
 * ccpwgl's pre-existing stub but do not correspond to any field in the
 * current carbonengine/carbonenginejs source for this class - they are
 * left in place untouched per the "do not touch black-reader property
 * names" rule, but are flagged here as likely legacy/deprecated schema
 * drift rather than removed.
 */
@meta.notImplemented
@meta.type("Tr2InteriorLightSource")
@meta.ccp.define("Tr2InteriorLightSource")
export class Tr2InteriorLightSource extends meta.Model
{

    @meta.string
    name = "";

    @meta.color
    color = vec4.fromValues(1, 1, 1, 1);

    @meta.float
    coneAlphaInner = 180;

    @meta.float
    coneAlphaOuter = 180;

    @meta.vector3
    coneDirection = vec3.fromValues(0, -1, 0);

    @meta.notImplemented
    @meta.desc("PTriCurveSetVector m_curveSets - curve sets that animate this light's attributes (Tr2InteriorLightSource.h:119). No equivalent wiring implemented yet, see Update().")
    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.float
    falloff = 1;

    @meta.notImplemented
    @meta.desc("Legacy/deprecated schema field - no corresponding member found in current carbonengine/carbonenginejs Tr2InteriorLightSource source. Left in place; do not remove (see class doc).")
    @meta.float
    importanceBias = 0;

    @meta.notImplemented
    @meta.desc("Legacy/deprecated schema field - no corresponding member found in current carbonengine/carbonenginejs Tr2InteriorLightSource source. Left in place; do not remove (see class doc).")
    @meta.float
    importanceScale = 0;

    @meta.struct("Tr2KelvinColor")
    kelvinColor = null;

    @meta.vector3
    position = vec3.create();

    @meta.notImplemented
    @meta.boolean
    primaryLighting = true;

    @meta.float
    radius = 1;

    @meta.notImplemented
    @meta.float
    specularIntensity = 1;

    @meta.boolean
    useKelvinColor = false;

    /**
     * World-space axis-aligned bounding box, rebuilt by `RebuildBoundingBox()`.
     * Matches `m_worldBoundingBox` (Tr2InteriorLightSource.h:96).
     * @private
     */
    _worldBoundingBox = { min: vec3.create(), max: vec3.create() };

    /**
     * Rebuilds the world-space AABB from `position`/`radius`
     *
     * Matches the bounding-box recompute performed in `Initialize()` and
     * `OnModified()` (Tr2InteriorLightSource.cpp:59-63, 77-92).
     */
    RebuildBoundingBox()
    {
        vec3.set(this._worldBoundingBox.min,
            this.position[0] - this.radius, this.position[1] - this.radius, this.position[2] - this.radius);
        vec3.set(this._worldBoundingBox.max,
            this.position[0] + this.radius, this.position[1] + this.radius, this.position[2] + this.radius);
    }

    /**
     * Initializes the light, rebuilding its world-space bounding box
     *
     * Matches `Tr2InteriorLightSource::Initialize` (Tr2InteriorLightSource.cpp:59-63)
     * @returns {Boolean} always true
     */
    Initialize()
    {
        this.RebuildBoundingBox();
        return true;
    }

    /**
     * Returns true if this light behaves as a spotlight
     *
     * Matches `Tr2InteriorLightSource::IsSpotLight` (Tr2InteriorLightSource.h:87-90):
     * `coneAlphaOuter < 89` degrees.
     * @returns {Boolean}
     */
    IsSpotLight()
    {
        return this.coneAlphaOuter < 89;
    }

    /**
     * Tests this light's world bounding box against a view frustum
     *
     * Matches `Tr2InteriorLightSource::IsInFrustum` (Tr2InteriorLightSource.cpp:154-162).
     * TODO: ccpwgl's frustum class at this layer (interior scenes) and its
     * exact box-test method name are unconfirmed - if/when interior scenes
     * are wired up, replace the `IsBoxVisible` duck-type check below with
     * the correct call.
     * @param {*} frustum an object exposing `IsBoxVisible(min, max)`, if available
     * @returns {Boolean}
     */
    IsInFrustum(frustum)
    {
        if (!this.primaryLighting) return false;
        if (frustum && typeof frustum.IsBoxVisible === "function")
        {
            return frustum.IsBoxVisible(this._worldBoundingBox.min, this._worldBoundingBox.max);
        }
        return true;
    }

    /**
     * Populates per-object light data for the interior lighting shader
     *
     * Matches `Tr2InteriorLightSource::PopulateLightData` (Tr2InteriorLightSource.cpp:100-138).
     * Non-spotlights force `outerAngle`/`innerAngle` to 360 degrees (full
     * sphere); the inner angle is clamped so it never exceeds
     * `outerAngle - 1` degree.
     * @returns {{position: vec3, radius: Number, color: Number[], pointLightFalloff: Number, shadow0Influence: Number, shadow1Influence: Number, coneCosAlphaOuter: Number, coneCosAlphaInner: Number, spotDirection: vec3}}
     */
    PopulateLightData()
    {
        const radius = Math.max(this.radius, 0);

        let rgb;
        if (this.useKelvinColor && this.kelvinColor)
        {
            const kelvinRGB = this.kelvinColor.AsRGB();
            rgb = [ kelvinRGB[0], kelvinRGB[1], kelvinRGB[2] ];
        }
        else
        {
            rgb = [ this.color[0], this.color[1], this.color[2] ];
        }

        const color = TriGammaToLinear(rgb);

        let innerAngle = this.coneAlphaInner;
        let outerAngle = this.coneAlphaOuter;
        if (innerAngle + 1 > outerAngle)
        {
            innerAngle = outerAngle - 1;
        }
        if (!this.IsSpotLight())
        {
            outerAngle = innerAngle = 360;
        }

        const spotDirection = vec3.create();
        vec3.normalize(spotDirection, this.coneDirection);

        return {
            position: vec3.clone(this.position),
            radius,
            color,
            pointLightFalloff: this.falloff,
            shadow0Influence: 0,
            shadow1Influence: 0,
            coneCosAlphaOuter: Math.cos(outerAngle * Math.PI / 180),
            coneCosAlphaInner: Math.cos(innerAngle * Math.PI / 180),
            spotDirection
        };
    }

    /**
     * Per-frame update - advances this light's curve sets
     *
     * Matches `Tr2InteriorLightSource::Update` (Tr2InteriorLightSource.cpp:146-152).
     * @param {Number} dt
     */
    Update(dt)
    {
        for (let i = 0; i < this.curveSets.length; i++)
        {
            if (typeof this.curveSets[i].Update === "function")
            {
                this.curveSets[i].Update(dt);
            }
        }
    }

    /**
     * TODO: port `Tr2InteriorLightSource::GetDebugOptions`/`RenderDebugInfo`
     * (Tr2InteriorLightSource.cpp:164-185) - ccpwgl has no equivalent debug
     * renderer for interior scenes yet, so these are intentional no-ops.
     */
    GetDebugOptions()
    {
        // Intentional no-op - see TODO above.
    }

    RenderDebugInfo()
    {
        // Intentional no-op - see TODO above.
    }

}
