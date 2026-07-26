import { meta } from "utils";
import { wstring } from "core/reader/Tw2BlackPropertyReaders";
import { CallEmitter, FindSoundEmitter, GetOwner } from "./Tr2ActionAudioHelpers";
import { Tw2Action } from "./Tw2Action";


@meta.type("Tr2ActionSetAudioSwitch")
@meta.ccp.define("Tr2ActionSetAudioSwitch")
export class Tr2ActionSetAudioSwitch extends Tw2Action
{
    @meta.string
    emitter = "";

    @meta.string
    switchGroup = "";

    @meta.string
    switchState = "";

    // Carbon m_switchGroup/m_switchState are std::wstring
    static blackReaders = {
        switchGroup: wstring,
        switchState: wstring
    };

    Start(controller, owner)
    {
        owner = GetOwner(controller, owner);
        const emitter = FindSoundEmitter(owner, this.emitter, controller);
        return CallEmitter(emitter, "SetSwitch", [ this.switchGroup, this.switchState ]);
    }

    StartWithController(controller)
    {
        return this.Start(controller);
    }
}
