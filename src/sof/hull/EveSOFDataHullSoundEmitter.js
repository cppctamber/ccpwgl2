import { meta } from "utils";
import { vec3, quat } from "math";
import { wstring } from "core/reader/Tw2BlackPropertyReaders";


@meta.type("EveSOFDataHullSoundEmitter")
@meta.define({
    wgl: "EveSOFDataHullSoundEmitter",
    ccp: true
})
export class EveSOFDataHullSoundEmitter extends meta.Model
{

    @meta.string
    name = "";

    @meta.string
    prefix = "";

    @meta.float
    attenuationScalingFactor = 0;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    // Carbon m_prefix is std::wstring: the value indexes the wide string table
    static blackReaders = {
        prefix: wstring
    };

}
