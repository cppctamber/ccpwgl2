import { createLinearColor, overrideConstant, WidgetType } from "./util";


export const Time = {
    name: "Time",
    value: [ 0, 0, 0, 0 ],
    ui: {
        group: "Global",
        components: [
            "current time",
            "current time fract",
            "frame",
            "previous time"
        ],
        widget: WidgetType.MIXED,
        display: 0
    }
};

/*------------------------------------------------------------------------------------------------- global ----------*/

export const G_TEXEL_SIZE = {
    name: "g_texelSize",
    value: [ 0, 0, 0, 0 ],
    isAutoregister: 1,
    ui: {
        group: "Global",
        description: "Texel size : 1/width, 1/height",
        components: [
            "texel width",
            "texel height",
            "width",
            "height"
        ],
        widget: WidgetType.MIXED,
        display: 0
    }
};

export const G_CAMERA = {
    name: "g_camera",
    value: [ 0, 0, 0, 0 ],
    isAutoregister: 1,
    ui: {
        group: "Global",
        components: [
            "near plane",
            "far plane",
            "fov",
            "depth mode"
        ],
        widget: WidgetType.MIXED,
        display: 0
    }
};


/*------------------------------------------------------------------------------------------------- plane ------------*/


export const PlaneCornerOffset = {
    name: "PlaneCornerOffset",
    value: [ -0.5, -0.5, 0, 0, 0.5, -0.5, 0, 0, 0.5, 0.5, 0, 0, -0.5, 0.5, 0, 0 ],
    dimension: 4,
    elements: 4,
    size: 16,
};

export const PlaneTexCoord = {
    name: "PlaneTexCoord",
    value: [ 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0 ],
    dimension: 4,
    elements: 4,
    size: 16,
};

export const PlaneNormal = {
    name: "PlaneNormal",
    value: [ 0, 0, 1, 0 ],
};

export const PlaneData = {
    name: "PlaneData",
    value: [ 1, 1, 0, 0 ],
};


/*------------------------------------------------------------------------------------------------- general ----------*/


export const MainIntensity = {
    name: "MainIntensity",
    value: [ 1, 0, 0, 0 ],
    ui: {
        group: "None",
        description: "main intensity of the whole set",
        width: WidgetType.MIXED
    }
};

export const ZOffset = {
    name: "zOffset",
    value: [ 0, 0, 0, 0 ],
    ui: {
        group: "None",
        description: "Offsets z",
        widget: WidgetType.MIXED
    }
};


/*------------------------------------------------------------------------------------------------- object ----------*/


export const ObjectID = {
    name: "objectId",
    value: [ 0, 0, 0, 0 ],
    ui: {
        display: 0,
        components: [
            "object id"
        ]
    }
};

export const AreaID = {
    name: "areaId",
    value: [ 0, 0, 0, 0 ],
    ui: {
        display: 0,
        components: [
            "area id"
        ]
    }
};


/*------------------------------------------------------------------------------------------------- fx ---------------*/

export const BaseColor = createLinearColor({ name: "BaseColor", ui: { group: "FX" } });

export const Layer1Scroll = {
    name: "Layer1Scroll",
    value: [ 1, 1, 0, 0 ],
    ui: {
        group: "Layer 1",
        description: "Layer scroll speed and offset",
        components: [
            "scrollSpeedU",
            "scrollSpeedV",
            "scrollOffsetU",
            "scrollOffsetV"
        ],
        widget: WidgetType.MIXED
    }
};

export const Layer1Transform = {
    name: "Layer1Transform",
    value: [ 1, 1, 0, 0 ],
    ui: {
        group: "Layer 1",
        description: "Layer scale and offset",
        components: [
            "scaleU",
            "scaleV",
            "offsetU",
            "offsetV"
        ],
        widget: WidgetType.MIXED,
    }
};

export const Layer2Scroll = overrideConstant(Layer1Scroll, {
    name: "Layer2Scroll",
    ui: {
        group: "Layer 2"
    }
});

export const Layer2Transform = overrideConstant(Layer1Transform, {
    name: "Layer2Transform",
    ui: {
        group: "Layer 2"
    }
});

