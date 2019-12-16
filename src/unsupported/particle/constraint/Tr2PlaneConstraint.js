import { meta } from "global";
import { Tw2ParticleConstraint } from "./Tw2ParticleConstraint";


/**
 * Tr2PlaneConstraint
 *
 * @property {Array.<Tw2ParticleAttributeGenerator>} generators -
 * @property {Number} reflectionNoise                        -
 */
@meta.abstract
@meta.notImplemented
@meta.ccp("Tr2PlaneConstraint")
export class Tr2PlaneConstraint extends Tw2ParticleConstraint
{

    @meta.black.list
    generators = [];

    @meta.black.float
    reflectionNoise = 0;

}
