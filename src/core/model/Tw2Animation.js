/**
 * Tw2Animation
 *
 * @property {Tw2GeometryAnimation} animationRes
 * @property {Number} time
 * @property {Number} timeScale
 * @property {Boolean} cycle
 * @property {Boolean} isPlaying
 * @property {Function} callback - Stores optional callback passed to prototypes
 * @property {Array} trackGroups - Array of {@link Tw2TrackGroup}
 */
export class Tw2Animation
{

    animationRes = null;
    time = 0;
    timeScale = 1.0;
    cycle = false;
    isPlaying = false;
    callback = null;
    trackGroups = [];


    /**
     * Checks to see if the animation has finished playing
     * @return {Boolean}
     */
    IsFinished()
    {
        return !this.cycle && this.time >= this.animationRes.duration;
    }

}