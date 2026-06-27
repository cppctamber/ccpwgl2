import { meta } from "utils";


@meta.tny.type("TnyResService")
@meta.tny.define("TnyResService")
export class TnyResService extends meta.Model
{

    ResolvePath(path, context = {})
    {
        return path;
    }

    async FetchRaw(path, context = {})
    {
        throw new Error("TnyResService.FetchRaw must be implemented by a runtime provider");
    }

    async GetResourceFacts(path, context = {})
    {
        return null;
    }

}
