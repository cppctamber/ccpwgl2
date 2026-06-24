import * as generic from "./decorators/@generic";
import * as type from "./decorators/@type";
import * as ui from "./decorators/@ui";
import { createMetaNamespace } from "./decorators/namespace";
import { Model as BaseModel } from "./Model";

const coreMetadata = {
    ...type,
    ...generic,
    ...ui
};

const METADATA_VERSION = "1.0.0";

const ccpMetadata = {
    ...coreMetadata,
    type: (...args) => type.createTypeDecorator("ccp", ...args)
};

const wglMetadata = {
    ...coreMetadata,
    type: (...args) => type.createTypeDecorator("wgl", ...args)
};

const ccp = createMetaNamespace(ccpMetadata, "ccp", { version: METADATA_VERSION });
const wgl = createMetaNamespace(wglMetadata, "wgl", { version: METADATA_VERSION });

export * from "./decorators";
export { ccp, wgl };
export { BaseModel as Model };
