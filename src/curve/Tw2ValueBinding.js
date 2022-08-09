import { getKeyFromValue, meta } from "utils";
import { vec4 } from "math";
import { Tw2Vector4Parameter, Tw2Error } from "core";
import { isArrayLike, isBoolean, isNumber } from "utils";


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
 * @property {Number|Array|null} _destinationElement  -
 * @property {Boolean} _destinationIsArray -
 * @property {Boolean} _destinationIsRGBA  -
 * @property {Number|Array|null} _sourceElement       -
 * @property {Boolean} _sourceIsArray      -
 * @property {Boolean} _sourceIsRGBA       -
 */
@meta.type("Tw2ValueBinding", "TriValueBinding")
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

        let srcSwizzled = false,
            destSwizzled = false;

        const s = Tw2ValueBinding.FromAttribute(this.sourceAttribute);
        if (s.swizzle)
        {
            srcSwizzled = true;
            this._sourceElement = s.element;
            this._sourceIsRGBA = [ "r", "g", "b", "a" ].includes(s.swizzle);
            this.sourceAttribute = s.attr;
        }

        const d = Tw2ValueBinding.FromAttribute(this.destinationAttribute);
        if (d.swizzle)
        {
            destSwizzled = true;
            this._destinationElement = d.element;
            this._sourceIsRGBA = [ "r", "g", "b", "a" ].includes(d.swizzle);
            this.destinationAttribute = d.attr;
        }

        const
            src = this.sourceObject[this.sourceAttribute],
            dest = this.destinationObject[this.destinationAttribute];

        // Targets must be defined
        if (src === undefined)
        {
            console.dir(new ErrBindingValueUndefined({
                name: this.name,
                objectType: "source",
                property: this.sourceAttribute,
                object: this.sourceObject
            }));
            return;
        }

        if (dest === undefined)
        {
            console.dir(new ErrBindingValueUndefined({
                name: this.name,
                objectType: "destination",
                property: this.destinationAttribute,
                object: this.destinationObject
            }));
            return;
        }

        const
            srcIsArr = this._sourceIsArray = isArrayLike(src),
            destIsArr = this._destinationIsArray = isArrayLike(dest),
            con = Tw2ValueBinding;

        const
            se = isArrayLike(this._sourceElement),
            de = isArrayLike(this._destinationElement);

        if (se || de)
        {
            if (!srcIsArr || !destIsArr)
            {
                throw new Error("Invalid swizzle(s), expected two arrays");
            }

            if (se && !de)
            {
                this._destinationElement = [];
                for (let i = 0; i < this._destinationElement.length; i++)
                {
                    this._destinationElement[i] = i;
                }
            }
            else if (!se && de)
            {
                this._sourceElement = [];
                for (let i = 0; i < this._sourceElement.length; i++)
                {
                    this._sourceElement[i] = i;
                }
            }

            this._copyFunc = Tw2ValueBinding.CopySwizzledArrays;
            return;
        }

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

                if (isArrayLike(element))
                {
                    let swizzle = ".";
                    for (let i = 0; i < element.length; i++)
                    {
                        let value = getKeyFromValue(this.CharacterSwizzle, element[i]);
                        if (value === undefined) throw new Error("Unknown swizzle source: " + element[i]);
                        swizzle += value;
                    }
                    return attribute + swizzle;
                }

                return attribute;
        }
    }

    /**
     * Gets target values
     * TODO: What is this for?
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

        attribute = this.GetAttribute(object, attribute, element, isRGBA);

        return { object, attribute };
    }

    /**
     * Standard swizzles
     * @type {{a: number, r: number, b: number, g: number, w: number, x: number, y: number, z: number}}
     */
    static CharacterSwizzle = {
        x: 0,
        r: 0,
        y: 1,
        g: 1,
        z: 2,
        b: 2,
        w: 3,
        a: 3
    };

    /**
     * Vector4 Swizzles
     * @type {{v1: number, v2: number, v3: number, v4: number}}
     */
    static Vector4Swizzle = {
        v1: 0,
        v2: 1,
        v3: 2,
        v4: 3
    };

    /**
     * Gets binding data from an attribute
     * @param {String} attr
     * @return {{swizzle: string, attr: string, element: *}|{attr: *}|{swizzle: string, attr: string, element: []}}
     */

    /**
     * Gets swizzle data
     * @param {String} attr
     * @return {{attr: string, element: string|Array|null, swizzle: string|null }}
     */
    static FromAttribute(attr)
    {

        const { Vector4Swizzle, CharacterSwizzle } = Tw2ValueBinding;

        let str = attr.split(".")[1];

        if (!str || !str.length)
        {
            return {
                attr,
                element: null,
                swizzle: null
            };
        }

        str = str.toLowerCase();

        if (str in Vector4Swizzle)
        {
            return {
                attr: "value",
                element: Vector4Swizzle[str],
                swizzle: str
            };
        }

        if (str in CharacterSwizzle)
        {
            return {
                attr: attr.substring(0, attr.length - 2),
                element: CharacterSwizzle[str],
                swizzle: str
            };
        }

        if (str.length === 1)
        {
            throw new Error("Invalid swizzle: " + str);
        }

        let element = [];
        for (let i = 0; i < str.length; i++)
        {
            element[i] = CharacterSwizzle[str[i].toLowerCase()];
            if (element[i] === undefined)
            {
                throw new Error("Invalid swizzle: " + str);
            }
        }

        return {
            attr: attr.substring(0, attr.length - str.length - 1),
            element,
            swizzle: str
        };
    }
    
    /**
     * Copies swizzled arrays
     * @param {Tw2ValueBinding} a
     */
    static CopySwizzledArrays(a)
    {
        const
            src = a.sourceObject[a.sourceAttribute],
            dest = a.destinationObject[a.destinationAttribute],
            se = a._sourceElement,
            de = a._destinationElement;

        const len = Math.min(se.length, de.length);

        for (let i = 0; i < len; i++)
        {
            if (dest[de[i]] === undefined || src[se[i]] === undefined)
            {
                throw new Error("Invalid swizzle(s)");
            }

            dest[de[i]] = src[se[i]] * a.scale + a.offset[0];
        }
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
