import { meta } from "utils";
import { vec2, vec3 } from "math";


@meta.type("EveSOFDataHullPlaneSet")
@meta.define({
    wgl: "EveSOFDataHullPlaneSet",
    ccp: true
})
export class EveSOFDataHullPlaneSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.uint
    atlasSize = 0;

    @meta.vector2
    atlasAspectRatio = vec2.create();

    @meta.list("EveSOFDataHullPlaneSetItem")
    items = [];

    @meta.path
    layer1MapResPath = "";

    @meta.path
    layer2MapResPath = "";

    @meta.path
    maskMapResPath = "";

    @meta.boolean
    skinned = false;

    /**
     * What the plane set is for, which decides whether it shows video.
     *
     * Carbon switches on this to point `ImageMap` at a `dynamic:/` provider
     * (`EveSOF.cpp:996-1005`). The gaps in the numbering are Carbon's own — 1
     * and 4 are not defined.
     * @type {Number}
     */
    @meta.uint
    usage = 0;

    @meta.string
    visibilityGroup = "";

    /**
     * Carbon's `EveSOFDataHullPlaneSet::Usage`, verbatim.
     * @type {Object<String, Number>}
     */
    static Usage = Object.freeze({
        STANDARD: 0,
        SPACE_VIDEO: 2,
        HANGAR_VIDEO: 3,
        HAZE: 5
    });

    /**
     * The `dynamic:/` provider Carbon points `ImageMap` at, per usage.
     *
     * `dynamic:/` is Carbon's own factory scheme, not something borrowed —
     * `IBlueResMan.h:39` calls it "Factories for dynamic:/... res paths", and
     * Carbon ships `dynamic:/gradient_1d/…` through the same mechanism. These
     * two are the video providers; a resource manager is expected to answer
     * them with frames.
     * @type {Object<Number, String>}
     */
    static VideoProvider = Object.freeze({
        2: "dynamic:/inspacevideos",
        3: "dynamic:/hangarvideos"
    });

}
