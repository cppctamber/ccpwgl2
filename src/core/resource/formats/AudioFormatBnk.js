import { CjsBnkFormat } from "@carbonenginejs/runtime-resource/formats/bnk";

/**
 * Wwise soundbank format, backed by @carbonenginejs/runtime-resource.
 * Banks carry embedded wem media in their DIDX/DATA sections; members are
 * addressed either through the parsed bank or by the byte windows recorded
 * in a carbonenginejs.audioLibrary document's embeddedMedia records.
 */
export class AudioFormatBnk
{

    /**
     * The format's name
     * @type {String}
     */
    static formatName = "bnk";

    /**
     * The format's file extensions
     * @type {Array<String>}
     */
    static exts = [ "bnk" ];

    /**
     * Checks bank magic bytes
     * @param {Uint8Array} bytes
     * @return {Boolean}
     */
    static isBNK(bytes)
    {
        return CjsBnkFormat.isBNK(bytes);
    }

    /**
     * Parses a bank
     * @param {Uint8Array} bytes
     * @return {*}
     */
    static read(bytes)
    {
        return CjsBnkFormat.read(bytes);
    }

    /**
     * Extracts one embedded media member from a parsed bank
     * @param {*} bank
     * @param {Number|String} mediaID
     * @return {*}
     */
    static extractMedia(bank, mediaID)
    {
        return CjsBnkFormat.extractMedia(bank, mediaID);
    }

    /**
     * Slices one embedded media member by an audio library byte window
     * @param {Uint8Array} bankBytes
     * @param {Number} offset
     * @param {Number} byteLength
     * @return {Uint8Array}
     */
    static SliceMedia(bankBytes, offset, byteLength)
    {
        return bankBytes.subarray(offset, offset + byteLength);
    }

}
