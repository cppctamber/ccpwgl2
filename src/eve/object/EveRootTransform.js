import {quat, vec3} from "../../global/index";
import {Tw2BaseClass} from "../../global/index";

/**
 * EveRootTransform
 * TODO: Implement
 * @ccp EveRootTransform
 *
 * @property {String} name                       -
 * @property {Number} boundingSphereRadius       -
 * @property {Array.<EveObject>} children        -
 * @property {Array.<TriCurveSet>} curveSets     -
 * @property {Boolean} display                   -
 * @property {Tr2Mesh} mesh                      -
 * @property {Number} modifier                   -
 * @property {Array} observers                   -
 * @property {quat} rotation                     -
 * @property {Tr2CurveConstant} rotationCurve    -
 * @property {vec3} scaling                      -
 * @property {Number} sortValueMultiplier        -
 * @property {vec3} translation                  -
 * @property {Tr2CurveConstant} translationCurve -
 */
export class EveRootTransform extends Tw2BaseClass
{

    name = "";
    boundingSphereRadius = 0;
    children = [];
    curveSets = [];
    display = false;
    mesh = null;
    modifier = 0;
    observers = [];
    rotation = quat.create();
    rotationCurve = null;
    scaling = vec3.fromValues(1, 1, 1);
    sortValueMultiplier = 0;
    translation = vec3.create();
    translationCurve = null;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["boundingSphereRadius", r.float],
            ["children", r.array],
            ["curveSets", r.array],
            ["display", r.boolean],
            ["mesh", r.object],
            ["modifier", r.uint],
            ["name", r.string],
            ["observers", r.array],
            ["position", r.vector3],
            ["rotation", r.vector4],
            ["rotationCurve", r.object],
            ["scaling", r.vector3],
            ["sortValueMultiplier", r.float],
            ["translation", r.vector3],
            ["translationCurve", r.object],
            ["useDistanceBasedScale", r.boolean],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}

