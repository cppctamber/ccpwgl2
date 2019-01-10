export * from "./Tw2VertexDeclaration";
export * from "./Tw2VertexElement";

/**
 * Raw vertex element data
 * @typedef {{}} RawVertexData
 * @param {String|Number} usage
 * @param {Number} usageIndex
 * @param {Number} elements
 * @param {?!Number} [type]
 * @param {?!Number} [offset = 0]
 * @param {?!Number} [location=null]
 * @param {?!Function} [customSetter=null]
 */

/**
 * Raw vertex element data array
 * @typedef {Array<RawVertexData>} RawVertexDataArray
 */