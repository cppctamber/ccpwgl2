import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataGenericSwarm
 *
 * @property {Number} formationDistance  -
 * @property {Number} maxDeceleration    -
 * @property {Number} maxDistance0       -
 * @property {Number} separationDistance -
 * @property {Number} wanderDistance     -
 * @property {Number} wanderFluctuation  -
 * @property {Number} wanderRadius       -
 * @property {Number} weightAlign        -
 * @property {Number} weightAnchor       -
 * @property {Number} weightCohesion     -
 * @property {Number} weightDeceleration -
 * @property {Number} weightFormation    -
 * @property {Number} weightSeparation   -
 */
export class EveSOFDataGenericSwarm extends Tw2BaseClass
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

