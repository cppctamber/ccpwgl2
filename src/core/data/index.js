export * from "./Tw2PerObjectData";
export * from "./Tw2RawData";

/**
 * An array containing raw element data
 * @typedef {[String, Number|Array|Float32Array|vec3|vec4|mat4]} RawElementData
 */

/**
 * An array of raw data elements
 * @typedef {Array<RawElementData>} RawElementArray
 */

/**
 * An object containing per object raw data elements
 * @typedef {{}} RawDataObject
 * @property {RawElementArray} [vs] Vertex shader data
 * @property {RawElementArray} [ps] Pixel shader data
 * @property {RawElementArray} [ffe] Fixed function emulation data
 */