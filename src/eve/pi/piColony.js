// Turns an ESI planetary-interaction colony layout into sphere pins and the
// lines between them.
//
// Glue, not a port: Carbon has no equivalent, because the game client feeds its
// pins from its own session rather than from ESI. The pin and connector classes
// beside this file ARE ports; this only positions them.
//
// FUNCTIONS ONLY. Do not re-export from `./index.js` - that barrel feeds
// `tw2.Register`'s constructor store, which rejects non-class members.
import { vec3 } from "math";


/**
 * How a colony's `latitude` is measured.
 *
 * This is the one thing here that cannot be settled by reading code, and it is
 * worth stating plainly: BOTH conventions produce a plausible colony. Choosing
 * wrong mirrors every pin about the equator, which looks like a correctly built
 * colony on the wrong hemisphere rather than like a bug.
 *
 *   COLATITUDE - measured FROM THE NORTH POLE, so 0 is the pole and PI is the
 *                opposite pole. This is the usual reading of EVE's PI data.
 *   LATITUDE   - measured from the EQUATOR, so -PI/2 is one pole and +PI/2 the
 *                other.
 *
 * {@link DetectLatitudeConvention} decides from the data when there is enough
 * of it, and says so when there is not.
 * @type {Object}
 */
export const LatitudeConvention = Object.freeze({
    COLATITUDE: "colatitude",
    LATITUDE: "latitude"
});

/**
 * Reads a colony's latitudes and reports which convention they are in.
 *
 * ONE observation settles it: a negative latitude is impossible under
 * colatitude, which runs 0..PI. Everything else is inference, so this returns
 * `null` rather than guessing when the sample cannot distinguish them - a
 * colony packed near the equator looks the same either way.
 *
 * @param {Array<Object>} pins - anything carrying `latitude`
 * @returns {String|null} a {@link LatitudeConvention}, or null if undecidable
 */
export function DetectLatitudeConvention(pins)
{
    if (!pins || !pins.length) return null;

    let min = Infinity, max = -Infinity;

    for (const pin of pins)
    {
        const latitude = pin?.latitude;
        if (typeof latitude !== "number" || Number.isNaN(latitude)) continue;
        if (latitude < min) min = latitude;
        if (latitude > max) max = latitude;
    }

    if (min === Infinity) return null;

    // Decisive: colatitude cannot be negative.
    if (min < 0) return LatitudeConvention.LATITUDE;

    // Decisive the other way: true latitude cannot exceed PI/2.
    if (max > Math.PI / 2) return LatitudeConvention.COLATITUDE;

    // Everything in [0, PI/2] fits both. A colony in one quadrant is not
    // evidence, so say nothing.
    return null;
}

/**
 * The unit direction from a planet's centre to a point on its surface.
 *
 * This is exactly what a sphere pin's `centerNormal` is - a DIRECTION, with the
 * planet's radius left to the mesh - so the radius is 1 and no centre is
 * applied.
 *
 * Delegates to `vec3.fromSpherical` rather than doing the trigonometry here, so
 * there is one spherical convention in the codebase and not three.
 *
 * There were briefly two: `sph3.getPointFromLongLat` returned a +Z-up point
 * until 2026-08-25, disagreeing with `vec3.fromSpherical` beside it, so which
 * helper a caller reached for decided where its point landed. Both are EVE
 * space now - pole +Y, longitude from +Z toward +X.
 *
 * Which leaves two conventions unconfirmed rather than one, and both are
 * unconfirmable offline: the polar one (see {@link LatitudeConvention}) and
 * this azimuth. A wrong azimuth spins the whole colony about the pole -
 * internally consistent, so the links still meet the pins.
 *
 * @param {vec3} out
 * @param {Number} latitude - radians
 * @param {Number} longitude - radians
 * @param {String} [convention] - see {@link LatitudeConvention}
 * @returns {vec3} out, unit length
 */
export function PinDirection(out, latitude, longitude, convention = LatitudeConvention.COLATITUDE)
{
    // `vec3.fromSpherical` takes (phi, theta, radius) with phi measured from
    // the +Y pole - which IS colatitude, so the two conventions differ in
    // exactly this line.
    const polar = convention === LatitudeConvention.LATITUDE
        ? Math.PI / 2 - latitude
        : latitude;

    const spherical = PinDirection.spherical;
    spherical[0] = polar;
    spherical[1] = longitude;
    spherical[2] = 1;

    return vec3.fromSpherical(out, spherical);
}

/** Scratch, so a per-pin conversion allocates nothing. */
PinDirection.spherical = vec3.createSpherical();

/**
 * Positions a pin from a colony record.
 *
 * @param {EveSpherePin|EveChildSpherePin} pin
 * @param {Object} record - `{ latitude, longitude }`, radians
 * @param {Object} [options]
 * @param {String} [options.convention]
 * @returns {EveSpherePin|EveChildSpherePin} pin
 */
export function PlacePin(pin, record, options = {})
{
    PinDirection(pin.centerNormal, record.latitude, record.longitude, options.convention);
    return pin;
}

/**
 * Every point a colony occupies, in one flat list.
 *
 * EXTRACTOR HEADS ARE PINS TOO. An extractor is one record whose
 * `extractor_details.heads` carries its own latitude/longitude pairs, and those
 * heads are what is actually spread across the surface - reading only the
 * top-level records draws one marker where there should be a cluster.
 *
 * @param {Object} colony - an ESI colony layout
 * @returns {Array<Object>} `{ id, latitude, longitude, typeId, parentId, isHead }`
 */
export function CollectColonyPoints(colony)
{
    const out = [];
    if (!colony || !colony.pins) return out;

    for (const pin of colony.pins)
    {
        if (!pin) continue;

        out.push({
            id: pin.pin_id,
            latitude: pin.latitude,
            longitude: pin.longitude,
            typeId: pin.type_id,
            parentId: null,
            isHead: false
        });

        const heads = pin.extractor_details?.heads;
        if (!heads) continue;

        for (const head of heads)
        {
            if (!head) continue;

            out.push({
                // A head id is unique only WITHIN its extractor, so it is
                // qualified here. Two extractors both having a head 0 is
                // ordinary, and an unqualified key would collapse them.
                id: `${pin.pin_id}:${head.head_id}`,
                latitude: head.latitude,
                longitude: head.longitude,
                typeId: pin.type_id,
                parentId: pin.pin_id,
                isHead: true
            });
        }
    }

    return out;
}

/**
 * The links of a colony, resolved to positions on the sphere.
 *
 * A link joins two points on a SURFACE, so the line between them belongs on
 * that surface - a great-circle arc about the planet's centre, which is what
 * `EveCurveLineSet.AddSpheredLineCrt` draws. A straight line would cut through
 * the planet, and be hidden by it for any link longer than a short hop.
 *
 * Note this does NOT use {@link EveConnector}: its vocabulary is anchors, orbits
 * and rings - lines between a point and a plane, or around one. None of its
 * eight types is "arc between two surface points", so forcing a link through it
 * would mean misusing a type rather than reusing one.
 *
 * @param {Object} colony
 * @param {Object} [options]
 * @param {String} [options.convention]
 * @param {Number} [options.radius=1] - the planet's radius, in world units
 * @param {vec3} [options.center]
 * @returns {Array<Object>} `{ source, destination, level }`, positions in world units
 */
export function CollectColonyLinks(colony, options = {})
{
    const out = [];
    if (!colony || !colony.links) return out;

    const
        radius = options.radius === undefined ? 1 : options.radius,
        center = options.center || [ 0, 0, 0 ],
        byId = new Map();

    for (const point of CollectColonyPoints(colony))
    {
        // Heads are not link endpoints - links join installations. Keyed on the
        // top-level pins only, so a head id can never resolve one.
        if (!point.isHead) byId.set(point.id, point);
    }

    for (const link of colony.links)
    {
        if (!link) continue;

        const
            source = byId.get(link.source_pin_id),
            destination = byId.get(link.destination_pin_id);

        // A link naming a pin the layout does not contain is dropped rather
        // than drawn to the origin, which would read as a line to the planet's
        // core.
        if (!source || !destination) continue;

        out.push({
            source: SurfacePosition(vec3.create(), source, radius, center, options.convention),
            destination: SurfacePosition(vec3.create(), destination, radius, center, options.convention),
            level: link.link_level
        });
    }

    return out;
}

/**
 * A colony point as a world position rather than a direction.
 *
 * @param {vec3} out
 * @param {Object} point - `{ latitude, longitude }`
 * @param {Number} radius
 * @param {vec3|Array} center
 * @param {String} [convention]
 * @returns {vec3} out
 */
export function SurfacePosition(out, point, radius, center, convention)
{
    PinDirection(out, point.latitude, point.longitude, convention);
    return vec3.scaleAndAdd(out, center, out, radius);
}

/**
 * Draws a colony's links onto a curve line set.
 *
 * @param {EveCurveLineSet} lineSet
 * @param {Object} colony
 * @param {Object} [options]
 * @param {Number} [options.radius=1]
 * @param {vec3} [options.center]
 * @param {String} [options.convention]
 * @param {Number} [options.width=1]
 * @param {vec4} [options.color]
 * @returns {Number} how many lines were added
 */
export function AddColonyLinks(lineSet, colony, options = {})
{
    if (!lineSet) return 0;

    const
        center = options.center || [ 0, 0, 0 ],
        width = options.width === undefined ? 1 : options.width,
        color = options.color || [ 1, 1, 1, 1 ];

    let added = 0;

    for (const link of CollectColonyLinks(colony, options))
    {
        // The planet's centre is the arc's centre, which is what makes the line
        // follow the surface instead of cutting under it.
        lineSet.AddSpheredLineCrt(link.source, link.destination, center, width, color, color);
        added++;
    }

    return added;
}
