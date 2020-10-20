import { meta } from "utils";
import { Tw2VertexDeclaration } from "../vertex";


@meta.type("Tw2BlendShapeData")
export class Tw2BlendShapeData
{

    @meta.string
    name = "";

    @meta.struct("Tw2VertexDeclaration")
    declaration = new Tw2VertexDeclaration();

    @meta.vector
    buffers = [];

    @meta.unknown
    indexes = null;

    @meta.unknown
    weightProxy = null;

}
