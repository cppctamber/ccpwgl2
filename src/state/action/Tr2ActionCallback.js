import { meta } from "utils";
import { Tw2Action } from "./Tw2Action";


@meta.type("Tr2ActionCallback")
@meta.ccp.define("Tr2ActionCallback")
export class Tr2ActionCallback extends Tw2Action
{
    @meta.string
    callbackName = "";

    Start(controller)
    {
        if (!this.callbackName || !controller || !controller.Callback)
        {
            return false;
        }

        return controller.Callback(this.callbackName);
    }
}
