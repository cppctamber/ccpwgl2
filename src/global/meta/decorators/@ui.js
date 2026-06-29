import { defineMetadata } from "../../utils/reflect";
import { createDecorator } from "../../utils/decorator";

const uiKeys = {
    name: "uiName",
    desc: "uiDescription",
    description: "uiDescription",
    group: "uiGroup",
    widget: "uiWidget",
    icon: "uiIcon",
    components: "uiComponents",
    minValue: "uiValueMin",
    valueMin: "uiValueMin",
    maxValue: "uiValueMax",
    valueMax: "uiValueMax",
    step: "uiValueStep",
    valueStep: "uiValueStep",
    disabled: "uiDisabled",
    hidden: "uiHidden"
};

export const ui = createDecorator({
    handler({ target, property }, options)
    {
        for (const key in options)
        {
            if (options.hasOwnProperty(key) && uiKeys[key])
            {
                defineMetadata(uiKeys[key], options[key], target, property);
            }
        }
    }
});

export const uiGroup = createDecorator({
    property({ target, property }, group)
    {
        defineMetadata("uiGroup", group, target, property);
    }
});

export const uiDescription = createDecorator({
    handler({ target, property }, description)
    {
        defineMetadata("uiDescription", description, target, property);
    }
});

export const uiDesc = uiDescription;

export const uiName = createDecorator({
    handler({ target, property }, name)
    {
        defineMetadata("uiName", name, target, property);
    }
});

export const uiValueMin = createDecorator({
    property({ target, property }, value)
    {
        defineMetadata("uiValueMin", value, target, property);
    }
});

export const uiValueMax = createDecorator({
    property({ target, property }, value)
    {
        defineMetadata("uiValueMax", value, target, property);
    }
});

export const uiValueStep = createDecorator({
    property({ target, property }, value)
    {
        defineMetadata("uiValueStep", value, target, property);
    }
});

export const uiComponents = createDecorator({
    property({ target, property }, ...components)
    {
        defineMetadata("uiComponents", components, target, property);
    }
});

export const uiWidget = createDecorator({
    property({ target, property }, widget)
    {
        defineMetadata("uiWidget",widget, target, property);
    }
});

export const uiIcon = createDecorator({
    handler({ target, property }, icon)
    {
        defineMetadata("uiIcon", icon, target, property);
    }
});

export const uiDisabled = createDecorator({
    noArgs: true,
    property({ target, property })
    {
        defineMetadata("uiDisabled", true, target, property);
    }
});

export const uiHidden = createDecorator({
    noArgs: true,
    property({ target, property })
    {
        defineMetadata("uiHidden", true, target, property);
    }
});
