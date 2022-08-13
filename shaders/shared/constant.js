import { WidgetType } from "./util";


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
    name: "g_texel_size",
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
        display: 0
    }
};

export const AreaID = {
    name: "areaId",
    value: [ 0, 0, 0, 0 ],
    ui: {
        display: 0
    }
};
