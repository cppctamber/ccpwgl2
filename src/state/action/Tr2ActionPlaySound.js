import { meta } from "utils";
import { CallEmitter, FindAudioTarget, FindSoundEmitter, GetOwner } from "./Tr2ActionAudioHelpers";
import { Tw2Action } from "./Tw2Action";


@meta.type("Tr2ActionPlaySound")
@meta.ccp.define("Tr2ActionPlaySound")
export class Tr2ActionPlaySound extends Tw2Action
{

    @meta.string
    emitter = "";

    @meta.string
    event = "";

    @meta.string
    target = "";

    @meta.boolean
    bypassPrefix = false;

    Start(controller, owner)
    {
        owner = GetOwner(controller, owner);
        const target = FindAudioTarget(owner, this.target, controller);
        const emitter = FindSoundEmitter(target || owner, this.emitter, controller);

        if (CallEmitter(emitter, "SendEvent", [ this.event, this.bypassPrefix ]))
        {
            return true;
        }

        return CallEmitter(emitter, "PlaySound", [ this.event, this.bypassPrefix ]);
    }

    StartWithController(controller)
    {
        return this.Start(controller);
    }
}
