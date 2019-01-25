import {vec3} from "../../global";
import {Tw2ParticleForce} from "./Tw2ParticleForce";
import {ErrFeatureNotImplemented} from "../../core";

/**
 * Tr2ParticleVortexForce
 * Todo: Implement
 * @ccp Tr2ParticleVortexForce
 *
 * @property {vec3} axis        -
 * @property {Number} magnitude -
 * @property {vec3} position    -
 */
export class Tr2ParticleVortexForce extends Tw2ParticleForce
{

    axis = vec3.create();
    magnitude = 0;
    position = vec3.create();

    /**
     * Applies force
     * @param {Tw2ParticleElement} position - Position
     * @param {Tw2ParticleElement} velocity - Velocity
     * @param {Tw2ParticleElement} force    - force
     * @param {Number} [dt]                 - unused
     * @param {Number} [mass]               - unused
     */
    ApplyForce(position, velocity, force, dt, mass)
    {
        // Todo: Implement ApplyForce
    }

    /**
     * Per frame update
     * @param {Number} dt
     */
    Update(dt)
    {
        // Todo: Implement Update
    }

}

Tw2ParticleForce.define(Tr2ParticleVortexForce, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ParticleVortexForce",
        props: {
            axis: Type.VECTOR3,
            magnitude: Type.NUMBER,
            position: Type.TR_TRANSLATION
        }
    };
});

