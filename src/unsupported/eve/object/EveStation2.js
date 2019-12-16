import { meta, vec3 } from "global";
import { EveObject } from "eve/object/EveObject";


/**
 * EveStation2
 * TODO: Implement
 * @ccp EveStation2
 *
 * @property {Array.<EveObjectSet>} attachments       -
 * @property {vec3} boundingSphereCenter              -
 * @property {Number} boundingSphereRadius            -
 * @property {Array.<EveObject>} children             -
 * @property {Array.<Tw2CurveSet>} curveSets          -
 * @property {Array.<EveSpaceObjectDecal>} decals     -
 * @property {Array.<EveChild>} effectChildren        -
 * @property {Array.<Tr2PointLight>} lights           -
 * @property {Array.<EveLocatorSets>} locatorSets     -
 * @property {Array.<EveLocator2>} locators           -
 * @property {Tw2Mesh} mesh                           -
 * @property {Tr2MeshLod} meshLod                     -
 * @property {Tr2RotationAdapter} modelRotationCurve  -
 * @property {Number} modelScale                      -
 * @property {Array.<TriObserverLocal>} observers     -
 * @property {Tr2RotationAdapter} rotationCurve       -
 * @property {Tr2Effect} shadowEffect                 -
 * @property {Tr2TranslationAdapter} translationCurve -
 */
@meta.notImplemented
@meta.type("EveStation2", true)
export class EveStation2 extends EveObject
{

    @meta.black.listOf("EveObjectSet")
    attachments = [];

    @meta.black.vector3
    boundingSphereCenter = vec3.create();

    @meta.black.float
    boundingSphereRadius = 0;

    @meta.black.listOf("EveObject")
    children = [];

    @meta.black.listOf("EveCurveSet")
    curveSets = [];

    @meta.black.listOf("EveSpaceObjectDecal")
    decals = [];

    @meta.black.listOf("EveChild")
    effectChildren = [];

    @meta.black.listOf("TriPointLight")
    lights = [];

    @meta.black.listOf("EveLocatorSets")
    locatorSets = [];

    @meta.black.listOf("EveLocator2")
    locators = [];

    @meta.black.objectOf("Tw2Mesh")
    mesh = null;

    @meta.black.objectOf("Tr2MeshLod")
    meshLod = null;

    @meta.black.objectOf("Tr2RotationAdapter")
    modelRotationCurve = null;

    @meta.black.float
    modelScale = 0;

    @meta.black.listOf("TriObserverLocal")
    observers = [];

    @meta.black.objectOf("Tr2RotationAdapter")
    rotationCurve = null;

    @meta.black.objectOf("Tw2Effect")
    shadowEffect = null;

    @meta.black.objectOf("Tr2TranslationAdapter")
    translationCurve = null;

}
