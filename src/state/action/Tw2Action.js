import { meta } from "utils";


@meta.wgl.define("Tw2Action")
export class Tw2Action extends meta.Model
{
    isDisabled = false;

    Link()
    {
    }

    Unlink()
    {
    }

    Start()
    {
    }

    Stop()
    {
    }

    Update()
    {
    }

    CanTransition()
    {
        return !this.isDisabled;
    }
}
