import { createDecorator, defineMetadata, getMetadata, hasMetadata, isString } from "global/util";
import { ErrAbstractMethod, ErrSingletonInstantiation } from "core/Tw2Error";


export const has = function(name, target, property)
{
    return hasMetadata(name, target, property);
};

export const get = function(name, target, property)
{
    return getMetadata(name, target, property);
};

export const set = function(name, value, target, property)
{
    return defineMetadata(name, value, target, property);
};

export const abstract = createDecorator({
    noArgs: true,
    ctor({ target })
    {
        defineMetadata("abstract", true, target);
        return target;
    },
    method({ target, property, descriptor })
    {
        defineMetadata("abstract", true, target, property);
        descriptor.value = function()
        {
            throw new ErrAbstractMethod({ class: this.constructor.name, method: property });
        };
        return descriptor;
    }
});

export const singleton = createDecorator({
    noArgs: true,
    ctor({ target })
    {
        let count = 0;
        return class Singleton extends target
        {
            constructor(...args)
            {
                count++;
                if (count > 1) throw new ErrSingletonInstantiation({ class: target.name });
                super(...args);
            }
        };
    }
});

/**
 * Constructors by type
 * @type {Map<String, any>}
 */
const byType = new Map();

/**
 * Types by constructor
 * @type {Map<any, String>}
 */
const byCtor = new Map();

export const ctor = createDecorator({
    ctor({ target }, ...types)
    {
        for (let i = 0; i < types.length; i++)
        {
            if (isString(types[i]))
            {
                byType.set(types[i], target);

                if (i === 0)
                {
                    byCtor.set(target, types[i]);
                    defineMetadata("type", types[i], target);

                    // Temporary
                    if (!target.getOwnTw2Type)
                    {
                        target.getOwnTw2Type = function()
                        {
                            return ctor.getType(this);
                        };

                        target.getTw2Type = function(Ctor)
                        {
                            return ctor.getType(Ctor);
                        };

                        target.getTw2Ctor = function(type)
                        {
                            return ctor.getCtor(type);
                        };
                    }
                }
            }
        }
    }
});

ctor.getCtor = function(type)
{
    return byType.get(type);
};

ctor.getType = function(Ctor)
{
    return byCtor.get(Ctor);
};

ctor.getValues = function()
{
    const out = {};
    for (const [ type, ctor ] of byType)
    {
        out[type] = ctor;
    }
    return out;
};

export const data = createDecorator({
    handler({ target, property }, value)
    {
        if (hasMetadata("data", target, property))
        {
            Object.assign({}, getMetadata("data", target, property), value);
        }

        defineMetadata("data", value, target, property);
    }
});

export const isPrivate = createDecorator({
    noArgs: true,
    property({ target, property })
    {
        defineMetadata("isPrivate", true, target, property);
    }
});

export const desc = createDecorator({
    handler({ target, property }, description)
    {
        defineMetadata("desc", description, target, property);
    }
});

export const todo = createDecorator({
    handler({ target, property }, todo, stage = 1)
    {
        defineMetadata("todo", todo, target, property);
        const currentStage = getMetadata("stage", target, property) || 0;
        defineMetadata("stage", Math.max(stage, currentStage), target, property);
    }
});

export const partialImplementation = createDecorator({
    noArgs: true,
    handler({ target, property })
    {
        defineMetadata("stage", 2, target, property);
    }
});

export const notImplemented = createDecorator({
    noArgs: true,
    handler({ target, property })
    {
        defineMetadata("stage", 3, target, property);
    }
});

export const stage = createDecorator({
    ctor({ target, property }, stage=0)
    {
        defineMetadata("stage", stage, target, property);
    }
});
