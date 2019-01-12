import {ErrFeatureNotImplemented, Tw2Error} from "../../core/Tw2Error";
import {logger} from "../engine";

/**
 * Stores schemas
 * @type {WeakMap<*, Tw2Schema>}
 */
const PRIVATE = new WeakMap();

/**
 * Tw2StagingSchema
 *
 * @property {String} type
 * @property {*} props
 * @property {*} cache
 */
export default class Tw2Schema
{

    type = null;
    Constructor = null;
    cache = null;
    props = {
        name: Tw2Schema.Type.STRING
    };
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
            category = null,
            isStaging = false,
            isLeaf = false,
            props = {},
            notImplemented,
            watch
        } = options;

        if (inherits)
        {
            const schema = Tw2Schema.get(inherits);
            if (!schema) throw new ErrSchemaUndefined();
            Object.assign(this.props, schema.props);
            if (inherits["__isStaging"]) isStaging = true;
            category = category || inherits["__category"] || null;
        }

        Object.defineProperties(this, {
            Constructor: {value: Constructor},
            type: {value: type}
        });

        Object.defineProperties(Constructor, {
            __type: {value: type},
            __category: {value: category},
            __isStaging: {value: isStaging},
            __isLeaf: {value: isLeaf}
        });

        Object.assign(this.props, props);

        /*
        this.NormalizeProps();
        this.CacheProps();
        */

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
     * Adds a property name which needs to be watched
     * @param {String} key
     * @param {String} message
     */
    AddWatchedProperty(key, message)
    {
        if (!this.watch) this.watch = {};

        if (this.watch[key])
        {
            this.watch[key] += ", " + message;
        }
        else
        {
            this.watch[key] = message.charAt(0).toUpperCase() + message.substring(1);
        }
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
     * Normalizes the schema's props
     */
    NormalizeProps()
    {
        throw new ErrFeatureNotImplemented();
    }

    /**
     * Caches props for performance
     */
    CacheProps()
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

    /**
     * Schema types
     * @type {*}
     */
    static Type = {
        BOOLEAN: 0,
        STRING: 1,
        NUMBER: 2,
        ARRAY: 3,
        OBJECT: 4,
        PLAIN: 5,
        TYPE: 6,
        REF: 7,
        PATH: 8,
        EXPRESSION: 9,
        VECTOR: 10,
        VECTOR2: 11,
        VECTOR3: 12,
        VECTOR4: 13,
        QUATERNION: 14,
        MATRIX3: 15,
        MATRIX4: 16,
        FLOAT32: 20,
        RGBA: 30,
        RGBA_LINEAR: 31,
        TR_ROTATION: 100,
        TR_SCALING: 101,
        TR_TRANSLATION: 102,
        TR_LOCAL: 103,
        TR_WORLD: 104
    };

}

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