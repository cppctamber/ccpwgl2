import { defineMetadata } from "../utils/reflect";
import { createDecorator } from "../utils/decorator";

export const uiGroup = createDecorator({
    property({ target, property }, group)
    {
        defineMetadata("uiGroup", group, target, property);
    }
});

export const uiDescription = createDecorator({
    property({ target, property }, description)
    {
        defineMetadata("uiDescription", description, target, property);
    }
});

export const uiName = createDecorator({
    property({ target, property }, name)
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