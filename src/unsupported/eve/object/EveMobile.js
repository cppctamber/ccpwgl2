import { meta } from "utils";
import { vec3 } from "math";
import { EveObject } from "eve/object/EveObject";


@meta.notImplemented
@meta.ctor("EveMobile")
export class EveMobile extends EveObject
{

    @meta.string
    name = "";

    @meta.list("EveObjectSet")
    attachments = [];

    @meta.vector3
    boundingSphereCenter = vec3.create();

    @meta.float
    boundingSphereRadius = 0;

    @meta.list("EveChild")
    children = [];

    @meta.list("EveStateController")
    controllers = [];

    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.list("EveLocatorSets")
    locatorSets = [];

    @meta.struct("Tr2MeshLod")
    meshLod = null;

    @meta.list("TriObserverLocal")
    observers = [];

    @meta.struct("Tw2Effect")
    shadowEffect = null;

}
