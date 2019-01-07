import {Tw2StagingClass} from "../../class";

/**
 * Tw2ShLightingManager
 * @ccp Tr2ShLightingManager
 *
 * @parameter {Number} primaryIntensity   -
 * @parameter {Number} secondaryIntensity -
 */
export default class Tw2ShLightingManager extends Tw2StagingClass
{

    primaryIntensity = 0;
    secondaryIntensity = 0;

}

Tw2StagingClass.define(Tw2ShLightingManager, Type =>
{
    return {
        type: "Tw2ShLightingManager",
        props: {
            primaryIntensity: Type.NUMBER,
            secondaryIntensity: Type.NUMBER
        }
    };
});

