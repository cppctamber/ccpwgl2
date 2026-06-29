import { meta } from "utils";
import { CallEmitter, FindSoundEmitter, GetOwner } from "./Tr2ActionAudioHelpers";
import { Tw2Action } from "./Tw2Action";


@meta.type("Tr2ActionSetAudioEmitterPrefix")
@meta.ccp.define("Tr2ActionSetAudioEmitterPrefix")
export class Tr2ActionSetAudioEmitterPrefix extends Tw2Action
{
    @meta.string
    emitter = "";

    @meta.string
    prefix = "";

    Start(controller, owner)
    {
        owner = GetOwner(controller, owner);
        const emitter = FindSoundEmitter(owner, this.emitter, controller);
        return CallEmitter(emitter, "SetPrefix", [ this.prefix ]);
    }

    StartWithController(controller)
    {
        return this.Start(controller);
    }
}
