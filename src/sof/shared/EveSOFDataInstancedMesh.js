import { meta } from "global";


/**
 * Instanced Mesh instance reader
 */
class EveSOFDataInstancedMeshInstanceReader
{
    constructor(data)
    {
        this.data = data;
    }

    static blackStruct(reader)
    {
        return new EveSOFDataInstancedMeshInstanceReader([
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32()
        ]);
    }
}


@meta.type("EveSOFDataInstancedMesh", true)
export class EveSOFDataInstancedMesh
{

    @meta.black.string
    name = "";

    @meta.black.path
    geometryResPath = "";

    @meta.black.struct([ EveSOFDataInstancedMeshInstanceReader ])
    instances = [];

    @meta.black.uint
    lowestLodVisible = 0;

    @meta.black.string
    shader = "";

    @meta.black.listOf("EveSOFDataTexture")
    textures = [];

}
