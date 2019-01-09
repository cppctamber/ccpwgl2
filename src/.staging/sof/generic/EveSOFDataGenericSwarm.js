import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataGenericSwarm
 *
 * @parameter {Number} formationDistance  -
 * @parameter {Number} maxDeceleration    -
 * @parameter {Number} maxDistance0       -
 * @parameter {Number} separationDistance -
 * @parameter {Number} wanderDistance     -
 * @parameter {Number} wanderFluctuation  -
 * @parameter {Number} wanderRadius       -
 * @parameter {Number} weightAlign        -
 * @parameter {Number} weightAnchor       -
 * @parameter {Number} weightCohesion     -
 * @parameter {Number} weightDeceleration -
 * @parameter {Number} weightFormation    -
 * @parameter {Number} weightSeparation   -
 */
export default class EveSOFDataGenericSwarm extends Tw2BaseClass
{

    formationDistance = 0;
    maxDeceleration = 0;
    maxDistance0 = 0;
    separationDistance = 0;
    wanderDistance = 0;
    wanderFluctuation = 0;
    wanderRadius = 0;
    weightAlign = 0;
    weightAnchor = 0;
    weightCohesion = 0;
    weightDeceleration = 0;
    weightFormation = 0;
    weightSeparation = 0;

}

Tw2BaseClass.define(EveSOFDataGenericSwarm, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataGenericSwarm",
        props: {
            formationDistance: Type.NUMBER,
            maxDeceleration: Type.NUMBER,
            maxDistance0: Type.NUMBER,
            separationDistance: Type.NUMBER,
            wanderDistance: Type.NUMBER,
            wanderFluctuation: Type.NUMBER,
            wanderRadius: Type.NUMBER,
            weightAlign: Type.NUMBER,
            weightAnchor: Type.NUMBER,
            weightCohesion: Type.NUMBER,
            weightDeceleration: Type.NUMBER,
            weightFormation: Type.NUMBER,
            weightSeparation: Type.NUMBER
        }
    };
});

