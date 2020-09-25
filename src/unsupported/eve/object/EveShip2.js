import { meta, vec3 } from "global";
import { EveObject } from "eve/object/EveObject";


@meta.notImplemented
@meta.ctor("EveShip2")
export class EveShip2 extends EveObject
{

    @meta.list("EveObjectSet")
    attachments = [];

    @meta.struct("EveBoosterSet2")
    boosters = null;

    @meta.vector3
    boundingSphereCenter = vec3.create();

    @meta.float
    boundingSphereRadius = 0;

    @meta.list("EveObject")
    children = [];

    @meta.list("EveCustomMask")
    customMasks = [];

    @meta.list("EveSpaceObjectDecal")
    decals = [];

    @meta.string
    dna = "";

    @meta.list("EveLocatorSets")
    locatorSets = [];

    @meta.list("EveLocator2")
    locators = [];

    @meta.struct("Tw2Mesh", "Tw2InstancedMesh", "Tr2MeshLod")
    mesh = null;

    @meta.struct("EveCurve") // Tr2RotationAdapter
    rotationCurve = null;

    @meta.struct("Tw2Effect")
    shadowEffect = null;

    @meta.vector3
    shapeEllipsoidCenter = vec3.create();

    @meta.vector3
    shapeEllipsoidRadius = vec3.create();

    @meta.struct("EveCurve") // Tr2TranslationAdapter
    translationCurve = null;

}
