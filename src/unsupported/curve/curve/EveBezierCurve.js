import { meta } from "utils/index";
import { Tw2Curve } from "curve";
import { vec3, quat }  from "math";


@meta.notImplemented
@meta.type("EveBezierCurve")
export class EveBezierCurve extends Tw2Curve
{

    @meta.boolean
    billboardObjects = false;

    @meta.vector3
    bezierPoint = vec3.create();

    @meta.struct()
    lineSet = null;

    @meta.float
    lineWidth = 1;

    @meta.float
    movementScale = 1;

    @meta.float
    movementSpeed = 1;

    @meta.vector3
    objectScale =  vec3.fromValues(1,1,1);

    @meta.vector3
    point1 = vec3.create();

    @meta.vector3
    point2 = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.boolean
    scaleEndpoints = false;

    @meta.boolean
    scaleSegmentsByCompleteness = false;

    @meta.uint
    segments = 0;

    @meta.vector3
    translation = vec3.create();

    /**
     * The curve's dimension
     * @type {?number}
     */
    static inputDimension = 0;

    /**
     * The curve's dimension
     * @type {?number}
     */
    static outputDimension = 0;

    /**
     * The curve's current value property
     * @type {?String}
     */
    static valueProperty = "value";

    /**
     * The curve's type
     * @type {?number}
     */
    static curveType = Tw2Curve.Type.CURVE2;

}
