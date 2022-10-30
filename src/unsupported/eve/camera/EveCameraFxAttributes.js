import { meta } from "utils";

@meta.notImplemented
@meta.type("EveCameraFxAttributes", true)
export class EveCameraFxAttributes extends meta.Model
{

    @meta.list()
    fxAttributes = [];

}
