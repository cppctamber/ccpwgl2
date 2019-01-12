import {vec3} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EveMobile
 *
 * @property {Array.<EveObjectSet>} attachments    -
 * @property {vec3} boundingSphereCenter           -
 * @property {Number} boundingSphereRadius         -
 * @property {Array.<EveObject>} children          -
 * @property {Array.<StateController>} controllers -
 * @property {Array.<TriCurveSet>} curveSets       -
 * @property {Array.<EveObjectSet>} locatorSets    -
 * @property {Tr2MeshLod} meshLod                  -
 * @property {Array.<TriObserverLocal>} observers  -
 * @property {Tr2Effect} shadowEffect              -
 */
export default class EveMobile extends Tw2BaseClass
{

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

}

Tw2BaseClass.define(EveMobile, Type =>
{
    return {
        isStaging: true,
        type: "EveMobile",
        props: {
            attachments: [["EveSpriteSet"]],
            boundingSphereCenter: Type.VECTOR3,
            boundingSphereRadius: Type.NUMBER,
            children: [["EveTransform"]],
            controllers: [["Tr2ControllerReference"]],
            curveSets: [["TriCurveSet"]],
            locatorSets: [["EveLocatorSets"]],
            meshLod: ["Tr2MeshLod"],
            observers: [["TriObserverLocal"]],
            shadowEffect: ["Tr2Effect"]
        }
    };
});

