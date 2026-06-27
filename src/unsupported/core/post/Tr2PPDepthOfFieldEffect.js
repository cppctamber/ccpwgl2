import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2PPDepthOfFieldEffect")
@meta.ccp.define("Tr2PPDepthOfFieldEffect")
export class Tr2PPDepthOfFieldEffect
{
    @meta.float
    focalDistance = 0;

    @meta.float
    focalLength = 0;

    @meta.float
    scale = 0;

}
