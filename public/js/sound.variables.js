// VARIABLES

/**
 * Sound variables
 */

var loopPeriod = 1000; // looping period in ms. TODO: hook this up where appropriate, later on make adjustable.

var premute_volume; // saves volume for muting/unmuting

var decayInterval;

var current_audio_time;

var start_time;
var scrub_line_position = 0;

var pdelt;
var signals;
var signals_waves = {};
signals_waves[DSP.SINE] = new Array(STAFF_HEIGHT);
signals_waves[DSP.SAW] = new Array(STAFF_HEIGHT);
signals_waves[DSP.SQUARE] = new Array(STAFF_HEIGHT);
signals_waves[DSP.TRIANGLE] = new Array(STAFF_HEIGHT);

var audio_context = null;
var audio_buffer_source = null;
var gain_node = null;
var audio_is_playing = false;

var sum_signal = new Array(NUM_SAMPLES);
var samples_per_pixel = Math.floor(NUM_SAMPLES / STAFF_WIDTH);

var dsp_wave = DSP.SINE;

//Layer configuration
var layer_enabled_config = new Array();
layer_enabled_config[COLOR_RED] = true;
layer_enabled_config[COLOR_GREEN] = true;
layer_enabled_config[COLOR_BLUE] = true;

var layer_signal_config = new Array();
layer_signal_config[COLOR_RED] = dsp_wave;
layer_signal_config[COLOR_GREEN] = dsp_wave;
layer_signal_config[COLOR_BLUE] = dsp_wave;

var js_node;

/*                 C     C#    D    D#    E      F      F#    G     G#     A     A#     B */
//var scale = [true, false, true, true, false, true, false, true, true, false, false, false];
var scale =     [true, false, false, true, false, false, true, false, false, true, false, false];

/**
 * End Sound variables
 */

/**
 * Drawing variables
 */


var tool_style = PEN;
var PEN_STROKE_WIDTH = 3;
var ERASER_STROKE_WIDTH = 20;

var bar_canvas_context;
var staff_canvas_context;

var is_drawing = false;

var border_directive = {
    strokeStyle : COLOR_BLACK,
    strokeWidth : BORDER_WIDTH.toString()
}

var scrub_line_directive = {
    strokeStyle : COLOR_BLACK,
    strokeWidth : "4",
    y1 : 0,
    y2: STAFF_HEIGHT
}

var pen_directive = {
    strokeStyle : COLOR_RED,
    strokeWidth : PEN_STROKE_WIDTH.toString()
}

/**
 * End Drawing variables
 */
