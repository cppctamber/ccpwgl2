import { meta } from "utils";
import { GetCandidates, GetOwner } from "./Tr2ActionAudioHelpers";
import { Tw2Action } from "./Tw2Action";


@meta.type("Tr2ActionSetShaderOption")
@meta.ccp.define("Tr2ActionSetShaderOption")
export class Tr2ActionSetShaderOption extends Tw2Action
{
    @meta.string
    key = "";

    @meta.string
    value = "";

    Start(controller, owner)
    {
        owner = GetOwner(controller, owner);
        const candidates = GetCandidates(owner);

        for (let i = 0; i < candidates.length; i++)
        {
            const candidate = candidates[i];
            if (candidate && candidate.SetShaderOption)
            {
                return candidate.SetShaderOption(this.key, this.value) !== false;
            }
        }

        return false;
    }
}
