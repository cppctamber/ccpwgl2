// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/UI/EveSpherePin.{h,cpp,_Blue.cpp}
import { meta } from "utils";
import { vec3, vec4, quat, sph3 } from "math";
import { color as colorReader } from "core/reader/Tw2BlackPropertyReaders";


/**
 * A circle drawn on a sphere - Carbon: "a very basic object that is just a
 * circle on a sphere. It is used in a variety of places, mostly to do with
 * decals on planets".
 *
 * The standalone form of {@link EveChildSpherePin}: same pin, owning its own
 * geometry and effect rather than riding on a parent's mesh. Carbon files it
 * under `Eve/UI` beside the tactical overlay, not under space objects.
 *
 * NOT DRAWN YET. The data model, the transform and the bounds are here and are
 * faithful; what is missing is the index buffer - see {@link RebuildIndices}.
 */
@meta.define("EveSpherePin", true)
export class EveSpherePin extends meta.Model
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.vector3
    translation = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    /**
     * The direction from the sphere's centre to the middle of the pin.
     * @type {vec3}
     */
    @meta.vector3
    centerNormal = vec3.create();

    /**
     * How far the pin extends from its centre, in RADIANS along the surface.
     * @type {Number}
     */
    @meta.float
    pinRadius = 0;

    /**
     * The angular slice of sphere the geometry covers. Carbon: "this is the size
     * used by the geometry and should be set as rarely as possible" - changing
     * it rebuilds the index buffer, while {@link pinRadius} is free.
     * @type {Number}
     */
    @meta.float
    pinMaxRadius = 0.2;

    @meta.float
    pinRotation = 0;

    @meta.color
    pinColor = vec4.fromValues(1, 1, 1, 1);

    /**
     * Carbon: "special alpha value that can be used to show a progress bar".
     * @type {Number}
     */
    @meta.float
    pinAlphaThreshold = 0;

    /**
     * Texture atlas support: xy scale, zw offset. The standalone pin has this
     * where the child hardcodes an identity - a planet's pins share one atlas.
     * @type {vec4}
     */
    @meta.vector4
    uvAtlasScaleOffset = vec4.fromValues(1, 1, 0, 0);

    /**
     * Carbon: "should be the big sphere all the planets share!" - so this
     * resource is shared, and the per-pin part is which of its triangles get
     * indexed, never a copy of the geometry.
     * @type {String}
     */
    @meta.path
    geometryResPath = "";

    @meta.path
    pinEffectResPath = "";

    @meta.struct("Tw2Effect")
    pinEffect = null;

    @meta.boolean
    enablePicking = false;

    /**
     * Carbon: "factor to definitely put pins with identical positions in the
     * correct order" - a tie-break for sorting, not a depth offset.
     * @type {Number}
     */
    @meta.float
    sortValueMultiplier = 0;

    @meta.list("Tw2CurveSet")
    curveSets = [];

    /**
     * @type {sph3}
     * @private
     */
    _boundingSphere = sph3.create();

    /**
     * Set whenever something the index buffer depends on changes. Nothing reads
     * it yet - see {@link RebuildIndices}.
     * @type {Boolean}
     * @private
     */
    _rebuildIndices = true;

    /**
     * Carbon's second spelling of {@link pinColor} - see the note on
     * {@link EveSpherePin.blackReaders}.
     * @returns {vec4}
     */
    get color()
    {
        return this.pinColor;
    }

    /**
     * @param {vec4|Array} value
     */
    set color(value)
    {
        vec4.copy(this.pinColor, value);
    }

    /**
     * @param {Number} dt
     */
    Update(dt)
    {
        for (let i = 0; i < this.curveSets.length; i++)
        {
            this.curveSets[i]?.UpdateDelta?.(dt);
        }

        this.BuildBoundingSphere();
    }

    /**
     * The pin's bounds, which are NOT in world units.
     *
     * Carbon: `m_boundingSphere = Vector4( m_centerNormal, m_pinRadius )`
     * (EveSpherePin.cpp:293-298). A unit-length centre and an angular radius -
     * so this describes the pin's patch on the UNIT sphere, and a consumer
     * wanting world bounds has to scale it by the sphere it is drawn on.
     *
     * Transcribed rather than corrected: it is what Carbon publishes, and a
     * caller comparing against Carbon's numbers needs the same ones.
     * @returns {sph3}
     */
    BuildBoundingSphere()
    {
        return sph3.set(
            this._boundingSphere,
            this.centerNormal[0], this.centerNormal[1], this.centerNormal[2],
            this.pinRadius
        );
    }

    /**
     * @param {sph3} [out]
     * @returns {sph3}
     */
    GetBoundingSphere(out = sph3.create())
    {
        return sph3.copy(out, this._boundingSphere);
    }

    /**
     * The per-pin shader inputs, matching {@link EveChildSpherePin} exactly
     * except for the atlas transform, which is authored here rather than fixed.
     *
     * @param {Object} [out]
     * @returns {Object}
     */
    GetPinPerObjectData(out = {})
    {
        out.pinPosition = vec4.set(
            out.pinPosition || vec4.create(),
            this.centerNormal[0], this.centerNormal[1], this.centerNormal[2],
            this.pinRadius
        );

        out.pinRotation = vec4.set(out.pinRotation || vec4.create(), this.pinRotation, 0, 0, 0);
        out.pinColor = vec4.copy(out.pinColor || vec4.create(), this.pinColor);
        out.pinThreshold = vec4.set(out.pinThreshold || vec4.create(), this.pinAlphaThreshold, 0, 0, 0);

        out.pinRadiusPrecalc = vec4.set(
            out.pinRadiusPrecalc || vec4.create(),
            Math.sin(this.pinRadius), Math.cos(this.pinRadius),
            Math.sin(this.pinRotation), Math.cos(this.pinRotation)
        );

        out.pinUV = vec4.copy(out.pinUV || vec4.create(), this.uvAtlasScaleOffset);

        return out;
    }

    /**
     * NOT IMPLEMENTED, and deliberately left as a named gap rather than a stub
     * that quietly does nothing.
     *
     * Carbon draws a pin by indexing a SUBSET of the shared planet sphere: every
     * triangle within `pinMaxRadius` of `centerNormal`, gathered by
     * `EveSpherePinIndexTree` - a spatial index over the sphere's faces, built
     * once per geometry and shared by every pin on it
     * (EveSpherePin.cpp:124-153, 186-220).
     *
     * That tree is engine-side, not model-side: it holds decoded face data, is
     * not Blue-exposed and is not serialized, which is why the organisation's
     * runtime port classifies it under `dropped/` rather than porting it. Doing
     * it here needs CPU access to the sphere's indices, a way to build and cache
     * one tree per geometry resource, and a per-pin index buffer.
     *
     * Until then a pin carries correct data and correct bounds and draws
     * nothing. {@link EveChildSpherePin} is unaffected - it rides its parent's
     * mesh and needs no index buffer at all.
     */
    @meta.notImplemented
    RebuildIndices()
    {
        this._rebuildIndices = true;
    }

    /**
     * See the note on {@link EveChildSpherePin.blackReaders}: Carbon persists
     * this member under both `pinColor` and `color`
     * (EveSpherePin_Blue.cpp:42-43), and a property the schema does not declare
     * makes the black reader throw rather than skip.
     * @type {Object}
     */
    static blackReaders = {
        color: colorReader
    };

}
