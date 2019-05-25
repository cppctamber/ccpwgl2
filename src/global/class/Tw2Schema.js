import {ErrFeatureNotImplemented, Tw2Error} from "../../core/Tw2Error";

/**
 * Stores schemas
 * @type {WeakMap<*, Tw2Schema>}
 */
const PRIVATE = new WeakMap();

/**
 * Tw2StagingSchema
 *
 * @property {String} type
 * @property {*} Constructor
 * @property {*} props
 * @property {*} keys
 * @property {null|{}} watch
 */
export default class Tw2Schema
{

    type = null;
    Constructor = null;
    keys = null;
    props = {name: Tw2Schema.Type.STRING}; // This should be inherited from Tw2BaseClass
    watch = null;

    /**
     * Constructor
     * @param {*} Constructor
     * @param {*} options
     * @param {Function|class} [inherits]
     */
    constructor(Constructor, options = {}, inherits)
    {
        let {
            type = Constructor.name,
            category = Constructor.__category || null,
            isStaging = !!Constructor.__isStaging,
            props = {},
            isLeaf,
            notImplemented,
            watch
        } = options;

        if (inherits)
        {
            const schema = Tw2Schema.get(inherits);
            if (!schema) throw new ErrSchemaUndefined();
            props = Object.assign({}, schema.props, props);
            if (inherits["__isStaging"]) isStaging = true;
            if (inherits["__isLeaf"] && isLeaf === undefined) isLeaf = true; // Don't really need this now...
            category = category || inherits["__category"] || null;
        }

        this.Constructor = Constructor;
        this.type = Type;

        for (const key in props)
        {
            if (props.hasOwnProperty(key))
            {
                this.AddProperty(key, props[key]);
            }
        }

        if (isLeaf === undefined)
        {
            const hasChildren = this.keys && (this.keys.array || this.keys.object);
            isLeaf = !hasChildren;
        }


        // Meta data
        Constructor.__type = type;
        Constructor.__category = category;
        Constructor.__isStaging = isStaging;
        Constructor.__isLeaf = isLeaf;

        if (Object.keys(this.keys).length)
        {
            Constructor.__keys = this.keys;
        }

        // Replace with decorators once their cost in size is reduced
        if (watch)
        {
            for (let i = 0; i < watch.length; i++)
            {
                if (Array.isArray(watch[i]))
                {
                    this.AddWatchedProperty(watch[i][0], watch[i][1]);
                }
                else
                {
                    this.AddWatchedProperty(watch[i], "watching");
                }
            }
        }

        // Catch all
        if (notImplemented && notImplemented.includes("*"))
        {
            notImplemented = [];
            for (const prop in this.props)
            {
                if (this.props.hasOwnProperty(prop))
                {
                    notImplemented.push(prop);
                }
            }
        }

        // Replace with decorators once their cost in size is reduced
        if (notImplemented)
        {
            for (let i = 0; i < notImplemented.length; i++)
            {
                if (Array.isArray(notImplemented[i]))
                {
                    this.AddWatchedProperty(notImplemented[i][0], notImplemented[i][1]);
                }
                else
                {
                    this.AddWatchedProperty(notImplemented[i], "not implemented");
                }
            }
        }
    }

    /**
     * Adds a property and it's opt
     * @param {String} name
     * @param {*|String|Object|Array} opt
     */
    AddProperty(name, opt)
    {
        if (typeof opt === "number")
        {
            opt = {type: opt};
        }
        else if (Array.isArray(opt))
        {
            if (!Array.isArray(opt[0])) opt = {type: Type.OBJECT, elements: opt};
            else opt = {type: Type.ARRAY, elements: opt[0]};
        }
        else if (typeof opt !== "object")
        {
            throw new ErrSchemaTypeInvalid({name});
        }

        // Cache key names
        const typeCategory = Tw2Schema.TypeCategory[opt.type];
        if (typeCategory === undefined) throw new ErrSchemaTypeInvalid({name});

        if (!this.keys) this.keys = {};
        if (!this.keys[typeCategory]) this.keys[typeCategory] = [];
        if (!this.keys[typeCategory].includes(name)) this.keys[typeCategory].push(name);
        this.keys[typeCategory].sort();

        if (opt.type === Tw2Schema.Type.OBJECT || opt.type === Tw2Schema.Type.ARRAY)
        {
            this.constructor.__isLeaf = false;
        }

        opt.name = name;
        this.props[name] = opt;
    }

    /**
     * Adds a property name which needs to be watched
     * @param {String} key
     * @param {String} message
     */
    AddWatchedProperty(key, message)
    {
        if (!this.watch) this.watch = {};
        if (this.watch[key]) this.watch[key] += ", " + message;
        else this.watch[key] = message.charAt(0).toUpperCase() + message.substring(1);
    }

    /**
     * Fires when a base class has been instantiated
     * - For development only
     * @param {*} a
     */
    OnInstantiation(a)
    {
        /*
        if (!Tw2Schema.DEBUG_ENABLED) return;

        // This won't work when using class properties as webpack
        // will redefined properties with Object.defineProperty
        if (this.watch)
        {
            for (const key in this.watch)
            {
                if (this.watch.hasOwnProperty(key))
                {
                    const
                        message = `${this.watch[key]} "${this.type}.${key}"`,
                        setMessage = `${message} (Set)`,
                        getMessage = `${message} (Get)`,
                        isFirst = true;

                    let originalValue = a[key];
                    //Reflect.deleteProperty(a, key);
                    Reflect.defineProperty(a, key, {
                        get: function ()
                        {
                            if (!isFirst)
                            {
                                logger.log({
                                    type: "debug",
                                    name: "Schema",
                                    message: getMessage
                                });
                            }
                            isFirst = false;
                            return originalValue;
                        },
                        set: function (a)
                        {
                            if (!isFirst)
                            {
                                logger.log({
                                    type: "debug",
                                    name: "Schema",
                                    message: setMessage
                                });
                            }
                            isFirst = false;
                            originalValue = a;
                        },
                        configurable: true,
                        enumerable: true
                    });
                }
            }
        }
        */
    }

    /**
     * Gets an object's values as a plain object
     * @param {*} a     - the object to serialize
     * @param {*} [out] - the receiving object
     * @param {*} [opt] - get options
     * @returns {*} out - the serialized object
     */
    GetValues(a, out, opt)
    {
        throw new ErrFeatureNotImplemented();
    }

    /**
     * Sets an object's values from a plain object
     * @param {*} a        - the object to deserialize to
     * @param {*} [values] - the values to deserialize
     * @param {*} [opt]    - set options
     * @returns {Boolean} true if changed
     */
    SetValues(a, values, opt)
    {
        throw new ErrFeatureNotImplemented();
    }

    /**
     * Gets a constructor's schema
     * @param {*} Constructor
     * @returns {?Tw2Schema}
     */
    static get(Constructor)
    {
        return Constructor ? PRIVATE.get(Constructor) : null;
    }

    /**
     * Sets a constructor's schema
     * @param {*} Constructor
     * @param {Tw2Schema} schema
     * @returns {Boolean}
     */
    static set(Constructor, schema)
    {
        if (!Constructor) return false;

        if (this.has(Constructor))
        {
            throw new ErrSchemaDefinition({type: this.get(Constructor).type});
        }

        PRIVATE.set(Constructor, schema);
        return true;
    }

    /**
     * Checks if a constructor's schema exits
     * @param {*} Constructor
     * @returns {boolean}
     */
    static has(Constructor)
    {
        return Constructor ? PRIVATE.has(Constructor) : false;
    }

    /**
     * Creates a constructor's schema
     * @param {*} Constructor
     * @param {Function} func
     * @param {Function} [inherits]
     */
    static create(Constructor, func, inherits)
    {
        this.set(Constructor, new Tw2Schema(Constructor, func(this.Type), inherits));
    }

    /**
     * Enables debug mode
     * @type {boolean}
     */
    static DEBUG_ENABLED = true;

}

/**
 * Schema types
 * Todo: Replace with Tw2SchemaType object.type
 * @type {*}
 */
const Type = Tw2Schema.Type = {
    BOOLEAN: 0,
    STRING: 1,
    NUMBER: 2,
    ARRAY: 3,
    OBJECT: 4,
    PLAIN: 5,
    REF: 7,
    PATH: 8,
    EXPRESSION: 9,
    VECTOR2: 11,
    VECTOR3: 12,
    VECTOR4: 13,
    QUATERNION: 14,
    MATRIX3: 15,
    MATRIX4: 16,
    TYPED: 20,    // Unfixed length
    FLOAT32: 21,  // Unfixed length  
    RGBA: 30,
    RGBA_LINEAR: 31,
    TR_ROTATION: 100,
    TR_SCALING: 101,
    TR_TRANSLATION: 102,
    TR_LOCAL: 103,
    TR_WORLD: 104
};

/**
 * Todo: Replace with Tw2SchemaType object.typeCategory
 * @type {*}
 */
Tw2Schema.TypeCategory = {
    [Type.ARRAY]: "array",
    [Type.OBJECT]: "object",
    [Type.PLAIN]: "plain",
    //[Type.REF]: "ref",
    // Primary
    [Type.BOOLEAN]: "primary",
    [Type.STRING]: "primary",
    [Type.NUMBER]: "primary",
    [Type.PATH]: "primary",
    [Type.EXPRESSION]: "primary",
    // Any length typed
    [Type.TYPED]: "typed",
    [Type.FLOAT32]: "typed",
    // Fixed length typed
    [Type.VECTOR2]: "typed",
    [Type.VECTOR3]: "typed",
    [Type.VECTOR4]: "typed",
    [Type.QUATERNION]: "typed",
    [Type.MATRIX3]: "typed",
    [Type.MATRIX4]: "typed",
    [Type.RGBA]: "typed",
    [Type.RGBA_LINEAR]: "typed",
    [Type.TR_ROTATION]: "typed",
    [Type.TR_SCALING]: "typed",
    [Type.TR_TRANSLATION]: "typed",
    [Type.TR_LOCAL]: "typed",
    [Type.TR_WORLD]: "typed",
};

/**
 * Throws when trying to register a class/constructor's schema more than once
 */
class ErrSchemaDefinition extends Tw2Error
{
    constructor(data)
    {
        super(data, "Cannot redefine schema (%type%)");
    }
}

/**
 * Throws when a schema is expected but it's undefined
 */
class ErrSchemaUndefined extends Tw2Error
{
    constructor(data)
    {
        super(data, "Class has no schema");
    }
}

/**
 * Throws when a schema type is invalid
 */
class ErrSchemaTypeInvalid extends Tw2Error
{
    constructor(data)
    {
        super(data, "Invalid schema type (%name%)");
    }
}