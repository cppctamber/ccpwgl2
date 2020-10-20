import { meta } from "utils";
import { vec3, vec4 } from "math";


@meta.notImplemented
@meta.type("Tr2InteriorLightSource")
export class Tr2InteriorLightSource extends meta.Model
{

    @meta.string
    name = "";

    @meta.color
    color = vec4.create();

    @meta.float
    coneAlphaInner = 0;

    @meta.float
    coneAlphaOuter = 0;

    @meta.vector3
    coneDirection = vec3.create();

    @meta.float
    falloff = 0;

    @meta.float
    importanceBias = 0;

    @meta.float
    importanceScale = 0;

    @meta.struct("Tr2KelvinColor")
    kelvinColor = null;

    @meta.vector3
    position = vec3.create();

    @meta.float
    radius = 0;

    @meta.boolean
    useKelvinColor = false;

}
