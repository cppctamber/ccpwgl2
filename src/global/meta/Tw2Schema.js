import { getMetadata, getOwnMetadata } from "../utils/reflect";
import { isArray, isNumber, isString } from "../utils/type";

const CACHE = new Map();

/**
 * Cached constructor metadata schema
 */
export class Tw2Schema
{

    /**
     * Reads optional ui metadata
     * @param {*} target
     * @param {String} name
     * @returns {?Object}
     */
    static CreateUI(target, name)
    {
        const ui = {
            name: getMetadata("uiName", target, name) || null,
            description: getMetadata("uiDescription", target, name) || null,
            group: getMetadata("uiGroup", target, name) || null,
            widget: getMetadata("uiWidget", target, name) || null,
            icon: getMetadata("uiIcon", target, name) || null,
            components: getMetadata("uiComponents", target, name) || null,
            valueMin: getMetadata("uiValueMin", target, name),
            valueMax: getMetadata("uiValueMax", target, name),
            valueStep: getMetadata("uiValueStep", target, name),
            isDisabled: !!getMetadata("uiDisabled", target, name),
            isHidden: !!getMetadata("uiHidden", target, name)
        };

        return ui.name !== null ||
            ui.description !== null ||
            ui.group !== null ||
            ui.widget !== null ||
            ui.icon !== null ||
            ui.components !== null ||
            ui.valueMin !== undefined ||
            ui.valueMax !== undefined ||
            ui.valueStep !== undefined ||
            ui.isDisabled ||
            ui.isHidden ? ui : null;
    }

    /**
     * Gets a cached constructor schema
     * @param {Function} Constructor
     * @returns {Tw2Schema}
     */
    static Get(Constructor)
    {
        let schema = CACHE.get(Constructor);
        if (!schema)
        {
            schema = new Tw2Schema(Constructor);
            CACHE.set(Constructor, schema);
        }
        return schema;
    }

    /**
     * Converts optional metadata lists to arrays
     * @param {*} value
     * @returns {Array}
     */
    static ToArray(value)
    {
        return isArray(value) ? value : [];
    }

    /**
     * Gets a constructor's prototype
     * @param {Function} Constructor
     * @returns {Object}
     */
    static GetPrototype(Constructor)
    {
        return Constructor.prototype;
    }

    /**
     * Reads property metadata into a cached schema item
     * @param {Function} Constructor
     * @param {String} name
     * @returns {?Object}
     */
    static CreateProperty(Constructor, name)
    {
        const
            prototype = Tw2Schema.GetPrototype(Constructor),
            type = getMetadata("type", prototype, name);

        if (!isNumber(type))
        {
            return null;
        }

        const alias = getMetadata("alias", prototype, name);

        return {
            name,
            type,
            propertyTypeName: getMetadata("propertyTypeName", prototype, name) || null,
            blackReaderType: getMetadata("blackReaderType", prototype, name) || null,
            alias: isString(alias) ? alias : null,
            ui: Tw2Schema.CreateUI(prototype, name),
            isPrivate: !!getMetadata("isPrivate", prototype, name),
            isOwned: getMetadata("isOwned", prototype, name) !== false,
            isStruct: false,
            isStructList: false
        };
    }

    /**
     * Reads uncached runtime property metadata
     * @param {*} target
     * @param {String} name
     * @returns {?Object}
     */
    static CreateRuntimeProperty(target, name)
    {
        const type = getMetadata("type", target, name);
        if (!isNumber(type))
        {
            return null;
        }

        const alias = getMetadata("alias", target, name);

        return {
            name,
            type,
            propertyTypeName: getMetadata("propertyTypeName", target, name) || null,
            blackReaderType: getMetadata("blackReaderType", target, name) || null,
            alias: isString(alias) ? alias : null,
            ui: Tw2Schema.CreateUI(target, name),
            isPrivate: !!getMetadata("isPrivate", target, name),
            isOwned: getMetadata("isOwned", target, name) !== false,
            isStruct: false,
            isStructList: false
        };
    }

    /**
     * Gets or creates a cached schema property
     * @param {Tw2Schema} schema
     * @param {String} name
     * @returns {?Object}
     */
    static EnsureProperty(schema, name)
    {
        let property = schema._propertiesByName.get(name);
        if (property)
        {
            return property;
        }

        property = Tw2Schema.CreateProperty(schema._Constructor, name);
        if (property)
        {
            schema._properties.push(property);
            schema._propertiesByName.set(name, property);
        }

        return property;
    }

    /**
     * Constructor
     * @param {Function} Constructor
     */
    constructor(Constructor)
    {
        this._Constructor = Constructor;
        this._type = getMetadata("type", Constructor);
        this._ccp = getMetadata("ccp", Constructor);
        this._definitions = getOwnMetadata("definitions", Constructor) || null;
        this._ui = Tw2Schema.CreateUI(Constructor) || null;
        this._properties = [];
        this._propertiesByName = new Map();
        this._structs = [];
        this._structLists = [];
        this._aliases = new Map();

        const properties = Tw2Schema.ToArray(getMetadata("properties", Constructor));
        for (let i = 0; i < properties.length; i++)
        {
            Tw2Schema.EnsureProperty(this, properties[i]);
        }

        const structs = Tw2Schema.ToArray(getMetadata("structs", Constructor));
        for (let i = 0; i < structs.length; i++)
        {
            const property = Tw2Schema.EnsureProperty(this, structs[i]);
            if (property)
            {
                property.isStruct = true;
                this._structs.push(property);
            }
        }

        const structLists = Tw2Schema.ToArray(getMetadata("structLists", Constructor));
        for (let i = 0; i < structLists.length; i++)
        {
            const property = Tw2Schema.EnsureProperty(this, structLists[i]);
            if (property)
            {
                property.isStructList = true;
                this._structLists.push(property);
            }
        }

        const aliases = Tw2Schema.ToArray(getMetadata("aliases", Constructor));
        for (let i = 0; i < aliases.length; i++)
        {
            const
                name = aliases[i],
                alias = getMetadata("alias", Tw2Schema.GetPrototype(Constructor), name),
                property = this._propertiesByName.get(name);

            if (isString(alias))
            {
                this._aliases.set(name, alias);
                if (property)
                {
                    property.alias = alias;
                }
            }
        }
    }

    /**
     * Gets the legacy serialized type name
     * @returns {*}
     */
    GetType()
    {
        return this._type;
    }

    /**
     * Gets legacy CCP metadata
     * @returns {*}
     */
    GetCCP()
    {
        return this._ccp;
    }

    /**
     * Gets class definitions
     * @returns {?Object}
     */
    GetDefinitions()
    {
        return this._definitions;
    }

    /**
     * Gets cached class ui metadata
     * @returns {?Object}
     */
    GetUI()
    {
        return this._ui;
    }

    /**
     * Gets a class definition
     * @param {String} namespace
     * @returns {?Object}
     */
    GetDefinition(namespace)
    {
        const definitions = this.GetDefinitions();
        return definitions && definitions.namespaces ? definitions.namespaces[namespace] || null : null;
    }

    /**
     * Gets a class definition name
     * @param {String} namespace
     * @returns {?String}
     */
    GetDefinitionName(namespace)
    {
        const definition = this.GetDefinition(namespace);
        return definition && isString(definition.name) ? definition.name : null;
    }

    /**
     * Gets cached struct properties
     * @returns {Array}
     */
    GetStructs()
    {
        return this._structs;
    }

    /**
     * Gets cached struct list properties
     * @returns {Array}
     */
    GetStructLists()
    {
        return this._structLists;
    }

    /**
     * Gets a property's cached ui metadata
     * @param {String} name
     * @param {*} target
     * @returns {?Object}
     */
    GetPropertyUI(name, target)
    {
        const property = this.GetResolvedProperty(name, target);
        return property ? property.ui : null;
    }

    /**
     * Gets a property schema with legacy runtime metadata fallback
     * @param {String} name
     * @param {*} target
     * @returns {?Object}
     */
    GetProperty(name, target)
    {
        return this._propertiesByName.get(name) || (target ? Tw2Schema.CreateRuntimeProperty(target, name) : null);
    }

    /**
     * Gets a configured alias target
     * @param {String} name
     * @param {*} target
     * @returns {?String}
     */
    GetAliasTarget(name, target)
    {
        const alias = this._aliases.get(name);
        if (alias)
        {
            return alias;
        }

        const property = this._propertiesByName.get(name);
        if (property && property.alias)
        {
            return property.alias;
        }

        const runtimeAlias = target ? getMetadata("alias", target, name) : null;
        return isString(runtimeAlias) ? runtimeAlias : null;
    }

    /**
     * Gets a property schema, following alias metadata
     * @param {String} name
     * @param {*} target
     * @returns {?Object}
     */
    GetResolvedProperty(name, target)
    {
        const alias = this.GetAliasTarget(name, target);
        return this.GetProperty(alias || name, target);
    }

}
