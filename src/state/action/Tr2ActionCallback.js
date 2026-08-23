import { meta } from "utils";
import { Tw2Action } from "./Tw2Action";


@meta.define("Tr2ActionCallback", true)
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
