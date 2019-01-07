import {vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveMobile
 *
 * @parameter {Array.<EveObjectSet>} attachments    -
 * @parameter {vec3} boundingSphereCenter           -
 * @parameter {Number} boundingSphereRadius         -
 * @parameter {Array.<EveObject>} children          -
 * @parameter {Array.<StateController>} controllers -
 * @parameter {Array.<Tw2CurveSet>} curveSets       -
 * @parameter {Array.<EveObjectSet>} locatorSets    -
 * @parameter {Tw2MeshLod} meshLod                  -
 * @parameter {Array.<Tw2ObserverLocal>} observers  -
 * @parameter {Tw2Effect} shadowEffect              -
 */
export default class EveMobile extends Tw2StagingClass
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

Tw2StagingClass.define(EveMobile, Type =>
{
    return {
        type: "EveMobile",
        props: {
            attachments: [["EveSpriteSet"]],
            boundingSphereCenter: Type.VECTOR3,
            boundingSphereRadius: Type.NUMBER,
            children: [["EveTransform"]],
            controllers: [["Tw2ControllerReference"]],
            curveSets: [["Tw2CurveSet"]],
            locatorSets: [["EveLocatorSets"]],
            meshLod: ["Tw2MeshLod"],
            observers: [["Tw2ObserverLocal"]],
            shadowEffect: ["Tw2Effect"]
        }
    };
});

