import {EveSOFBaseClass} from "../EveSOFBaseClass";

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
export class EveSOFDataGenericSwarm extends EveSOFBaseClass
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

EveSOFDataGenericSwarm.define(r =>
{
    return {
        type: "EveSOFDataGenericSwarm",
        black: [
            ["formationDistance", r.float],
            ["maxDistance0", r.float],
            ["maxDeceleration", r.float],
            ["separationDistance", r.float],
            ["wanderDistance", r.float],
            ["wanderFluctuation", r.float],
            ["wanderRadius", r.float],
            ["weightAlign", r.float],
            ["weightAnchor", r.float],
            ["weightCohesion", r.float],
            ["weightDeceleration", r.float],
            ["weightFormation", r.float],
            ["weightSeparation", r.float],
        ]
    };
});