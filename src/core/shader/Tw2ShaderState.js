import { meta } from "utils";


@meta.type("Tw2ShaderState")
export class Tw2ShaderState
{

    @meta.float
    state = -1;

    @meta.float
    value = -1;


    /**
     *
     * TODO: Replace with utility functions
     * @param {Object} json
     * @return {Tw2ShaderState}
     */
    static fromJSON(json)
    {
        const state = new Tw2ShaderState();
        if (json.state !== undefined) state.state = json.state;
        if (json.value !== undefined) state.value = json.value;
        return state;
    }

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
