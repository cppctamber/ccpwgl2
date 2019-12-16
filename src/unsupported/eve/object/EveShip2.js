import { meta, vec3 } from "global";
import { EveObject } from "eve/object/EveObject";


@meta.notImplemented
@meta.type("EveShip2", true)
export class EveShip2 extends EveObject
{

    @meta.black.listOf("EveObjectSet")
    attachments = [];

    @meta.black.objectOf("EveBoosterSet2")
    boosters = null;

    @meta.black.vector3
    boundingSphereCenter = vec3.create();

    @meta.black.float
    boundingSphereRadius = 0;

    @meta.black.listOf("EveObject")
    children = [];

    @meta.black.listOf("EveCustomMask")
    customMasks = [];

    @meta.black.listOf("EveSpaceObjectDecal")
    decals = [];

    @meta.black.string
    dna = "";

    @meta.black.listOf("EveLocatorSets")
    locatorSets = [];

    @meta.black.listOf("EveLocator2")
    locators = [];

    @meta.black.objectOf([ "Tw2Mesh", "Tw2InstancedMesh", "Tr2MeshLod" ])
    mesh = null;

    @meta.black.objectOf("EveCurve") // Tr2RotationAdapter
    rotationCurve = null;

    @meta.black.objectOf("Tw2Effect")
    shadowEffect = null;

    @meta.black.vector3
    shapeEllipsoidCenter = vec3.create();

    @meta.black.vector3
    shapeEllipsoidRadius = vec3.create();

    @meta.black.objectOf("EveCurve") // Tr2TranslationAdapter
    translationCurve = null;

}
