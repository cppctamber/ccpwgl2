import {Tw2BaseClass} from "../../class";

/**
 * Tr2ShLightingManager
 *
 * @parameter {Number} primaryIntensity   -
 * @parameter {Number} secondaryIntensity -
 */
export default class Tr2ShLightingManager extends Tw2BaseClass
{

    primaryIntensity = 0;
    secondaryIntensity = 0;

}

Tw2BaseClass.define(Tr2ShLightingManager, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ShLightingManager",
        props: {
            primaryIntensity: Type.NUMBER,
            secondaryIntensity: Type.NUMBER
        }
    };
});

