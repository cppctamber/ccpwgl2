import { meta, vec3, vec4, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("Tr2InteriorLightSource", true)
export class Tr2InteriorLightSource extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.color
    color = vec4.create();

    @meta.black.float
    coneAlphaInner = 0;

    @meta.black.float
    coneAlphaOuter = 0;

    @meta.black.vector3
    coneDirection = vec3.create();

    @meta.black.float
    falloff = 0;

    @meta.black.float
    importanceBias = 0;

    @meta.black.float
    importanceScale = 0;

    @meta.black.objectOf("Tr2KelvinColor")
    kelvinColor = null;

    @meta.black.vector3
    position = vec3.create();

    @meta.black.float
    radius = 0;

    @meta.black.boolean
    useKelvinColor = false;

}
