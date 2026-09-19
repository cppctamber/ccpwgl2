import { meta } from "utils";
import { mat4 } from "math";

/** Carbon's view-matrix container. */
@meta.define("TriView", true)
export class TriView extends meta.Model
{
    @meta.matrix4 transform = mat4.create();

    SetTransform(value)
    {
        mat4.copy(this.transform, value);
    }

    GetTransform()
    {
        return this.transform;
    }

    SetLookAtPosition(eye, at, up)
    {
        mat4.lookAt(this.transform, eye, at, up);
    }
}
