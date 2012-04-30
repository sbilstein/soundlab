// CONSTANTS

// Signal processing constants
const SAMPLE_RATE = 44100;
const NUM_SAMPLES = 44100;
//const SAMPLE_RATE = 22050;
//const NUM_SAMPLES = 22050;

const NUM_CHANNELS = 2;

const DEFAULT_BITRATE = 2048;

const MAX_AMPLITUDE = 0.85;

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

const CANVAS_WIDTH_OFFSET = 25;
const CANVAS_HEIGHT_OFFSET = 50;

const BELOW_STAFF_HEIGHT_OFFSET = 25;

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

const COLOR_VALUE_MAPPING = {
    'COLOR_RED':COLOR_RED,
    'COLOR_GREEN':COLOR_GREEN,
    'COLOR_BLUE':COLOR_BLUE
};

const DSP_WAVE_MAPPING = {
    'DSP.SINE':DSP.SINE,
    'DSP.SAW':DSP.SAW,
    'DSP.SQUARE':DSP.SQUARE,
    'DSP.TRIANGLE':DSP.TRIANGLE
};
