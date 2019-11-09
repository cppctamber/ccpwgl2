import { vec3 } from "global";
import { EveObject } from "./legacy/EveObject";

/**
 * EveShip2
 * TODO: Implement
 * @ccp EveShip2
 *
 * @property {Array.<EveObjectSet>} attachments        -
 * @property {EveBoosterSet2} boosters                 -
 * @property {vec3} boundingSphereCenter               -
 * @property {Number} boundingSphereRadius             -
 * @property {Array.<EveObject>} children              -
 * @property {Array.<EveCustomMask>} customMasks       -
 * @property {Array.<EveSpaceObjectDecal>} decals      -
 * @property {String} dna                              -
 * @property {Array.<EveLocatorSets>} locatorSets      -
 * @property {Array.<EveLocator2>} locators            -
 * @property {Tw2Mesh|Tw2InstancedMesh|Tr2MeshLod} mesh -
 * @property {Curve|CurveAdapter} rotationCurve        -
 * @property {Tr2Effect} shadowEffect                  -
 * @property {vec3} shapeEllipsoidCenter               -
 * @property {vec3} shapeEllipsoidRadius               -
 * @property {Curve|CurveAdapter} translationCurve     -
 */
export class EveShip2 extends EveObject
{

    attachments = [];
    boosters = null;
    boundingSphereCenter = vec3.create();
    boundingSphereRadius = 0;
    children = [];
    customMasks = [];
    decals = [];
    dna = "";
    locatorSets = [];
    locators = [];
    mesh = null;
    rotationCurve = null;
    shadowEffect = null;
    shapeEllipsoidCenter = vec3.create();
    shapeEllipsoidRadius = vec3.create();
    translationCurve = null;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "attachments", r.array ],
            [ "boosters", r.object ],
            [ "boundingSphereCenter", r.vector3 ],
            [ "boundingSphereRadius", r.float ],
            [ "children", r.array ],
            [ "customMasks", r.array ],
            [ "decals", r.array ],
            [ "dna", r.string ],
            [ "locatorSets", r.array ],
            [ "locators", r.array ],
            [ "mesh", r.object ],
            [ "name", r.string ],
            [ "meshLod", r.object ],
            [ "rotationCurve", r.object ],
            [ "shadowEffect", r.object ],
            [ "shapeEllipsoidCenter", r.vector3 ],
            [ "shapeEllipsoidRadius", r.vector3 ],
            [ "translationCurve", r.object ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

    /**
     * Identifies the object is a ship
     * @type {boolean}
     * @private
     */
    static __isShip = true;

}
