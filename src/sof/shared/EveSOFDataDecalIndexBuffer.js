import { meta } from "utils";


@meta.type("EveSOFDataDecalIndexBuffer")
export class EveSOFDataDecalIndexBuffer extends meta.Model
{

    @meta.uint16Array
    indexBuffer = null;

    // Black handler
    static blackReaders = {
        indexBuffer: r =>
        {
            const
                count = r.ReadU32() / 4,
                indexBuffer = new Uint16Array(count);

            for (let i = 0; i < count; i++) indexBuffer[i] = r.ReadU32();
            return indexBuffer;
        }
    }

}
