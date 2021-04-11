import { meta } from "utils";
import { vec3, quat, mat4 } from "math";


const
    vec3_0 = vec3.create(),
    quat_0 = quat.create(),
    mat4_0 = mat4.create();


@meta.type("Tw2Transform")
export class Tw2Transform extends meta.Model
{

    @meta.string
    name = "";

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    translation = vec3.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    _localTransform = mat4.create();
    _worldTransform = mat4.create();

    _rebuildLocal = true;
    _rebuildWorld = true;

    // Optional parameters
    //_parentTransform = null;
    //_worldInverse = null;
    //_worldTranspose = null;
    //_worldInverseTranspose = null;

    /**
     * Adds a function which is called when the world transform is modified
     * @param {Function} [onWorldTransformModified]
     */
    OnWorldModified(onWorldTransformModified)
    {
        this._onWorldTransformModified = onWorldTransformModified;
        return this;
    }

    /**
     * Initializes the transform parameter
     */
    Initialize()
    {
        this.RebuildTransforms({ force: true, skipUpdate: true });
    }

    /**
     * Fires on value changes
     * @param {Object} [opt]
     */
    OnValueChanged(opt)
    {
        // Do not call if it was already called!
        if (!opt || !opt.skipTransforms)
        {
            this.RebuildTransforms({ force: true, skipUpdate: true });
        }
    }

    /**
     * Rebuilds transforms
     * @param {Object} [opt]
     * @returns {Boolean} true if updated
     */
    RebuildTransforms(opt)
    {
        let force = opt && opt.force,
            skipUpdate = opt && opt.skipUpdate;

        if (force || this._rebuildLocal)
        {
            mat4.fromRotationTranslationScale(this._localTransform, this.rotation, this.translation, this.scaling);
            this._rebuildLocal = false;
            force = true;
        }

        if (!force && !this._rebuildWorld)
        {
            return false;
        }

        const { _worldInverse, _worldInverseTranspose, _worldTranspose, _parentTransform } = this;

        if (_parentTransform)
        {
            mat4.multiply(this._worldTransform, _parentTransform, this._localTransform);
        }
        else
        {
            mat4.copy(this._worldTransform, this._localTransform);
        }

        if (_worldInverse)
        {
            mat4.invert(_worldInverse, this._worldTransform);
        }

        if (_worldTranspose)
        {
            mat4.transpose(_worldTranspose, this._worldTransform);
        }

        if (_worldInverseTranspose)
        {
            if (_worldTranspose)
            {
                mat4.invert(_worldInverseTranspose, _worldTranspose);
            }
            else
            {
                mat4.invert(_worldInverseTranspose, this._worldTransform);
                mat4.transpose(_worldInverseTranspose, _worldInverseTranspose);
            }
        }

        if (this["_onWorldTransformModified"])
        {
            this["_onWorldTransformModified"](this._worldTransform);
        }

        if (this["OnWorldTransformModified"])
        {
            this["OnWorldTransformModified"](this._worldTransform);
        }

        if (!skipUpdate)
        {
            this.UpdateValues({ skipTransforms: true });
        }

        this._rebuildWorld = false;

        return true;
    }

    /**
     * Sets the parent transform
     * @param {null|mat4} m
     * @returns {*}
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
     * @returns {*}
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
        this.GetWorldRotation(quat_0);
        return vec3.euler.fromQuat(out, quat_0);
    }

    /**
     * Gets the world rotation as a euler in  degrees
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetWorldEulerInDegrees(out)
    {
        this.GetWorldEuler(out);
        return vec3.degrees(out, out);
    }

    /**
     * Gets the world axis angle
     * @param {vec3} axis
     * @returns {Number}
     */
    GetWorldAxisAngle(axis)
    {
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

        if (this["_worldInverse"])
        {
            return vec3.transformMat4(out, v, this["_worldInverse"]);
        }

        mat4.invert(mat4_0, this._worldTransform);
        return vec3.transformMat4(out, v, mat4_0);
    }

    /**
     * Reverts the object's transform to an identity matrix
     * @returns {*}
     */
    Identity()
    {
        mat4.identity(this._localTransform);
        mat4.getRotation(this.rotation, this._localTransform);
        mat4.getTranslation(this.translation, this._localTransform);
        mat4.getScaling(this.scaling, this._localTransform);
        this._rebuildWorld = true;
        return this;
    }

    /**
     * Gets the local transform
     * @param {mat4} out
     * @returns {mat4}
     */
    GetTransform(out)
    {
        this.RebuildTransforms();
        return mat4.copy(out, this._localTransform);
    }

    /**
     * Sets the local transform
     * @param {mat4} m
     * @returns {*}
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
     * @returns {*}
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
     * @returns {*}
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
        return vec3.euler.fromQuat(out, this.GetRotation(quat_0));
    }

    /**
     * Gets the local rotation as a euler
     * @param {vec3} out
     * @returns {vec3}
     */
    GetEulerInDegrees(out)
    {
        vec3.euler.fromQuat(vec3_0, this.GetRotation(quat_0));
        return vec3.degrees(vec3_0, vec3_0);
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
     * @returns {*}
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
     * @returns {*}
     */
    SetRotationFromValues(x, y, z, w)
    {
        quat.set(this.rotation, x, y, z, w);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Sets the local rotation from axes
     * @param {vec3} view
     * @param {vec3} right
     * @param {vec3} up
     * @returns {*}
     */
    SetRotationFromAxes(view, right, up)
    {
        quat.setAxes(this.rotation, view, right, up);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Sets the local rotation from an axis and angle
     * @param {vec3} axis
     * @param {Number} radians
     * @returns {*}
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
     * @returns {*}
     */
    SetRotationFromEuler(e)
    {
        vec3.euler.getQuat(this.rotation, e);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Sets the local rotation from a euler that uses degrees
     * @param {vec3} e
     * @returns {*}
     */
    SetRotationFromEulerDegrees(e)
    {
        vec3.radians(vec3_0, e);
        return this.SetRotationFromEuler(vec3_0);
    }

    /**
     * Sets the local rotation from euler values
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @returns {*}
     */
    SetRotationFromEulerValues(x, y, z)
    {
        vec3.set(vec3_0, x, y, z);
        return this.SetRotationFromEuler(vec3_0);
    }

    /**
     * Sets the local rotation from euler values
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @returns {*}
     */
    SetRotationFromEulerDegreeValues(x, y, z)
    {
        vec3.set(vec3_0, x, y, z);
        return this.SetRotationFromEulerDegrees(vec3_0);
    }

    /**
     * Sets the local rotation from a mat4
     * @param {mat4} m
     * @returns {*}
     */
    SetRotationFromMat4(m)
    {
        return this.SetRotation(mat4.getRotation(quat_0, m));
    }

    /**
     * Local rotation on the x axis
     * @param {Number} radians
     * @returns {*}
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
     * @returns {*}
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
     * @returns {*}
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
     * @returns {*}
     */
    RotateOnAxisAngle(axis, radians)
    {
        quat.setAxisAngle(quat_0, axis, radians);
        quat.multiply(this.rotation, this.rotation, quat_0);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Gets the local axis angle
     * @param {vec3} out
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
     * @returns {*}
     */
    LookAt(v, flip)
    {
        this.RebuildTransforms();

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
     * @returns {*}
     */
    LookAtWorld(v, flip)
    {
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
     * @returns {*}
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
     * @returns {*}
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
     * @returns {*}
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
     * @returns {*}
     */
    TranslateOnAxis(axis, distance)
    {
        vec3.transformQuat(vec3_0, axis, this.rotation);
        vec3.scaleAndAdd(this.translation, this.translation, vec3_0, distance);
        this._rebuildLocal = true;
        return this;
    }

    /**
     * Local translation on the x axis
     * @param {Number} distance
     * @returns {*}
     */
    TranslateX(distance)
    {
        return this.TranslateOnAxis(vec3.X_AXIS, distance);
    }

    /**
     * Local translation on the y axis
     * @param {Number} distance
     * @returns {*}
     */
    TranslateY(distance)
    {
        return this.TranslateOnAxis(vec3.Y_AXIS, distance);
    }

    /**
     * Local translation on the z axis
     * @param {Number} distance
     * @returns {*}
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
     * @returns {*}
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
     * @returns {*}
     */
    SetScaleFromValues(x, y, z)
    {
        vec3.set(vec3_0, x, y, z);
        return this.SetScale(vec3_0);
    }

    /**
     * Sets the local x axis scale
     * @param {Number} s
     * @returns {*}
     */
    SetScaleX(s)
    {
        return this.SetScaleFromValues(s, this.scaling[1], this.scaling[2]);
    }

    /**
     * Sets the local y axis scale
     * @param {Number} s
     * @returns {*}
     */
    SetScaleY(s)
    {
        return this.SetScaleFromValues(this.scaling[0], s, this.scaling[2]);
    }

    /**
     * Sets the local z axis scale
     * @param {Number} s
     * @returns {*}
     */
    SetScaleZ(s)
    {
        return this.SetScaleFromValues(this.scaling[0], this.scaling[1], s);
    }

    /**
     * Sets local scaling from a scalar
     * @param {Number} s
     * @returns {*}
     */
    SetScaleUniform(s)
    {
        return this.SetScaleFromValues(s, s, s);
    }

    /**
     * Sets local scaling from a mat4's scale
     * @param {mat4} m
     * @returns {*}
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
     * @returns {*}
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
     * @returns {*}
     */
    ScaleValues(x, y, z)
    {
        vec3.set(vec3_0, x, y, z);
        return this.Scale(vec3_0);
    }

    /**
     * Scales the local scale by a mat4's scale
     * @param {mat4} m
     * @returns {*}
     */
    ScaleMat4(m)
    {
        mat4.getScaling(vec3_0, m);
        return this.Scale(vec3_0);
    }

    /**
     * Scales the local scale by a scalar
     * @param {Number} s
     * @returns {*}
     */
    ScaleUniform(s)
    {
        return this.ScaleValues(s, s, s);
    }

    /**
     * Scales the local x axis
     * @param {Number} s
     * @returns {*}
     */
    ScaleX(s)
    {
        return this.ScaleValues(s, 1, 1);
    }

    /**
     * Scales the local y axis
     * @param {Number} s
     * @returns {*}
     */
    ScaleY(s)
    {
        return this.ScaleValues(1, s, 1);
    }

    /**
     * Scales the local z axis
     * @param {Number} s
     * @returns {*}
     */
    ScaleZ(s)
    {
        return this.ScaleValues(1, 1, s);
    }

    /**
     * Sets an object from values
     * @param {Tw2Transform} a
     * @param {Object} [values]
     * @param {Object} [opt]
     * @returns {boolean}
     */
    static set(a, values, opt)
    {
        if (!values) return false;

        let { rotation, euler, scale, radius, position, ...temp } = values;

        if (radius !== undefined)
        {
            scale = radius * 2;
        }

        if (scale !== undefined)
        {
            temp.scaling = [ scale, scale, scale ];
        }

        if (rotation)
        {
            if (rotation.length === 3)
            {
                temp.rotation = quat.fromEuler([], rotation[0], rotation[1], rotation[2]);
            }
            else
            {
                temp.rotation = rotation;
            }
        }

        if (position)
        {
            temp.translation = position;
        }

        return super.set(a, temp, opt);
    }

    /**
     * Gets the classes values
     * @param {Tw2Transform} a
     * @param {Object} [out={}]
     * @param {Object} [opt]
     * @returns {Object}
     */
    static get(a, out, opt)
    {
        a.RebuildTransforms(opt);
        return super.get(a, out, opt);
    }

    /**
     * Gets a vector 3 from an object
     * @param {Object} obj
     * @returns {Float32Array}
     */
    static Vector3FromObject(obj)
    {
        if ("r" in obj)
        {
            return new Float32Array([ obj.r, obj.g, obj.b ]);
        }
        else if ("x" in obj)
        {
            return new Float32Array([ obj.x, obj.y, obj.z ]);
        }
        else
        {
            throw new Error("Invalid vector3 object");
        }
    }

    /**
     * Gets a quat from an object
     * @param {Object} obj
     * @returns {Float32Array}
     */
    static Vector4FromObject(obj)
    {
        if ("r" in obj)
        {
            return new Float32Array([ obj.r, obj.g, obj.b, "a" in obj ? obj.a : 1 ]);
        }
        else if ("x" in obj)
        {
            return new Float32Array([ obj.x, obj.y, obj.z, obj.w ]);
        }
        else
        {
            throw new Error("Invalid vector4 object");
        }
    }

}
