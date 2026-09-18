import { meta } from "utils";
import { vec2, vec3, vec4 } from "math";


/**
 * One post-process volume's contribution: a value and an enable flag per
 * attribute, plus the priority band and intensity that weight it when several
 * volumes are blended together.
 *
 * Source: trinity/trinity/PostProcess/Tr2PostProcessAttributes.h
 *
 * DECLARED SO THE BLACK FILE READS, AND NOTHING MORE. Every property here is
 * inert: the reader refuses a property it has no declaration for, so a scene
 * carrying post-process volumes could not be opened at all without this - and
 * `res:/dx9/scene/scenesettings.black` could not, which is how the gap was
 * found. Wiring any of it to the renderer is separate work.
 *
 * Carbon stores each of these as a `PriorityBlend::Attribute<T>`, which is a
 * value AND a flag saying whether this volume states it, so every attribute
 * appears twice - `<name>` and `<name>Enabled`. That is why the list is long
 * and why the enables are not redundant: an unset attribute is not the same as
 * one set to zero, and the blend needs to tell them apart.
 */
@meta.notImplemented
@meta.define("Tr2PostProcessAttributes", true)
export class Tr2PostProcessAttributes
{

    @meta.uint
    priority = Tr2PostProcessAttributes.MEDIUM_PRIORITY;

    @meta.float
    intensity = 0;

    @meta.boolean
    signalLossIntensityEnabled = false;

    @meta.float
    signalLossIntensity = 0;

    @meta.boolean
    bloomBrightnessEnabled = false;

    @meta.float
    bloomBrightness = 0;

    @meta.boolean
    bloomLuminanceThresholdEnabled = false;

    @meta.float
    bloomLuminanceThreshold = 0;

    @meta.boolean
    bloomLuminanceScaleEnabled = false;

    @meta.float
    bloomLuminanceScale = 0;

    @meta.boolean
    bloomSizeScaleEnabled = false;

    @meta.float
    bloomSizeScale = 4;

    @meta.boolean
    bloomDirectionalWeightEnabled = false;

    @meta.float
    bloomDirectionalWeight = 0;

    @meta.boolean
    bloomStepSize1Enabled = false;

    @meta.float
    bloomStepSize1 = 0.3;

    @meta.boolean
    bloomStepSize2Enabled = false;

    @meta.float
    bloomStepSize2 = 1;

    @meta.boolean
    bloomStepSize3Enabled = false;

    @meta.float
    bloomStepSize3 = 2;

    @meta.boolean
    bloomStepSize4Enabled = false;

    @meta.float
    bloomStepSize4 = 10;

    @meta.boolean
    bloomStepSize5Enabled = false;

    @meta.float
    bloomStepSize5 = 30;

    @meta.boolean
    bloomStepSize6Enabled = false;

    @meta.float
    bloomStepSize6 = 64;

    @meta.boolean
    bloomStepTint1Enabled = false;

    @meta.color
    bloomStepTint1 = vec4.fromValues(0.3465, 0.3465, 0.3465, 0.3465);

    @meta.boolean
    bloomStepTint2Enabled = false;

    @meta.color
    bloomStepTint2 = vec4.fromValues(0.138, 0.138, 0.138, 0.138);

    @meta.boolean
    bloomStepTint3Enabled = false;

    @meta.color
    bloomStepTint3 = vec4.fromValues(0.1176, 0.1176, 0.1176, 0.1176);

    @meta.boolean
    bloomStepTint4Enabled = false;

    @meta.color
    bloomStepTint4 = vec4.fromValues(0.066, 0.066, 0.066, 0.066);

    @meta.boolean
    bloomStepTint5Enabled = false;

    @meta.color
    bloomStepTint5 = vec4.fromValues(0.066, 0.066, 0.066, 0.066);

    @meta.boolean
    bloomStepTint6Enabled = false;

    @meta.color
    bloomStepTint6 = vec4.fromValues(0.061, 0.061, 0.061, 0.061);

    @meta.boolean
    grimeIntensityEnabled = false;

    @meta.float
    grimeIntensity = 0;

    @meta.boolean
    grimePathEnabled = false;

    @meta.string
    grimePath = "";

    @meta.boolean
    exposureAdjustmentEnabled = false;

    @meta.float
    exposureAdjustment = 0;

    @meta.boolean
    filmGrainIntensityEnabled = false;

    @meta.float
    filmGrainIntensity = 0;

    @meta.boolean
    filmGrainSizeEnabled = false;

    @meta.float
    filmGrainSize = 0;

    @meta.boolean
    filmGrainDensityEnabled = false;

    @meta.float
    filmGrainDensity = 0;

    @meta.boolean
    filmGrainContrastEnabled = false;

    @meta.float
    filmGrainContrast = 0;

    @meta.boolean
    filmGrainBrightnessModifierEnabled = false;

    @meta.float
    filmGrainBrightnessModifier = 0;

    @meta.boolean
    filmGrainColoredEnabled = false;

    @meta.boolean
    filmGrainColored = false;

    @meta.boolean
    filmGrainColorAmountEnabled = false;

    @meta.float
    filmGrainColorAmount = 0;

    @meta.boolean
    saturationEnabled = false;

    @meta.float
    saturation = 0;

    @meta.boolean
    fadeIntensityEnabled = false;

    @meta.float
    fadeIntensity = 0;

    @meta.boolean
    fadeColorEnabled = false;

    @meta.color
    fadeColor = vec4.fromValues(0, 0, 0, 1);

    @meta.boolean
    lutIntensityEnabled = false;

    @meta.float
    lutIntensity = 0;

    @meta.boolean
    lutPathEnabled = false;

    @meta.string
    lutPath = "";

    @meta.boolean
    vignetteIntensityEnabled = false;

    @meta.float
    vignetteIntensity = 0;

    @meta.boolean
    vignetteOpacityEnabled = false;

    @meta.float
    vignetteOpacity = 0;

    @meta.boolean
    vignetteColorEnabled = false;

    @meta.color
    vignetteColor = vec4.fromValues(1, 1, 1, 1);

    @meta.boolean
    vignetteDetail1SizeEnabled = false;

    @meta.vector2
    vignetteDetail1Size = vec2.fromValues(16, 16);

    @meta.boolean
    vignetteDetail1ScrollEnabled = false;

    @meta.vector2
    vignetteDetail1Scroll = vec2.create();

    @meta.boolean
    vignetteDetail2SizeEnabled = false;

    @meta.vector2
    vignetteDetail2Size = vec2.fromValues(16, 16);

    @meta.boolean
    vignetteDetail2ScrollEnabled = false;

    @meta.vector2
    vignetteDetail2Scroll = vec2.create();

    @meta.boolean
    vignetteShapePathEnabled = false;

    @meta.string
    vignetteShapePath = "";

    @meta.boolean
    vignetteDetailPathEnabled = false;

    @meta.string
    vignetteDetailPath = "";

    @meta.boolean
    vignetteSineFrequencyEnabled = false;

    @meta.float
    vignetteSineFrequency = 0;

    @meta.boolean
    vignetteMinSineFrequencyEnabled = false;

    @meta.float
    vignetteMinSineFrequency = 0;

    @meta.boolean
    vignetteMaxSineFrequencyEnabled = false;

    @meta.float
    vignetteMaxSineFrequency = 0;

    @meta.boolean
    depthOfFieldScaleEnabled = false;

    @meta.float
    depthOfFieldScale = 0;

    @meta.boolean
    depthOfFieldFocalDistanceEnabled = false;

    @meta.float
    depthOfFieldFocalDistance = 0;

    @meta.boolean
    depthOfFieldFocalLengthEnabled = false;

    @meta.float
    depthOfFieldFocalLength = 0;

    @meta.boolean
    depthOfFieldShapeEnabled = false;

    @meta.uint
    depthOfFieldShape = 0;

    @meta.boolean
    whiteTemperatureEnabled = false;

    @meta.float
    whiteTemperature = 6500;

    @meta.boolean
    whiteTintEnabled = false;

    @meta.float
    whiteTint = 0;

    @meta.boolean
    colorSaturationEnabled = false;

    @meta.float
    colorSaturation = 1;

    @meta.boolean
    colorContrastEnabled = false;

    @meta.float
    colorContrast = 1;

    @meta.boolean
    colorGammaEnabled = false;

    @meta.float
    colorGamma = 1;

    @meta.boolean
    colorGainEnabled = false;

    @meta.vector3
    colorGain = vec3.fromValues(1, 1, 1);

    @meta.boolean
    colorOffsetEnabled = false;

    @meta.vector3
    colorOffset = vec3.create();

    static LOW_PRIORITY = 1;

    static MEDIUM_PRIORITY = 2;

    static HIGH_PRIORITY = 3;

    static UI_PRIORITY = 4;

}
