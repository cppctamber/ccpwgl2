import { meta, quat, vec3 } from "global";
import { EveObject } from "eve/object/EveObject";


/**
 * EveRootTransform
 * TODO: Implement
 * @ccp EveRootTransform
 *
 * @property {String} name                       -
 * @property {Number} boundingSphereRadius       -
 * @property {Array.<EveObject>} children        -
 * @property {Array.<Tw2CurveSet>} curveSets     -
 * @property {Boolean} display                   -
 * @property {Tw2Mesh} mesh                      -
 * @property {Number} modifier                   -
 * @property {Array} observers                   -
 * @property {quat} rotation                     -
 * @property {Tr2CurveConstant} rotationCurve    -
 * @property {vec3} scaling                      -
 * @property {Number} sortValueMultiplier        -
 * @property {vec3} translation                  -
 * @property {Tr2CurveConstant} translationCurve -
 */
@meta.notImplemented
@meta.type("EveRootTransform", true)
export class EveRootTransform extends EveObject
{

    @meta.black.string
    name = "";

    @meta.black.float
    boundingSphereRadius = 0;

    @meta.black.listOf("EveObject")
    children = [];

    @meta.black.listOf("Tw2CurveSet")
    curveSets = [];

    @meta.black.boolean
    display = false;

    @meta.black.objectOf("Tw2Mesh")
    mesh = null;

    @meta.black.uint
    modifier = 0;

    @meta.black.listOf("TriObserverLocal")
    observers = [];

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.objectOf("Tw2Curve") //Tr2CurveConstant, Tr2RotationAdapter
    rotationCurve = null;

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.black.float
    sortValueMultiplier = 0;

    @meta.black.vector3
    translation = vec3.create();

    @meta.black.objectOf("Tw2Curve") //Tr2CurveConstant, Tr2TranslationAdapter
    translationCurve = null;

}

