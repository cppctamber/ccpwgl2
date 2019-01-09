import {vec3} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveMobile
 *
 * @parameter {Array.<EveObjectSet>} attachments    -
 * @parameter {vec3} boundingSphereCenter           -
 * @parameter {Number} boundingSphereRadius         -
 * @parameter {Array.<EveObject>} children          -
 * @parameter {Array.<StateController>} controllers -
 * @parameter {Array.<TriCurveSet>} curveSets       -
 * @parameter {Array.<EveObjectSet>} locatorSets    -
 * @parameter {Tr2MeshLod} meshLod                  -
 * @parameter {Array.<TriObserverLocal>} observers  -
 * @parameter {Tr2Effect} shadowEffect              -
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

