import { meta } from "utils";
import { EveChild } from "eve/child";
import { skippedObject, skippedObjectArray } from "core/reader/Tw2BlackPropertyReaders";


@meta.notImplemented
@meta.type("EveChildSmartLightSet")
@meta.define({
    wgl: "EveChildSmartLightSet",
    ccp: true
})
export class EveChildSmartLightSet extends EveChild
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.unknown
    distribution = null;

    @meta.array
    lightGroups = [];

    static blackReaders = {
        distribution: skippedObject,
        lightGroups: skippedObjectArray
    };

}
