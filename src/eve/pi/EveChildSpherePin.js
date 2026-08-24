// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/EveChildSpherePin.{h,cpp,_Blue.cpp}
import { meta } from "utils";
import { vec3, vec4 } from "math";
import { EveChildMesh } from "eve/child/EveChildMesh";
import { color as colorReader } from "core/reader/Tw2BlackPropertyReaders";


/**
 * A pin drawn on a sphere - the marker for a planetary-interaction installation,
 * as a CHILD of a space object rather than a standalone one.
 *
 * The shape is not geometry. The mesh is the shared planet sphere, and the pin
 * is cut out of it in the shader: everything within `pinRadius` radians of
 * `centerNormal` is drawn, everything else discarded. That is why the radii are
 * ANGLES rather than distances, and why moving a pin costs nothing.
 *
 * `pinMaxRadius` is the exception and is not the same kind of value. It bounds
 * the slice of sphere the geometry covers, so Carbon calls it "the size used by
 * the geometry" and says it "should be set as rarely as possible" - changing it
 * is a geometry change, while `pinRadius` is free.
 *
 * Extends {@link EveChildMesh}, as Carbon does. An earlier stub here extended
 * `EveChild` and redeclared `mesh` and `minScreenSize` to compensate; both come
 * from the mesh child, and the base is what supplies the transform and batches.
 */
@meta.define("EveChildSpherePin", true)
export class EveChildSpherePin extends EveChildMesh
{

    /**
     * The direction from the sphere's centre to the middle of the pin. A
     * DIRECTION, not a position - the sphere's radius is the mesh's business.
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
     * The angular slice of sphere the geometry covers. Carbon defaults this to
     * 0.2 rather than 0, so a pin that never sets it still has something to be
     * drawn into.
     * @type {Number}
     */
    @meta.float
    pinMaxRadius = 0.2;

    /**
     * Rotation of the pin about its own normal, in radians.
     * @type {Number}
     */
    @meta.float
    pinRotation = 0;

    /**
     * Carbon exposes this member TWICE, as `pinColor` and as `color`
     * (EveChildSpherePin_Blue.cpp:17-18), both writing `m_pinColor`. Authored
     * data may use either spelling, so `color` is an accessor onto this rather
     * than a second field - two fields would let them disagree.
     * @type {vec4}
     */
    @meta.color
    pinColor = vec4.fromValues(1, 1, 1, 1);

    /**
     * Carbon: "special alpha value that can be used to show a progress bar" -
     * the shader discards below it, so sweeping it fills the pin.
     * @type {Number}
     */
    @meta.float
    pinAlphaThreshold = 0;

    @meta.list("Tw2CurveSet")
    curveSets = [];

    /**
     * Carbon's second spelling of {@link pinColor}. Same storage, so setting
     * either is setting both.
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
     * @param {mat4} parentTransform
     * @param {Tw2PerObjectData} perObjectData
     */
    Update(dt, parentTransform, perObjectData)
    {
        super.Update(dt, parentTransform, perObjectData);

        // Carbon drives these from its async update with absolute time; ccpwgl's
        // children drive curve sets by delta, which is what EveChildContainer
        // does, so this follows the sibling rather than the source.
        for (let i = 0; i < this.curveSets.length; i++)
        {
            this.curveSets[i]?.UpdateDelta?.(dt);
        }
    }

    /**
     * Fills the pin's per-object record.
     *
     * Carbon's `EveChildSpherePinPerObjectData` (EveChildSpherePin.h:16-28) is
     * the world matrix followed by six vec4s, uploaded to BOTH stages from one
     * block - the vertex stage cuts the sphere, the pixel stage shades it, and
     * they read the same registers.
     *
     * `pinRadiusPrecalc` is the reason the record has six rather than four:
     * both stages need the sine and cosine of the radius and of the rotation
     * every vertex and every fragment, so Carbon computes them ONCE here rather
     * than four transcendentals per invocation.
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

        // Carbon hardcodes an identity atlas transform on the CHILD, where the
        // standalone EveSpherePin exposes `uvAtlasScaleOffset` and can be
        // atlased. Not an omission here - it is what the child does.
        out.pinUV = vec4.set(out.pinUV || vec4.create(), 1, 1, 0, 0);

        return out;
    }

    /**
     * `color` is Carbon's second name for `pinColor`, and it is PERSISTED
     * (EveChildSpherePin_Blue.cpp:17-18), so authored data may use either.
     *
     * It has to be declared HERE rather than left to the accessor above,
     * because a property the schema does not know is not ignored - the black
     * reader throws `Unknown property "color"` and the whole file fails to
     * load. The reader assigns through `result[name]`, so this lands on the
     * setter and ends up in `pinColor`: one storage, two spellings, no way for
     * them to disagree.
     * @type {Object}
     */
    static blackReaders = {
        color: colorReader
    };

    /**
     * Identifies this as a pin to anything walking children.
     * @type {Boolean}
     */
    static isSpherePin = true;

}
