import { meta, vec3 } from "global";
import { EveObject } from "eve/object/EveObject";
import { Tw2Animation } from "core/model";
import { EveShip2 } from "./EveShip2";


@meta.notImplemented
@meta.ctor("EveStation2")
export class EveStation2 extends EveShip2
{

    @meta.struct("Tw2Animation")
    @meta.isPrivate
    animations = new Tw2Animation();

    @meta.list("EveObjectSet")
    attachments = [];

    @meta.vector3
    boundingSphereCenter = vec3.create();

    @meta.float
    boundingSphereRadius = 0;

    @meta.list("EveObject")
    children = [];

    @meta.list("EveCurveSet")
    curveSets = [];

    @meta.list("EveSpaceObjectDecal")
    decals = [];

    @meta.string
    dna = ""; // custom

    @meta.list("EveChild")
    effectChildren = [];

    @meta.list("TriPointLight")
    lights = [];

    @meta.list("EveLocatorSets")
    locatorSets = [];

    @meta.list("EveLocator2")
    locators = [];

    @meta.struct("Tw2Mesh")
    mesh = null;

    @meta.struct("Tr2MeshLod")
    meshLod = null;

    @meta.struct("Tr2RotationAdapter")
    modelRotationCurve = null;

    @meta.float
    modelScale = 1;

    @meta.list("TriObserverLocal")
    observers = [];

    @meta.struct("Tr2RotationAdapter")
    rotationCurve = null;

    @meta.struct("Tw2Effect")
    shadowEffect = null;

    @meta.struct("Tr2TranslationAdapter")
    translationCurve = null;

}
