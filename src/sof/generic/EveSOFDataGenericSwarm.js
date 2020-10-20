import { meta } from "utils";


@meta.type("EveSOFDataGenericShader")
export class EveSOFDataGenericSwarm
{

    @meta.float
    formationDistance = 0;

    @meta.float
    maxDeceleration = 0;

    @meta.float
    maxDistance0 = 0;

    @meta.float
    separationDistance = 0;

    @meta.float
    wanderDistance = 0;

    @meta.float
    wanderFluctuation = 0;

    @meta.float
    wanderRadius = 0;

    @meta.float
    weightAlign = 0;

    @meta.float
    weightAnchor = 0;

    @meta.float
    weightCohesion = 0;

    @meta.float
    weightDeceleration = 0;

    @meta.float
    weightFormation = 0;

    @meta.float
    weightSeparation = 0;

}
