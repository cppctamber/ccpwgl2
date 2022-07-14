import { texture2DLodPolyfill, texture2DLod, precision, saturate } from "../../shared/func";
import { shadowHeader, shadowFooter } from "../../shared/ps";


export const header = `

    ${texture2DLod}
    ${precision}
    ${texture2DLodPolyfill}
    ${saturate}
    ${shadowHeader}
    
`;

export const footer = `

    ${shadowFooter}

`;

