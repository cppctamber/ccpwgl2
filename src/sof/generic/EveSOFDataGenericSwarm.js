import { meta } from "global";


@meta.type("EveSOFDataGenericShader", true)
export class EveSOFDataGenericSwarm
{

    @meta.black.float
    formationDistance = 0;

    @meta.black.float
    maxDeceleration = 0;

    @meta.black.float
    maxDistance0 = 0;

    @meta.black.float
    separationDistance = 0;

    @meta.black.float
    wanderDistance = 0;

    @meta.black.float
    wanderFluctuation = 0;

    @meta.black.float
    wanderRadius = 0;

    @meta.black.float
    weightAlign = 0;

    @meta.black.float
    weightAnchor = 0;

    @meta.black.float
    weightCohesion = 0;

    @meta.black.float
    weightDeceleration = 0;

    @meta.black.float
    weightFormation = 0;

    @meta.black.float
    weightSeparation = 0;

}
