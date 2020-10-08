import { meta, vec4 } from "global";
import { Tw2Vector4Parameter, Tw2Error } from "core";
import { isArrayLike, isBoolean, isNumber } from "global/util";


/**
 * Tw2ValueBinding
 * TODO: Looks like there are less swizzles than before, might be able to simplify this class (eg if v1,v2,v3,v4 gone)
 * TODO: Handle utility functions
 * TODO: Figure out a way of telling if a source/destination is RGBA when building from a UI rather than a swizzle
 *
 * @property {String} name                 -
 * @property {String} destinationAttribute -
 * @property {*} destinationObject         -
 * @property {vec4} offset                 -
 * @property {Number} scale                -
 * @property {String} sourceAttribute      -
 * @property {*} sourceObject              -
 * @property {Function} _copyFunc          -
 * @property {Number} _destinationElement  -
 * @property {Boolean} _destinationIsArray -
 * @property {Boolean} _destinationIsRGBA  -
 * @property {Number} _sourceElement       -
 * @property {Boolean} _sourceIsArray      -
 * @property {Boolean} _sourceIsRGBA       -
 */
@meta.ctor("Tw2ValueBinding", "TriValueBinding")
export class Tw2ValueBinding extends meta.Model
{

    @meta.string
    name = "";

    @meta.string
    destinationAttribute = "";

    @meta.struct()
    destinationObject = null;

    @meta.vector4
    offset = vec4.create();

    @meta.float
    scale = 1;

    @meta.string
    sourceAttribute = "";

    @meta.struct()
    sourceObject = null;


    _copyFunc = null;
    _destinationElement = null;
    _destinationIsArray = null;
    _destinationIsRGBA = null;
    _sourceElement = null;
    _sourceIsArray = null;
    _sourceIsRGBA = null;


    /**
     * Initializes the binding
     */
    Initialize()
    {
        this.UpdateValues();
    }

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        if (this._copyFunc !== null) return;

        if (!this.sourceObject || this.sourceAttribute === "") return;
        if (!this.destinationObject || this.destinationAttribute === "") return;

        /*
        if (this.sourceObject && "_ref" in this.sourceObject)
        {
            this.sourceObject = this.FindIDFromRoot(this.sourceObject._ref);
            if (!this.sourceObject) throw new ErrBindingReference({object: "source"});
        }

        // Handle destination by reference
        if (this.destinationObject && "_ref" in this.destinationObject)
        {
            this.destinationObject = this.FindIDFromRoot(this.destinationObject._ref);
            if (!this.destinationObject) throw new ErrBindingReference({object: "destination"});
        }
         */

        let srcSwizzled = false,
            destSwizzled = false,
            srcSwizzle = this.sourceAttribute.substr(-2);

        if (srcSwizzle === ".x" || srcSwizzle === ".r")
        {
            srcSwizzled = true;
            this._sourceElement = 0;
            this.sourceAttribute = this.sourceAttribute.substr(0, this.sourceAttribute.length - 2);
            this._sourceIsRGBA = srcSwizzle === ".r";
        }
        else if (srcSwizzle === ".y" || srcSwizzle === ".g")
        {
            srcSwizzled = true;
            this._sourceElement = 1;
            this.sourceAttribute = this.sourceAttribute.substr(0, this.sourceAttribute.length - 2);
            this._sourceIsRGBA = srcSwizzle === ".g";
        }
        else if (srcSwizzle === ".z" || srcSwizzle === ".b")
        {
            srcSwizzled = true;
            this._sourceElement = 2;
            this.sourceAttribute = this.sourceAttribute.substr(0, this.sourceAttribute.length - 2);
            this._sourceIsRGBA = srcSwizzle === ".b";
        }
        else if (srcSwizzle === ".w" || srcSwizzle === ".a")
        {
            srcSwizzled = true;
            this._sourceElement = 3;
            this.sourceAttribute = this.sourceAttribute.substr(0, this.sourceAttribute.length - 2);
            this._sourceIsRGBA = srcSwizzle === ".a";
        }
        else if (this.sourceObject instanceof Tw2Vector4Parameter)
        {
            if (this.sourceAttribute === "v1")
            {
                srcSwizzled = true;
                this._sourceElement = 0;
                this.sourceAttribute = "value";
            }
            else if (this.sourceAttribute === "v2")
            {
                srcSwizzled = true;
                this._sourceElement = 1;
                this.sourceAttribute = "value";
            }
            else if (this.sourceAttribute === "v3")
            {
                srcSwizzled = true;
                this._sourceElement = 2;
                this.sourceAttribute = "value";
            }
            else if (this.sourceAttribute === "v4")
            {
                srcSwizzled = true;
                this._sourceElement = 3;
                this.sourceAttribute = "value";
            }
        }

        let destSwizzle = this.destinationAttribute.substr(-2);
        if (destSwizzle === ".x" || destSwizzle === ".r")
        {
            destSwizzled = true;
            this._destinationElement = 0;
            this.destinationAttribute = this.destinationAttribute.substr(0, this.destinationAttribute.length - 2);
            this._destinationIsRGBA = destSwizzle === ".r";
        }
        else if (destSwizzle === ".y" || destSwizzle === ".g")
        {
            destSwizzled = true;
            this._destinationElement = 1;
            this.destinationAttribute = this.destinationAttribute.substr(0, this.destinationAttribute.length - 2);
            this._destinationIsRGBA = destSwizzle === ".g";
        }
        else if (destSwizzle === ".z" || destSwizzle === ".b")
        {
            destSwizzled = true;
            this._destinationElement = 2;
            this.destinationAttribute = this.destinationAttribute.substr(0, this.destinationAttribute.length - 2);
            this._destinationIsRGBA = destSwizzle === ".b";
        }
        else if (destSwizzle === ".w" || destSwizzle === ".a")
        {
            destSwizzled = true;
            this._destinationElement = 3;
            this.destinationAttribute = this.destinationAttribute.substr(0, this.destinationAttribute.length - 2);
            this._destinationIsRGBA = destSwizzle === ".a";
        }
        else if (this.destinationObject instanceof Tw2Vector4Parameter)
        {
            if (this.destinationAttribute === "v1")
            {
                destSwizzled = true;
                this._destinationElement = 0;
                this.destinationAttribute = "value";
            }
            else if (this.destinationAttribute === "v2")
            {
                destSwizzled = true;
                this._destinationElement = 1;
                this.destinationAttribute = "value";
            }
            else if (this.destinationAttribute === "v3")
            {
                destSwizzled = true;
                this._destinationElement = 2;
                this.destinationAttribute = "value";
            }
            else if (this.destinationAttribute === "v4")
            {
                destSwizzled = true;
                this._destinationElement = 3;
                this.destinationAttribute = "value";
            }
        }

        const
            src = this.sourceObject[this.sourceAttribute],
            dest = this.destinationObject[this.destinationAttribute];

        // Targets must be defined
        if (src === undefined)
        {
            console.dir(this);
            throw new ErrBindingValueUndefined({
                name: this.name,
                objectType: "source",
                property: this.sourceAttribute,
                object: src
            });
        }

        if (dest === undefined)
        {
            console.dir(this);
            throw new ErrBindingValueUndefined({
                name: this.name,
                objectType: "destination",
                property: this.destinationAttribute,
                object: this.destinationObject
            });
        }

        const
            srcIsArr = this._sourceIsArray = isArrayLike(src),
            destIsArr = this._destinationIsArray = isArrayLike(dest),
            con = Tw2ValueBinding;

        let copyFunc;
        if (srcIsArr === destIsArr && typeof src === typeof dest)
        {
            if (!srcIsArr)
            {
                copyFunc = con.CopyValueToValue;
            }
            else if (srcSwizzled)
            {
                copyFunc = destSwizzled ? con.CopyElementToElement : con.ReplicateElement;
            }
            else if (src.length <= dest.length)
            {
                copyFunc = con.CopyArray;
            }
            else if (src.length === 16)
            {
                copyFunc = con.ExtractPos;
            }
        }
        else if (srcIsArr && srcSwizzled && isNumber(dest))
        {
            copyFunc = con.CopyElementToValue;
        }
        else if (destIsArr && isNumber(src))
        {
            copyFunc = destSwizzled ? con.CopyValueToElement : con.ReplicateValue;
        }
        else if (isNumber(src) && isBoolean(dest))
        {
            copyFunc = con.CopyFloatToBoolean;
        }
        else if (isBoolean(src) && isNumber(dest))
        {
            copyFunc = con.CopyBooleanToFloat;
        }

        if (!copyFunc)
        {
            throw new ErrBindingType({ name: this.name });
        }

        this._copyFunc = copyFunc;
    }

    /**
     * CopyValue
     * @param {*} [controller=this]
     */
    CopyValue(controller = this)
    {
        if (this._copyFunc)
        {
            this._copyFunc(this);

            if ("UpdateValues" in this.destinationObject)
            {
                this.destinationObject.UpdateValues({ controller });
            }
            else if ("OnValueChanged" in this.destinationObject)
            {
                this.destinationObject.OnValueChanged({ controller });
            }
        }
    }

    /**
     * Gets the destination target (attribute with swizzles)
     * @returns {String}
     */
    GetDestinationTarget()
    {
        if (!this._copyFunc) return this.destinationAttribute;

        return this.constructor.GetAttribute(
            this.destinationObject,
            this.destinationAttribute,
            this._destinationElement,
            this._destinationIsRGBA
        );
    }

    /**
     * Gets the source target (attribute with swizzles)
     * @returns {String}
     */
    GetSourceTarget()
    {
        if (!this._copyFunc) return this.sourceAttribute;

        return this.constructor.GetAttribute(
            this.sourceObject,
            this.sourceAttribute,
            this._sourceElement,
            this._sourceIsRGBA
        );
    }

    /**
     * Sets source object and attribute
     * @param {*} obj
     * @param {String} attr
     * @param {Number} [element]
     * @param {Boolean} [isRGBA]
     */
    SetSource(obj, attr, element, isRGBA)
    {
        const { object, attribute } = this.constructor.GetTargets(obj, attr, element, isRGBA);
        this.sourceObject = object;
        this.sourceAttribute = attribute;
        this._copyFunc = null;
        //this.UpdateValues();
    }

    /**
     * Sets destination object and attribute
     * @param {*} obj
     * @param {String} attr
     * @param {Number} [element]
     * @param {Boolean} [isRGBA]
     */
    SetDestination(obj, attr, element, isRGBA)
    {
        const { object, attribute } = this.constructor.GetTargets(obj, attr, element, isRGBA);
        this.destinationObject = object;
        this.destinationAttribute = attribute;
        this._copyFunc = null;
        //this.UpdateValues();
    }

    /**
     * Gets a value bindings attribute and swizzles for serialization
     * @param {*} object
     * @param {String} attribute
     * @param {?Number} element
     * @param {Boolean} isRGBA
     * @returns {String}
     */
    static GetAttribute(object, attribute, element, isRGBA)
    {
        // Looks to be deprecated
        if (object instanceof Tw2Vector4Parameter && attribute === "value")
        {
            switch (element)
            {
                case 0:
                    return "v0";

                case 1:
                    return "v1";

                case 2:
                    return "v2";

                case 3:
                    return "v4";

                default:
                    return attribute;
            }
        }

        switch (element)
        {
            case 0:
                return attribute + isRGBA ? ".r" : ".x";

            case 1:
                return attribute + isRGBA ? ".g" : ".y";

            case 2:
                return attribute + isRGBA ? ".b" : ".z";

            case 3:
                return attribute + isRGBA ? ".a" : ".w";

            default:
                return attribute;
        }
    }

    /**
     * Gets target values
     * @param {*} object
     * @param {String} attribute
     * @param {Number} [element]
     * @param {Boolean} [isRGBA]
     * @returns {{object: *, attribute: String}}
     */
    static GetTargets(object, attribute, element, isRGBA)
    {
        // Try to guess if rgba
        if (element !== undefined && isRGBA === undefined)
        {
            isRGBA = attribute.toUpperCase().includes("COLOR");
        }

        // Looks to be depreciated
        if (object instanceof Tw2Vector4Parameter && attribute === "value")
        {
            switch (element)
            {
                case 0:
                    attribute = "v0";
                    break;

                case 1:
                    attribute = "v1";
                    break;

                case 2:
                    attribute = "v2";
                    break;

                case 3:
                    attribute = "v3";
                    break;
            }
        }
        else
        {
            switch (element)
            {
                case 0:
                    attribute += isRGBA ? ".r" : ".x";
                    break;

                case 1:
                    attribute += isRGBA ? ".g" : ".y";
                    break;

                case 2:
                    attribute += isRGBA ? ".b" : ".z";
                    break;

                case 3:
                    attribute += isRGBA ? ".a" : ".w";
                    break;
            }
        }

        return { object, attribute };
    }

    /**
     * CopyValueToValue
     * @param {Tw2ValueBinding} a
     */
    static CopyValueToValue(a)
    {
        a.destinationObject[a.destinationAttribute] = a.sourceObject[a.sourceAttribute] * a.scale + a.offset[0];
    }

    /**
     * CopyArray
     * @param {Tw2ValueBinding} a
     */
    static CopyArray(a)
    {
        let count = Math.min(a.destinationObject[a.destinationAttribute].length, a.sourceObject[a.sourceAttribute].length);
        for (let i = 0; i < count; ++i)
        {
            a.destinationObject[a.destinationAttribute][i] = a.sourceObject[a.sourceAttribute][i] * a.scale + a.offset[i];
        }
    }

    /**
     * CopyElementToElement
     * @param {Tw2ValueBinding} a
     */
    static CopyElementToElement(a)
    {
        a.destinationObject[a.destinationAttribute][a._destinationElement] = a.sourceObject[a.sourceAttribute][a._sourceElement] * a.scale + a.offset[0];
    }

    /**
     * ReplicateValue
     * @param {Tw2ValueBinding} a
     */
    static ReplicateValue(a)
    {
        for (let i = 0; i < a.destinationObject[a.destinationAttribute].length; ++i)
        {
            a.destinationObject[a.destinationAttribute][i] = a.sourceObject[a.sourceAttribute] * a.scale + a.offset[i];
        }
    }

    /**
     * CopyArray
     * @param {Tw2ValueBinding} a
     */
    static ReplicateElement(a)
    {
        for (let i = 0; i < a.destinationObject[a.destinationAttribute].length; ++i)
        {
            a.destinationObject[a.destinationAttribute][i] = a.sourceObject[a.sourceAttribute][a._sourceElement] * a.scale + a.offset[i];
        }
    }

    /**
     * ExtractPos
     * @param {Tw2ValueBinding} a
     */
    static ExtractPos(a)
    {
        for (let i = 0; i < a.destinationObject[a.destinationAttribute].length; ++i)
        {
            a.destinationObject[a.destinationAttribute][i] = a.sourceObject[a.sourceAttribute][i + 12] * a.scale + a.offset[i];
        }
    }

    /**
     * CopyElementToValue
     * @param {Tw2ValueBinding} a
     */
    static CopyElementToValue(a)
    {
        a.destinationObject[a.destinationAttribute] = a.sourceObject[a.sourceAttribute][a._sourceElement] * a.scale + a.offset[0];
    }

    /**
     * CopyValueToElement
     * @param {Tw2ValueBinding} a
     */
    static CopyValueToElement(a)
    {
        a.destinationObject[a.destinationAttribute][a._destinationElement] = a.sourceObject[a.sourceAttribute] * a.scale + a.offset[0];
    }

    /**
     * CopyFloatToBoolean
     * @param {Tw2ValueBinding} a
     */
    static CopyFloatToBoolean(a)
    {
        a.destinationObject[a.destinationAttribute] = a.sourceObject[a.sourceAttribute] !== 0;
    }

    /**
     * CopyFloatToBoolean
     * @param {Tw2ValueBinding} a
     */
    static CopyBooleanToFloat(a)
    {
        a.destinationObject[a.destinationAttribute] = a.sourceObject[a.sourceAttribute] ? 1 : 0;
    }

}


/**
 * Throws when there's an error binding an object
 */
export class ErrBindingValueUndefined extends Tw2Error
{
    constructor(data)
    {
        super(data, "Error binding '%name=unknown%', %objectType%'s property is undefined (%property%)");
    }
}

/**
 * Throws when there's an error binding a value
 */
export class ErrBindingType extends Tw2Error
{
    constructor(data)
    {
        super(data, "Error binding '%name=unknown%', cannot identify binding type");
    }
}

/**
 * Throws when trying to bind an object by it's id and it can't be found
 */
export class ErrBindingReference extends Tw2Error
{
    constructor(data)
    {
        super(data, "Error binding '%name=unknown%', could not find '%object%' object reference");
    }
}
