import { meta } from "utils";


@meta.type("EveSOFDataDecalIndexBuffer")
@meta.define({
    wgl: "EveSOFDataDecalIndexBuffer",
    ccp: true
})
export class EveSOFDataDecalIndexBuffer extends meta.Model
{

    @meta.uint32Array
    indexBuffer = null;

    static readIndexBuffer = r =>
    {
        const
            count = r.ReadU32() / 4,
            indexBuffer = new Uint32Array(count);

        for (let i = 0; i < count; i++) indexBuffer[i] = r.ReadU32();
        return indexBuffer;
    };

    // Black handler
    static blackReaders = {
        indexBuffer: this.readIndexBuffer,
        indexes: this.readIndexBuffer
    };

}
