// CONSTANTS

// Signal processing constants
const SAMPLE_RATE = 44100;
const NUM_SAMPLES = 44100;
//const SAMPLE_RATE = 22050;
//const NUM_SAMPLES = 22050;

const NUM_CHANNELS = 2;

const DEFAULT_BITRATE = 2048;

const MAX_AMPLITUDE = 0.9;
var MAX_PRECOMPRESSED_AMPLITUDE = 15.0;

var precompression_enabled = true;
var precompression_normalization_enabled = true;

// Canvas pixel array accessor constants
const RED_INDEX_OFFSET = 0;
const GREEN_INDEX_OFFSET = 1;
const BLUE_INDEX_OFFSET = 2;
const ALPHA_INDEX_OFFSET = 3;

// Drawing constants
//const STAFF_WIDTH = $("canvas.staff").width();
//const STAFF_HEIGHT = $("canvas.staff").height();
const STAFF_WIDTH = 1000;
const STAFF_HEIGHT = 375;

const CANVAS_WIDTH_OFFSET = 16;
const CANVAS_HEIGHT_OFFSET = 90;

const LAYOUT_SPACING = 25;

//const BORDER_WIDTH = 2;
const BORDER_WIDTH = 0;

const COLOR_NONE = "rgba(0,0,0,0)";
const COLOR_BLACK = "#000000";
const COLOR_WHITE = "#FFFFFF";

const COLOR_RED = "#FF0000";
const COLOR_GREEN = "#00FF00";
const COLOR_BLUE = "#0000FF";

// Drawing tools
const PEN = 0;
const ERASER = 1;

var COLOR_VALUE_MAPPING = {
    'COLOR_RED':COLOR_RED,
    'COLOR_GREEN':COLOR_GREEN,
    'COLOR_BLUE':COLOR_BLUE
};

var DSP_WAVE_MAPPING = {
    'DSP.SINE':DSP.SINE,
    'DSP.SAW':DSP.SAW,
    'DSP.SQUARE':DSP.SQUARE,
    'DSP.TRIANGLE':DSP.TRIANGLE
};


var MODE_BASIC = "basic";
var MODE_ADVANCED = "advanced";
var MODE_EXPERIMENTAL = "experimental";