import { meta } from "utils";

/**
 * @property {boolean} enabled
 * @property {number} fullWidth
 * @property {number} fullHeight
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */
@meta.type("CameraView")
export class CameraView extends meta.Model
{

    @meta.boolean
    enabled = true;

    @meta.float
    fullWidth = 1;

    @meta.float
    fullHeight = 1;

    @meta.float
    x = 0;

    @meta.float
    y = 0;

    @meta.float
    width = 1;

    @meta.float
    height = 1;

}