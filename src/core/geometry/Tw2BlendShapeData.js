import { meta } from "global";
import { Tw2VertexDeclaration } from "../vertex";


@meta.ctor("Tw2BlendShapeData")
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
