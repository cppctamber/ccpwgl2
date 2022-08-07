import { texture2DLodPolyfill, texture2DLod, precision, saturate } from "../../shared/func";
import { shadowHeader, shadowFooter } from "../../shared/ps";
export { shadowFooter };


export const headerNoShadow = `

    ${texture2DLod}
    ${precision}
    ${texture2DLodPolyfill}
    ${saturate}

`;

export const header = `

    ${headerNoShadow}
    ${shadowHeader}
    
`;