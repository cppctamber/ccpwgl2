import { ErrAbstractClass, ErrAbstractMethod, ErrSingletonInstantiation } from "core/Tw2Error";
import { decorate, typeHandler } from "./helpers";
import { set, get, has } from "./meta";

export const abstract = decorate({
    class({ target })
    {
        return class Abstract extends target
        {
            constructor()
            {
                super();

                if (this.constructor === Abstract)
                {
                    throw new ErrAbstractClass({ class: target.name });
                }

            }
        };
    },
    method({ property, descriptor })
    {
        descriptor.value = function()
        {
            throw new ErrAbstractMethod({ class: this.constructor.name, method: property });
        };
        return descriptor;
    }
})();

export const singleton = decorate({
    class({ target })
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
})();

export const ccp = decorate({
    class({ target }, value)
    {
        set("ccp", value, target);
    }
});

/**
 * Creates a property type decorator
 * @param {String|Number} type
 * @returns {*}
 */
export const type = decorate({
    class({ target }, type, ccpType)
    {
        set("type", type, target);
        if (ccpType)
        {
            if (ccpType === true) ccpType = type;
            set("ccp", ccpType, target);
        }
    },
    property({ target, property, descriptor }, type, typeOf)
    {
        typeHandler({ target, property, descriptor }, type, typeOf);
    }
});

export const stage = decorate({
    class({ target }, value)
    {
        set("stage", value, target);
        if (value > 3) set("notImplemented", true, target);
    }
});

export const notImplemented = decorate({
    class({ target })
    {
        set("notImplemented", true, target);
        set("stage", 4, target);
        // Todo: Flag all children as not implemented
        todo("Implement")(target);
    },
    handler({ target, property })
    {
        set("notImplemented", true, target, property);
        let stage = get("stage", target.constructor) || 0;
        set("stage", Math.max(stage, 1), target.constructor);
        todo("Implement")(target, property);
    }
})();

export const todo = decorate({
    handler({ target, property }, value)
    {
        if (property)
        {
            // Add all child todos to the parent
            let parentTodo = `[${property}] ` + value,
                parentTodos = has("todo", target.constructor) ? get("todo", target.constructor) : [];

            if (!parentTodos.includes(parentTodo)) parentTodos.push(parentTodo);
            parentTodos.sort();

            set("todos", parentTodo, target.constructor);
        }

        let todos = has("todo", target, property) ? get("todo", target, property) : [];
        if (!todos.includes(value)) todos.push(value);
        todos.sort();

        set("todo", todos, target, property);
    }
});

export const desc = decorate({
    handler({ target, property }, value)
    {
        set("desc", value, target, property);
    }
});

export const isPrivate = decorate({
    class: false,
    handler({ target, property })
    {
        set("isPrivate", true, target, property);
    }
})();

export const isNullable = decorate({
    class: false,
    handler({ target, property })
    {
        set("isNullable", true, target, property);
    }
})();

export const test = decorate({
    class: false,
    handler({ target, property, descriptor }, string = "Test decorator")
    {
        console.dir(target);
        console.dir(property);
        console.dir(descriptor);
        throw new Error(string);
    }
});
