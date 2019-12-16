import { meta, vec3 } from "global";
import { EveObject } from "eve/object/EveObject";


@meta.notImplemented
@meta.type("EveMobile", true)
export class EveMobile extends EveObject
{

    @meta.black.string
    name = "";

    @meta.black.listOf("EveObjectSet")
    attachments = [];

    @meta.black.vector3
    boundingSphereCenter = vec3.create();

    @meta.black.float
    boundingSphereRadius = 0;

    @meta.black.listOf("EveChild")
    children = [];

    @meta.black.listOf("EveStateController")
    controllers = [];

    @meta.black.listOf("Tw2CurveSet")
    curveSets = [];

    @meta.black.listOf("EveLocatorSets")
    locatorSets = [];

    @meta.black.objectOf("Tr2MeshLod")
    meshLod = null;

    @meta.black.listOf("TriObserverLocal")
    observers = [];

    @meta.black.objectOf("Tw2Effect")
    shadowEffect = null;

}
