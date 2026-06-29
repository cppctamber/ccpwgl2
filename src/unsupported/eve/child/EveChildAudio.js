import { meta } from "utils";


@meta.notImplemented
@meta.type("EveChildAudio")
@meta.define({
    wgl: "EveChildAudio",
    ccp: true
})
export class EveChildAudio
{
    @meta.string
    name = "";

    @meta.boolean
    mute = false;

    @meta.struct()
    audioEmitter = null;

    get isEffectChild()
    {
        return true;
    }

    UpdateLod()
    {

    }

    ResetLod()
    {

    }

    Update()
    {

    }

    GetResources(out = [])
    {
        return out;
    }

    GetBatches()
    {
        return false;
    }

    SetEmitterName(name)
    {
        this.name = name;
    }

    static __isEffectChild = true;
}
