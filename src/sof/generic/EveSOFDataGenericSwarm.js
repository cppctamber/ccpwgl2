import { meta } from "utils";


@meta.type("EveSOFDataGenericSwarm")
@meta.define({
    wgl: "EveSOFDataGenericSwarm",
    ccp: true
})
export class EveSOFDataGenericSwarm extends meta.Model
{

    @meta.float
    agility = 2;

    @meta.float
    anchorRadius0 = 75;

    @meta.float
    anchorRadius1 = 250;

    @meta.float
    formationDistance = 50;

    @meta.float
    mass = 1;

    @meta.float
    maxTime = 0.2;

    @meta.float
    maxDeceleration = 200;

    @meta.float
    maxDistance0 = 500;

    @meta.float
    maxDistance1 = 125;

    @meta.float
    separationDistance = 250;

    @meta.float
    speed0 = 700;

    @meta.float
    speed1 = 1000;

    @meta.float
    speedMinimum = 10;

    @meta.float
    speedMultiplier = 1.1;

    @meta.float
    timeMultiplier = 1;

    @meta.float
    wanderDistance = 100;

    @meta.float
    wanderFluctuation = 0.05;

    @meta.float
    wanderRadius = 80;

    @meta.float
    weightAlign = 50;

    @meta.float
    weightAnchor = 0.5;

    @meta.float
    weightCohesion = 0.1;

    @meta.float
    weightDeceleration = 0.1;

    @meta.float
    weightFormation = 1;

    @meta.float
    weightSeparation = 0.1;

    @meta.float
    weightWander = 0.33;

}
