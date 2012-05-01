/*
 ********************
 * GLOBAL VARIABLES *
 ********************
 */

/**
 * SOUND ==============================================================================================================
 */

/**
 * Nodes and core Audio API variables.
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
 *         the canvas is changing in order to provide superior performance whenver possible while also reacting to user
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
var dsp_wave = DSP.SINE; // initial default wave.

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

var tool_style = PEN;
var pen_stroke_width = 2;
var eraser_stroke_width = 20;

var bar_canvas_context;
var staff_canvas_context;

var is_drawing = false;

var border_directive = {
    strokeStyle : COLOR_BLACK,
    strokeWidth : BORDER_WIDTH.toString()
}

var linear_directive = {
  x1: 0, y1: 1,
  x2: 10, y2: 1,
  c1: "#fff",
  c2: "#000",
  c3: "#fff"
}

var scrub_line_directive = {
    strokeStyle : COLOR_WHITE,
    strokeWidth : "0",

    // drawLine fields (disabled)
    //y1 : 1,
    //y2: STAFF_HEIGHT,

    // drawRect fields
    y: STAFF_HEIGHT / 2 + 1,
    height: STAFF_HEIGHT - 2,
    width: 10
}

var linear_gradient = null;

var pen_directive = {
    strokeStyle : COLOR_RED,
    strokeWidth : pen_stroke_width.toString(),
	strokeCap : "round"
}

/**
 * END DRAWING =========================================================================================================
 */

// Begin swag variables

var saved_states = [];

// Never end swag
