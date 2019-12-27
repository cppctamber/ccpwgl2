import { Tw2Parameter } from "./Tw2Parameter";
import { meta, vec3, quat, mat4, util } from "global";


@meta.type("Tw2TransformParameter", "Tr2TransformParameter")
export class Tw2TransformParameter extends Tw2Parameter
{

    @meta.black.string
    name = "";

    @meta.black.quaternion
    rotation = quat.create();

    @meta.vector3
    translation = vec3.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);


    _localTransform = mat4.create();
    _worldTransform = mat4.create();
    _rebuildLocal = true;
    _rebuildWorld = true;

    //_parentTransform = null;
    //_worldTranspose = null;
    //_worldInverse = null;
    //_worldInverseTranspose = null;

    /**
     * Constructor
     * @param {String} [name]
     * @param {quat|mat4} [value]
     */
    constructor(name, value)
    {
        Tw2TransformParameter.init();

        super();

        if (name) this.name = name;

        if (value)
        {
            if (value.length === 4)
            {
                this.SetRotation(value);
            }
            else
            {
                this.SetTransform(value);
            }

            this.RebuildTransforms();
        }
    }

    /**
     * Initializes the transform parameter
     */
    Initialize()
    {
        this.UpdateValues();
    }

    /**
     * Fires on value changes
     * @param {*} opt
     */
    OnValueChanged(opt)
    {
        if (!opt || !opt.skipRebuild)
        {
            this.RebuildTransforms({ force: true, skipUpdate: true });
        }
    }

    /**
     * Rebuilds transforms
     * @param {Object} [opt]
     * @param {Boolean} [opt.force]      - Forces transforms to be updated
     * @param {Boolean} [opt.skipUpdate] - Skips updating the object if there's a change
     * @returns {Boolean} true if updated
     */
    RebuildTransforms(opt)
    {
        let
            force = opt ? opt.force : false,
            skipUpdate = opt ? opt.skipUpdate : false;

        if (force || this._rebuildLocal)
        {
            mat4.fromRotationTranslationScale(this._localTransform, this.rotation, this.translation, this.scaling);
            this._rebuildLocal = false;
            force = true;
        }

        if (force || this._rebuildWorld)
        {
            if (this._parentTransform)
            {
                mat4.multiply(this._worldTransform, this._parentTransform, this._localTransform);
            }
            else
            {
                mat4.copy(this._worldTransform, this._localTransform);
            }

            if (this._worldInverse)
            {
                mat4.invert(this._worldInverse, this._worldTransform);
            }

            if (this._worldTranspose)
            {
                mat4.transpose(this._worldTranspose, this._worldTransform);
            }

            if (this._worldInverseTranspose)
            {
                if (this._worldInverse)
                {
                    mat4.transpose(this._worldInverseTranspose, this._worldInverse);
                }
                else
                {
                    mat4.invert(this._worldInverseTranspose, this._worldTransform);
                    mat4.transpose(this._worldInverseTranspose, this._worldInverseTranspose);
                }
            }

            if (this._constantBuffer)
            {
                this.Apply(this._constantBuffer, this._offset, this.size);
            }

            this._rebuildWorld = false;

            if (!skipUpdate)
            {
                this.UpdateValues({ skipRebuild: true });
            }

            force = true;
        }

        return force;
    }

    /**
     * Binds the parameter to a constant buffer
     * @param {Float32Array} constantBuffer
     * @param {Number} offset
     * @param {Number} size
     * @returns {Boolean}
     */
    Bind(constantBuffer, offset, size)
    {
        if (!this._constantBuffer && size >= this.size)
        {
            this._constantBuffer = constantBuffer;
            this._offset = offset;
            this.Apply(constantBuffer, offset, size);
            return true;
        }
        return false;
    }

    /**
     * Applies the parameter's value to a constant buffer
     * @param {Float32Array} constantBuffer
     * @param {Number} offset
     * @param {Number} size
     */
    Apply(constantBuffer, offset, size)
    {
        if (!this._worldTranspose)
        {
            this.RebuildTransforms();
            this._worldTranspose = mat4.create();
            mat4.transpose(this._worldTranspose, this._worldTransform);
        }

        if (size >= this.constructor.constantBufferSize)
        {
            constantBuffer.set(this._worldTranspose, offset);
        }
        else
        {
            constantBuffer.set(this._worldTranspose.subarray(0, size), offset);
        }
    }

    /**
     * Gets the world transpose
     * @param {mat4} out
     * @returns {mat4}
     */
    GetValue(out)
    {
        this.RebuildTransforms();

        if (!this._worldTranspose)
        {
            this._worldTranspose = mat4.create();
            mat4.transpose(this._worldTranspose, this._worldTransform);
        }

        return mat4.copy(out, this._worldTranspose);
    }

    /**
     * Sets the parent transform
     * @param {null|mat4} m
     * @returns {Tw2TransformParameter}
     */
    SetParentTransform(m)
    {
        // Clear
        if (!m && this._parentTransform)
        {
            this._parentTransform = null;
            this._rebuildWorld = true;
        }
        // Set new parent
        else if (!this._parentTransform)
        {
            this._parentTransform = mat4.clone(m);
            this._rebuildWorld = true;
        }
        // Update parent
        else if (!mat4.equals(m, this._parentTransform))
        {
            mat4.copy(this._parentTransform, m);
            this._rebuildWorld = true;
        }

        return this;
    }

    /**
     * Gets the world transform
     * @param {mat4} out
     * @returns {mat4}
     */
    GetWorldTransform(out)
    {
        this.RebuildTransforms();
        return mat4.copy(out, this._worldTransform);
    }

    /**
     * Decomposes the world transform
     * @param {quat} rotation
     * @param {vec3} translation
     * @param {vec3} scaling
     * @returns {Tw2TransformParameter}
     */
    DecomposeWorld(rotation, translation, scaling)
    {
        this.RebuildTransforms();
        mat4.getRotation(rotation, this._worldTransform);
        mat4.getTranslation(translation, this._worldTransform);
        mat4.getScaling(scaling, this._worldTransform);
        return this;
    }

    /**
     * Gets the world rotation
     * @param {quat} out
     * @returns {quat}
     */
    GetWorldRotation(out)
    {
        this.RebuildTransforms();
        return mat4.getRotation(out, this._worldTransform);
    }


    /**
     * Gets world direction
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetWorldDirection(out)
    {
        this.RebuildTransforms();
        vec3.set(out, this._worldTransform[8], this._worldTransform[9], this._worldTransform[10]);
        return vec3.normalize(out, out);
    }

    /**
     * Gets the world rotation as a euler
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetWorldEuler(out)
    {
        const { quat_0 } = Tw2TransformParameter.global;
        this.GetWorldRotation(quat_0);
        return vec3.euler.fromQuat(out, quat_0);
    }

    /**
     * Gets the world axis angle
     * @param {vec3} axis
     * @returns {Number}
     */
    GetWorldAxisAngle(axis)
    {
        const { quat_0 } = Tw2TransformParameter.global;
        this.RebuildTransforms();
        mat4.getRotation(quat_0, this._worldTransform);
        return quat.getAxisAngle(axis, quat_0);
    }

    /**
     * Gets the world translation
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetWorldTranslation(out)
    {
        this.RebuildTransforms();
        return mat4.getTranslation(out, this._worldTransform);
    }

    /**
     * Gets the world scaling
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetWorldScaling(out)
    {
        this.RebuildTransforms();
        return mat4.getScaling(out, this._worldTransform);
    }

    /**
     * Gets the world max scale
     * @returns {number}
     */
    GetWorldMaxScale()
    {
        const { vec3_0 } = Tw2TransformParameter.global;
        this.GetWorldScaling(vec3_0);
        return Math.max(vec3_0[0], vec3_0[1], vec3_0[2]);
    }

    /**
     * Converts a world coordinate to local co-ordinate
     * @param {vec3} out
     * @param {vec3} v
     * @returns {vec3} out
     */
    GetWorldToLocal(out, v)
    {
        this.RebuildTransforms();

        if (this._worldInverse)
        {
            return vec3.transformMat4(out, v, this._worldInverse);
        }

        const { mat4_0 } = Tw2TransformParameter.global;
        mat4.invert(mat4_0, this._worldTransform);
        return vec3.transformMat4(out, v, mat4_0);
    }

    /**
     * Gets the local transform
     * @param {mat4} out
     * @returns {mat4}
     */
    GetTransform(out)
    {
        return mat4.copy(out, this._localTransform);
    }

    /**
     * Sets the local transform
     * @param {mat4} m
     * @returns {Tw2TransformParameter}
     */
    SetTransform(m)
    {
        mat4.getRotation(this.rotation, m);
        mat4.getScaling(this.scaling, m);
        mat4.getTranslation(this.translation, m);
        mat4.copy(this._localTransform, m);
        this._rebuildWorld = true;
        return this;
    }

    /**
     * Composes the local transform from rotation, translation and scaling
     * @param {quat} rotation
     * @param {vec3} translation
     * @param {vec3} scaling
     * @returns {Tw2TransformParameter}
     */
    Compose(rotation, translation, scaling)
    {
        quat.copy(this.rotation, rotation);
        vec3.copy(this.translation, translation);
        vec3.copy(this.scaling, scaling);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Decomposes the local transform to rotation, translation and scaling
     * @param {quat} rotation
     * @param {vec3} translation
     * @param {vec3} scaling
     * @returns {Tw2TransformParameter}
     */
    Decompose(rotation, translation, scaling)
    {
        this.RebuildTransforms();
        quat.copy(rotation, this.rotation);
        vec3.copy(translation, this.translation);
        vec3.copy(scaling, this.scaling);
        return this;
    }

    /**
     * Converts local coordinate to world co-ordinate
     * @param {vec3} out
     * @param {vec3} v
     * @returns {vec3} out
     */
    GetLocalToWorld(out, v)
    {
        this.RebuildTransforms();
        return vec3.transformMat4(out, v, this._worldTransform);
    }

    /**
     * Gets local direction
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetDirection(out)
    {
        this.RebuildTransforms();
        vec3.set(out, this._localTransform[8], this._localTransform[9], this._localTransform[10]);
        return vec3.normalize(out, out);
    }

    /**
     * Gets the local rotation
     * @param {quat} out
     * @returns {quat}
     */
    GetRotation(out)
    {
        this.RebuildTransforms();
        return quat.copy(out, this.rotation);
    }

    /**
     * Gets the local rotation as a euler
     * @param {vec3} out
     * @returns {vec3}
     */
    GetEuler(out)
    {
        const { quat_0 } = Tw2TransformParameter.global;
        this.GetRotation(quat_0);
        return vec3.euler.fromQuat(out, quat_0);
    }

    /**
     * Gets a matrix from the local rotation
     * @param {mat4} out
     * @return {mat4} out
     */
    GetRotationMatrix(out)
    {
        return mat4.fromRotation(out, this.rotation);
    }

    /**
     * Sets the the local rotation from a quat
     * @param {quat} q
     * @returns {Tw2TransformParameter}
     */
    SetRotation(q)
    {
        quat.copy(this.rotation, q);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Sets the local rotation from values
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @param {Number} w
     * @returns {Tw2TransformParameter}
     */
    SetRotationFromValues(x, y, z, w)
    {
        const { quat_0 } = Tw2TransformParameter.global;
        quat.set(quat_0, x, y, z, w);
        return this.SetRotation(quat_0);
    }

    /**
     * Sets the local rotation from axes
     * @param {vec3} view
     * @param {vec3} right
     * @param {vec3} up
     * @returns {Tw2TransformParameter}
     */
    SetRotationFromAxes(view, right, up)
    {
        const { quat_0 } = Tw2TransformParameter.global;
        quat.setAxes(quat_0, view, right, up);
        return this.SetRotation(quat_0);
    }

    /**
     * Sets the local rotation from an axis and angle
     * @param {vec3} axis
     * @param {Number} radians
     * @returns {Tw2TransformParameter}
     */
    SetRotationFromAxisAngle(axis, radians)
    {
        quat.setAxisAngle(this.rotation, axis, radians);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Sets the local rotation from a euler
     * @param {vec3} e
     * @returns {Tw2TransformParameter}
     */
    SetRotationFromEuler(e)
    {
        vec3.euler.getQuat(this.rotation, e);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Sets the local rotation from euler values
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @returns {Tw2TransformParameter}
     */
    SetRotationFromEulerValues(x, y, z)
    {
        const { vec3_0 } = Tw2TransformParameter.global;
        vec3.set(vec3_0, x, y, z);
        return this.SetRotationFromEuler(vec3_0);
    }

    /**
     * Sets the local rotation from a mat4
     * @param {mat4} m
     * @returns {Tw2TransformParameter}
     */
    SetRotationFromMat4(m)
    {
        const { quat_0 } = Tw2TransformParameter.global;
        mat4.getRotation(quat_0, m);
        return this.SetRotation(quat_0);
    }

    /**
     * Local rotation on the x axis
     * @param {Number} radians
     * @returns {Tw2TransformParameter}
     */
    RotateX(radians)
    {
        quat.rotateX(this.rotation, this.rotation, radians);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Local rotation on the y axis
     * @param {Number} radians
     * @returns {Tw2TransformParameter}
     */
    RotateY(radians)
    {
        quat.rotateY(this.rotation, this.rotation, radians);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Local rotation on the z axis
     * @param {Number} radians
     * @returns {Tw2TransformParameter}
     */
    RotateZ(radians)
    {
        quat.rotateZ(this.rotation, this.rotation, radians);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Local rotation on an axis angle
     * @param {vec3} axis
     * @param {Number} radians
     * @returns {Tw2TransformParameter}
     */
    RotateOnAxisAngle(axis, radians)
    {
        const { quat_0 } = Tw2TransformParameter.global;
        quat.setAxisAngle(quat_0, axis, radians);
        quat.multiply(this.rotation, this.rotation, quat_0);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Gets the local axis angle
     * @param {quat} out
     * @returns {Number}
     */
    GetAxisAngle(out)
    {
        return quat.getAxisAngle(out, this.rotation);
    }

    /**
     * Local rotation to look at a local coordinate
     * @param {vec3} v
     * @param {Boolean} [flip]
     * @returns {Tw2TransformParameter}
     */
    LookAt(v, flip)
    {
        this.RebuildTransforms();

        const { mat4_0 } = Tw2TransformParameter.global;
        mat4.copy(mat4_0, this._localTransform);

        if (flip)
        {
            mat4.lookAtGL(mat4_0, this.translation, v, vec3.Y_AXIS);
        }
        else
        {
            mat4.lookAtGL(mat4_0, v, this.translation, vec3.Y_AXIS);
        }

        mat4.getRotation(this.rotation, mat4_0);

        this._rebuildLocal = true;
        return this;
    }

    /**
     * Local rotation to look at a world coordinate
     * @param {vec3} v
     * @param {Boolean} [flip]
     * @returns {Tw2TransformParameter}
     */
    LookAtWorld(v, flip)
    {
        const { vec3_0 } = Tw2TransformParameter.global;
        this.GetWorldToLocal(vec3_0, v);
        return this.LookAt(vec3_0, flip);
    }

    /**
     * Gets the local translation
     * @param {vec3} out
     * @returns {vec3}
     */
    GetTranslation(out)
    {
        this.RebuildTransforms();
        return vec3.copy(out, this.translation);
    }

    /**
     * Sets the local translation from a vector
     * @param {vec3} v
     * @returns {Tw2TransformParameter}
     */
    SetTranslation(v)
    {
        vec3.copy(this.translation, v);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Sets the local translation from values
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @returns {Tw2TransformParameter}
     */
    SetTranslationFromValues(x, y, z)
    {
        vec3.set(this.translation, x, y, z);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Sets the local translation from a mat4's translation
     * @param {mat4} m
     * @returns {Tw2TransformParameter}
     */
    SetTranslationFromMat4(m)
    {
        mat4.getTranslation(this.translation, m);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Local translation on an axis
     * @param {vec3} axis
     * @param {Number} distance
     * @returns {Tw2TransformParameter}
     */
    TranslateOnAxis(axis, distance)
    {
        const { vec3_0 } = Tw2TransformParameter.global;
        vec3.transformQuat(vec3_0, axis, this.rotation);
        vec3.scaleAndAdd(this.translation, this.translation, vec3_0, distance);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Local translation on the x axis
     * @param {Number} distance
     * @returns {Tw2TransformParameter}
     */
    TranslateX(distance)
    {
        return this.TranslateOnAxis(vec3.X_AXIS, distance);
    }

    /**
     * Local translation on the y axis
     * @param {Number} distance
     * @returns {Tw2TransformParameter}
     */
    TranslateY(distance)
    {
        return this.TranslateOnAxis(vec3.Y_AXIS, distance);
    }

    /**
     * Local translation on the z axis
     * @param {Number} distance
     * @returns {Tw2TransformParameter}
     */
    TranslateZ(distance)
    {
        return this.TranslateOnAxis(vec3.Z_AXIS, distance);
    }

    /**
     * Gets the local scaling
     * @param {vec3} out
     * @returns {vec3}
     */
    GetScale(out)
    {
        this.RebuildTransforms();
        return vec3.copy(out, this.scaling);
    }

    /**
     * Gets the maximum local scale
     * @returns {Number}
     */
    GetMaxScale()
    {
        return Math.max(this.scaling[0], this.scaling[1], this.scaling[2]);
    }

    /**
     * Sets local scaling from a vector
     * @param {vec3} v
     * @returns {Tw2TransformParameter}
     */
    SetScale(v)
    {
        vec3.copy(this.scaling, v);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Sets local scaling from values
     * @param {Number} x
     * @param {Number}  y
     * @param {Number}  z
     * @returns {Tw2TransformParameter}
     */
    SetScaleFromValues(x, y, z)
    {
        const { vec3_0 } = Tw2TransformParameter.global;
        vec3.set(vec3_0, x, y, z);
        return this.SetScale(vec3_0);
    }

    /**
     * Sets the local x axis scale
     * @param {Number} s
     * @returns {Tw2TransformParameter}
     */
    SetScaleX(s)
    {
        return this.SetScaleFromValues(s, this.scaling[1], this.scaling[2]);
    }

    /**
     * Sets the local y axis scale
     * @param {Number} s
     * @returns {Tw2TransformParameter}
     */
    SetScaleY(s)
    {
        return this.SetScaleFromValues(this.scaling[0], s, this.scaling[2]);
    }

    /**
     * Sets the local z axis scale
     * @param {Number} s
     * @returns {Tw2TransformParameter}
     */
    SetScaleZ(s)
    {
        return this.SetScaleFromValues(this.scaling[0], this.scaling[1], s);
    }

    /**
     * Sets local scaling from a scalar
     * @param {Number} s
     * @returns {Tw2TransformParameter}
     */
    SetScaleUniform(s)
    {
        return this.SetScaleFromValues(s, s, s);
    }

    /**
     * Sets local scaling from a mat4's scale
     * @param {mat4} m
     * @returns {Tw2TransformParameter}
     */
    SetScaleFromMat4(m)
    {
        mat4.getScaling(this.scaling, m);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Scales the local scale by a vector
     * @param {vec3} v
     * @returns {Tw2TransformParameter}
     */
    Scale(v)
    {
        vec3.multiply(this.scaling, this.scaling, v);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Scales the local scale by values
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @returns {Tw2TransformParameter}
     */
    ScaleValues(x, y, z)
    {
        const { vec3_0 } = Tw2TransformParameter.global;
        vec3.set(vec3_0, x, y, z);
        return this.Scale(vec3_0);
    }

    /**
     * Scales the local scale by a mat4's scale
     * @param {mat4} m
     * @returns {Tw2TransformParameter}
     */
    ScaleMat4(m)
    {
        const { vec3_0 } = Tw2TransformParameter.global;
        mat4.getScaling(vec3_0, m);
        return this.Scale(vec3_0);
    }

    /**
     * Scales the local scale by a scalar
     * @param {Number} s
     * @returns {Tw2TransformParameter}
     */
    ScaleUniform(s)
    {
        return this.ScaleValues(s, s, s);
    }

    /**
     * Scales the local x axis
     * @param {Number} s
     * @returns {Tw2TransformParameter}
     */
    ScaleX(s)
    {
        return this.ScaleValues(s, 1, 1);
    }

    /**
     * Scales the local y axis
     * @param {Number} s
     * @returns {Tw2TransformParameter}
     */
    ScaleY(s)
    {
        return this.ScaleValues(1, s, 1);
    }

    /**
     * Scales the local z axis
     * @param {Number} s
     * @returns {Tw2TransformParameter}
     */
    ScaleZ(s)
    {
        return this.ScaleValues(1, 1, s);
    }

    /**
     * The parameter's constant buffer size
     * @type {Number}
     */
    static constantBufferSize = 16;

    /**
     * Sets the parameter's values from a plain object
     * @param {Tw2TransformParameter} a
     * @param {Object} [values]
     * @param {Object} [opt]
     */
    static set(a, values, opt = {})
    {
        if (values)
        {
            values = Object.assign({}, values);

            if (values.transform)
            {
                values.rotation = mat4.getRotation([], values.transform);
                values.scaling = mat4.getScaling([], values.transform);
                values.translation = mat4.getTranslation([], values.translation);
                Reflect.deleteProperty(values, "transform");
            }

            if (util.isNumber(values.scaling))
            {
                values.scaling = [ values.scaling, values.scaling, values.scaling ];
            }

            if (values.rotation && values.rotation.length === 3)
            {
                values.rotation = vec3.euler.getQuat([], values.rotation);
            }
        }

        return Tw2Parameter.set(a, values, opt);
    }

    /**
     * Global and scratch parameters
     * @type {null|Object}
     */
    static global = null;

    /**
     * Initializes global and scratch parameters
     */
    static init()
    {
        if (this.global) return;

        this.global = {
            vec3_0: vec3.create(),
            vec3_1: vec3.create(),
            quat_0: quat.create(),
            mat4_0: mat4.create()
        };
    }

}
