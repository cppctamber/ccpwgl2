import * as r from "../Tw2BlackClassReaders";

export function tri(map)
{
    map.set("TriColorSequencer", new Map([
        ["functions", r.array],
        ["name", r.string],
        ["value", r.vector4]
    ]));

    map.set("TriCurveSet", new Map([
        ["bindings", r.array],
        ["curves", r.array],
        ["name", r.string],
        ["playOnLoad", r.boolean],
        ["ranges", r.array],
        ["scale", r.float],
        ["useSimTimeRebase", r.boolean]
    ]));

    map.set("TriEventCurve", new Map([
        ["extrapolation", r.uint],
        ["name", r.string],
        ["keys", r.array],
        ["value", r.ushort]
    ]));

    map.set("TriEventKey", new Map([
        ["time", r.float],
        ["value", r.ushort]
    ]));

    map.set("TriFloat", new Map([
        ["value", r.float]
    ]));

    map.set("TriGeometryRes", new Map());

    map.set("TriMatrix", new Map([
        ["_11", r.float],
        ["_12", r.float],
        ["_13", r.float],
        ["_14", r.float],
        ["_21", r.float],
        ["_22", r.float],
        ["_23", r.float],
        ["_24", r.float],
        ["_31", r.float],
        ["_32", r.float],
        ["_33", r.float],
        ["_34", r.float],
        ["_41", r.float],
        ["_42", r.float],
        ["_43", r.float],
        ["_44", r.float]
    ]));

    map.set("TriObserverLocal", new Map([
        ["front", r.vector3]
    ]));

    map.set("TriPerlinCurve", new Map([
        ["alpha", r.float],
        ["beta", r.float],
        ["N", r.uint],
        ["name", r.string],
        ["offset", r.float],
        ["scale", r.float],
        ["speed", r.float],
        ["value", r.float]
    ]));

    map.set("TriTextureParameter", new Map([
        ["name", r.string],
        ["resourcePath", r.string]
    ]));

    map.set("TriTransformParameter", new Map([
        ["name", r.string],
        ["rotation", r.vector4]
    ]));

    map.set("TriValueBinding", new Map([
        ["destinationObject", r.object],
        ["destinationAttribute", r.string],
        ["name", r.string],
        ["offset", r.vector4],
        ["scale", r.float],
        ["sourceObject", r.object],
        ["sourceAttribute", r.string]
    ]));

    map.set("TriVariableParameter", new Map([
        ["name", r.string],
        ["variableName", r.string]
    ]));
}