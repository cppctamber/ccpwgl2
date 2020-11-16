import { meta } from "utils";


@meta.type("Tw2ShaderState")
export class Tw2ShaderState
{

    @meta.float
    state = 0;

    @meta.float
    value = 0;

    /**
     * Reads ccp shader state binary
     * @param {Tw2BinaryReader} reader
     * @return {Tw2ShaderState}
     */
    static fromCCPBinary(reader)
    {
        const state = new Tw2ShaderState();
        state.state = reader.ReadUInt32();
        state.value = reader.ReadUInt32();
        return state;
    }

}
