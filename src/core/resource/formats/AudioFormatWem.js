import { CjsWemFormat } from "@carbonenginejs/runtime-resource/formats/wem";

/**
 * Wwise wem audio format, backed by @carbonenginejs/runtime-resource.
 * Vorbis-in-wem converts to a standard Ogg container for native browser
 * decoding; PTADPCM decodes to raw PCM channel data.
 */
export class AudioFormatWem
{

    /**
     * The format's name
     * @type {String}
     */
    static formatName = "wem";

    /**
     * The format's file extensions
     * @type {Array<String>}
     */
    static exts = [ "wem" ];

    /**
     * Converts vorbis wem bytes to a standard ogg container
     * @param {Uint8Array} bytes
     * @return {*}
     */
    static toOgg(bytes)
    {
        return CjsWemFormat.toOgg(bytes);
    }

    /**
     * Decodes ptadpcm/pcm wem bytes to raw channel data
     * @param {Uint8Array} bytes
     * @return {*}
     */
    static toPcm(bytes)
    {
        return CjsWemFormat.toPcm(bytes);
    }

    /**
     * Content-verified codec resolution
     * @param {Uint8Array} bytes
     * @return {Promise<*>}
     */
    static resolveType(bytes)
    {
        return CjsWemFormat.resolveType(bytes);
    }

    /**
     * Decodes wem bytes into a WebAudio buffer
     * @param {Uint8Array} bytes
     * @param {AudioContext} context
     * @return {Promise<AudioBuffer>}
     */
    static async DecodeAudioBuffer(bytes, context)
    {
        try
        {
            const ogg = AudioFormatWem.toOgg(bytes);
            return await context.decodeAudioData(ogg.bytes.slice().buffer);
        }
        catch (err)
        {
            const pcm = AudioFormatWem.toPcm(bytes);
            const buffer = context.createBuffer(pcm.channels, pcm.sampleCount, pcm.sampleRate);
            pcm.channelData.forEach((data, channel) => buffer.copyToChannel(data, channel));
            return buffer;
        }
    }

}
