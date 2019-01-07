import {vec3} from "../../global";
import {Tw2VertexDeclaration} from "../vertex";

/**
 * Tw2GeometryMesh
 *
 * @property {String} name
 * @property {Tw2VertexDeclaration} declaration
 * @property {Array.<Tw2GeometryMeshArea>} areas
 * @property {WebGLBuffer} buffer
 * @property {Number} bufferLength
 * @property bufferData
 * @property {WebGLBuffer} indexes
 * @property indexData
 * @property {Number} indexType
 * @property {vec3} minBounds
 * @property {vec3} maxBounds
 * @property {vec3} boundsSpherePosition
 * @property {Number} boundsSphereRadius
 * @property {Array} bones
 * @property {Array.<string>} boneBindings
 */
export class Tw2GeometryMesh
{

    name = "";
    declaration = new Tw2VertexDeclaration();
    areas = [];
    buffer = null;
    bufferLength = 0;
    bufferData = null;
    indexes = null;
    indexData = null;
    indexType = 0;
    minBounds = vec3.create();
    maxBounds = vec3.create();
    boundsSpherePosition = vec3.create();
    boundsSphereRadius = 0;
    bones = [];
    boneBindings = [];

}