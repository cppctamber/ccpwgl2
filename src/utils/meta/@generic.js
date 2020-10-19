import { Tw2Error } from "core/Tw2Error";
import { createDecorator, defineMetadata, getMetadata, hasMetadata } from "../reflect";

/**
 * Throws when a class can only be instantiated once
 */
export class ErrSingletonInstantiation extends Tw2Error
{
    constructor(data)
    {
        super(data, "Cannot re-instantiate singleton (%class%)");
    }
}

/**
 * Throws when an abstract classes' method is not implemented directly on a child class
 */
export class ErrAbstractClass extends Tw2Error
{
    constructor(data)
    {
        super(data, "Abstract class cannot be directly instantiated (%class%)");
    }
}

/**
 * Throws when an abstract classes' method is not implemented directly on a child class
 */
export class ErrAbstractMethod extends Tw2Error
{
    constructor(data)
    {
        super(data, "Abstract class method not implemented on class '%class%': (%method%)");
    }
}

export const abstract = createDecorator({
    noArgs: true,
    ctor({ target })
    {
        //defineMetadata("abstract", true, target);
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

export const ctor = createDecorator({
    ctor({ target }, type, ccp=type)
    {
        defineMetadata("type", type, target);
        defineMetadata("ccp", ccp, target);
    }
});

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

export const readOnly = createDecorator({
    noArgs: true,
    property({ descriptor })
    {
        descriptor.writable = false;
        descriptor.enumerable = false;
        return descriptor;
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
    handler({ target, property }, todo, stage = 0)
    {
        defineMetadata("todo", todo, target, property);

        if (stage !== 0)
        {
            const currentStage = getMetadata("stage", target, property) || 0;
            defineMetadata("stage", Math.max(stage, currentStage), target, property);
        }
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
    ctor({ target, property }, stage = 0)
    {
        defineMetadata("stage", stage, target, property);
    }
});
