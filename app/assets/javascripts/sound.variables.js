/*
 ********************
 * GLOBAL VARIABLES *
 ********************
 */

/**
 * SOUND ==============================================================================================================
 */

/**
 * Nodes and core Audio API variables.   asdfljkahsdkfl
 */
var audio_context = null;
var audio_buffer_source = null;

var gain_node = null;
var dynamic_compressor_node = null;
var convolution_node = null;

var js_buffer; // Object that decides whether to buffer on the fly or use asynchronously populated buffer
var js_node;

/***
 * Variables to enable switching back and forth between realtime buffering and asynchronous buffering.
 *
 * Currently only glitch_mode_on is used. asyncBuffered is supported functionally but not used. realtime_buffering_enabled is not
 * fully supported yet. There are three possible modes:
 *      1. Asynchronous buffering. This is the default. The sound will be buffered after (not during) any changes to the
 *         canvas. This is the default as it is the most reliable and most performant.
 *
 *      2. Synchronous/Realtime buffering. The sound is buffered on the fly as the Audio Context requests it. Changes to the
 *         canvas will be buffered as they occur. Due to unknown issues stemming from either a bug in the realtime
 *         buffering and sampling function or fundamental performance limitations, the sound is different/worse than
 *         asynchronous. This is sound heard in Glitch Mode.
 *
 *      3. Asynchronous + Synchronous buffering. In this mode, the buffering strategy is swapped depending on whether
 *         the canvas is changing in order to provide superior performance whenever possible while also reacting to user
 *         input in real-time. This is supported and can be enabled by switching realtime_buffering_enabled to true.
 *         However it is not exposed to the user and is shelved for now due to the inconsistency in sound between realtime
 *         buffering and asynchronous buffering. Come back and investigate eventually.
  */
var glitch_mode_on = false;
var realtime_buffering_enabled = false;
var asyncBuffered = false;

/**
 * Signals and samples variables
 */
var dsp_wave = DSP.SINE; // initial default wave. TODO: Don't think we even use this anymore.

var samples_per_pixel = Math.floor(NUM_SAMPLES / STAFF_WIDTH);

var signals;

var signal_granularity = 25;

var sum_signal = new Float32Array(NUM_SAMPLES);

var signals_waves = {};
signals_waves[DSP.SINE] = new Array(STAFF_HEIGHT);
signals_waves[DSP.SAW] = new Array(STAFF_HEIGHT);
signals_waves[DSP.SQUARE] = new Array(STAFF_HEIGHT);
signals_waves[DSP.TRIANGLE] = new Array(STAFF_HEIGHT);

/**
 * Layer configuration
 */
var layer_enabled_config = new Array();
layer_enabled_config[COLOR_RED] = true;
layer_enabled_config[COLOR_GREEN] = true;
layer_enabled_config[COLOR_BLUE] = true;

var layer_signal_config = new Array();
layer_signal_config[COLOR_RED] = dsp_wave;
layer_signal_config[COLOR_GREEN] = dsp_wave;
layer_signal_config[COLOR_BLUE] = dsp_wave;

/**
 * Miscellaneous control variables
 */
var premute_volume; // saves volume for muting/unmuting

var decay_interval;

var current_audio_time;
var start_time;
var scrub_line_position = 0;
var audio_is_playing = false;

/**
 * END SOUND ===========================================================================================================
 */

/**
 * DRAWING =============================================================================================================
 */
var shift_down = false;
var tool_style = PEN;
var pen_stroke_width = 5;
var eraser_stroke_width = 20; // never changes now.

var bar_canvas_context;
var staff_canvas_context;

var is_drawing = false;

var linear_directive = {
  x1: 0, y1: 1,
  x2: 10, y2: 1,
  c1: "#fff",
  c2: "#000",
  c3: "#fff"
}

var linear_gradient = null;

var scrub_line_directive = {
    strokeStyle : COLOR_BLACK,
    strokeWidth : "2",

    // drawLine fields
    y1 : 1,
    y2: STAFF_HEIGHT

    // drawRect fields (disabled)
    /*
    y: STAFF_HEIGHT / 2 + 1,
    height: STAFF_HEIGHT - 2,
    width: 10
    */
}

var pen_directive = {
    strokeStyle : COLOR_GREEN,
    strokeWidth : pen_stroke_width.toString(),
	strokeCap : "round"
}

const BELOW_STAFF_HEIGHT_OFFSET = 25;

/**
 * END DRAWING =========================================================================================================
 */

/**
 * Begin Save/Recall Variables =========================================================================================
 */

var saved_states = {};
saved_states['count'] = 0;

/**
 * End Save/Recall Variables ===========================================================================================
 */


/**
 * Global signals constants (should probably put these in closure)  ====================================================
 */

var GENERATE_METHOD_ALIEN = "alien";
var GENERATE_METHOD_MUSICAL = "musical";
var GENERATE_METHOD_DEFAULT = "alien";

// Not gonna change unless we move away from Western music scale because we don't want to hear nice things any more.
const SEMITONE_COUNT = 12;

/**
 *Frequencies of piano keys from 1 (A0 Double Pedal A)  through 88 (C8 Eighth octave).
 * Delete this and die a slow painful death.
 * Knowledge swag: https://en.wikipedia.org/wiki/Piano_key_frequencies#Virtual_keyboard
 */
var key_frequencies = [27.5, 29.1352, 30.8677, 32.7032, 34.6478, 36.7081, 38.8909, 41.2034, 43.6535, 46.2493, 48.9994, 51.9131,
    55, 58.2705, 61.7354, 65.4064, 69.2957, 73.4162, 77.7817, 82.4069, 87.3071, 92.4986, 97.9989, 103.826, 110, 116.541,
    123.471, 130.813, 138.591, 146.832, 155.563, 164.814, 174.614, 184.997, 195.998, 207.652, 220, 233.082, 246.942, 261.626,
    277.183, 293.665, 311.127, 329.628, 349.228, 369.994, 391.995, 415.305, 440, 466.164, 493.883, 523.251, 554.365, 587.33,
    622.254, 659.255, 698.456, 739.989, 783.991, 830.609, 880, 932.328, 987.767, 1046.5, 1108.73, 1174.66, 1244.51, 1318.51,
    1396.91, 1479.98, 1567.98, 1661.22, 1760, 1864.66, 1975.53, 2093, 2217.46, 2349.32, 2489.02, 2637.02, 2793.83, 2959.96,
    3135.96, 3322.44, 3520, 3729.31, 3951.07, 4186.01];

/**
 * Keys and their indices. A is 0 because it's the first in our key frequency list.
 * Sharp/flat names are randomly chosen for aesthetics, deal with it.
 */
var KEY_TO_INDEX_MAPPING = {
    "A":  0,
    "Bf": 1,
    "B":  2,
    "C":  3,
    "Cs": 4,
    "D":  5,
    "Ef": 6,
    "E":  7,
    "F":  8,
    "Fs": 9,
    "G":  10,
    "Af": 11
};

// Reverse lookup of key indices, lol duplication.
var INDEX_TO_KEY_MAPPING = [
    "A",
    "Bf",
    "B",
    "C",
    "Cs",
    "D",
    "Ef",
    "E",
    "F",
    "Fs",
    "G",
    "Af"
];

/**
 * All scales in C because it's the easiest to remember. Want a different key? Too bad, don't put it here. Figure
 * it out in C and transpose in the UI.
 */
var keys_chromatic_scale =  ["A", "Bf", "B", "C", "Cs", "D", "Ef", "E", "F", "Fs", "G", "Af"];

var keys_major_scale =      ["A",       "B", "C",       "D",       "E", "F",       "G"      ];

var keys_octave_scale =     [                "C"                                            ];

var keys_chinese_scale =    [     "Bf",           "Cs",      "Ef",           "Fs",      "Af"];

var keys_pentatonic_scale = ["A",            "C",       "D",       "E",            "G"      ];

var keys_minor_scale =      [     "Bf",      "C",       "D", "Ef",      "F",       "G", "Af"];

var SCALE_KEYS_MAPPING = {
    "scale_chromatic": keys_chromatic_scale,
    "scale_major": keys_major_scale,
    "scale_minor": keys_minor_scale,
    "scale_octave": keys_octave_scale,
    "scale_chinese": keys_chinese_scale,
    "scale_pentatonic": keys_pentatonic_scale
}

// Scale with no notes. Think it's useless? Think again - used as blank canvas for building scales.
/*              A      A# (Bf)  B      C      C# (Cs)  D      D# (Ef)  E      F      F#     G      G#  (Af) */
var no_scale = [false, false,   false, false, false,   false, false,   false, false, false, false, false    ];

/**
 * Global signals variables (should probably put these in closure)
 */

// WebWorker dude. Respect his rights or he'll Occupy your CPU.
var worker = null;

// A friendly key to help the user remember their dumb scale. Also the only key since there was no point in making
// another key that does all the same things. Lol legacy naming.
var friendly_key;

// Beginning and ending keys for your musical scale needs. Default is A0 Double Pedal A - C8 Eighth Octave because
// that's a piano.
var key_start_index = 0;
var key_end_index = key_frequencies.length;

var pending_scale;
var cached_signals = {};

// Oscillator
var osc;

/**
 * End Global signals constants  =======================================================================================
 */
