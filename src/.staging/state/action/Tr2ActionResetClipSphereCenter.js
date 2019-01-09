import {Tw2BaseClass} from "../../class";

/**
 * Tr2ActionResetClipSphereCenter
 * @implements StateAction
 *
 */
export default class Tr2ActionResetClipSphereCenter extends Tw2BaseClass
{


}

Tw2BaseClass.define(Tr2ActionResetClipSphereCenter, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ActionResetClipSphereCenter",
        category: "StateAction",
        props: {}
    };
});

