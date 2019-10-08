import { vec3 } from "../../global";
import { EveObject } from "./legacy/EveObject";

/**
 * EveMobile
 * TODO: Implement
 * @ccp EveMobile
 *
 * @property {String} name                         -
 * @property {Array.<EveObjectSet>} attachments    -
 * @property {vec3} boundingSphereCenter           -
 * @property {Number} boundingSphereRadius         -
 * @property {Array.<EveObject>} children          -
 * @property {Array.<StateController>} controllers -
 * @property {Array.<Tw2CurveSet>} curveSets       -
 * @property {Array.<EveObjectSet>} locatorSets    -
 * @property {Tr2MeshLod} meshLod                  -
 * @property {Array.<TriObserverLocal>} observers  -
 * @property {Tr2Effect} shadowEffect              -
 */
export class EveMobile extends EveObject
{

    name = "";
    attachments = [];
    boundingSphereCenter = vec3.create();
    boundingSphereRadius = 0;
    children = [];
    controllers = [];
    curveSets = [];
    locatorSets = [];
    meshLod = null;
    observers = [];
    shadowEffect = null;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "attachments", r.array ],
            [ "boundingSphereCenter", r.vector3 ],
            [ "boundingSphereRadius", r.float ],
            [ "children", r.array ],
            [ "controllers", r.array ],
            [ "curveSets", r.array ],
            [ "locatorSets", r.array ],
            [ "name", r.string ],
            [ "meshLod", r.object ],
            [ "observers", r.array ],
            [ "shadowEffect", r.object ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
