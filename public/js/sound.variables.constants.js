// CONSTANTS

// Signal processing constants
const SAMPLE_RATE = 44100;
const NUM_SAMPLES = 44100;
const NUM_CHANNELS = 2;

// Canvas pixel array accessor constants
const RED_INDEX_OFFSET = 0;
const GREEN_INDEX_OFFSET = 1;
const BLUE_INDEX_OFFSET = 2;
const ALPHA_INDEX_OFFSET = 3;

// Drawing constants
const STAFF_WIDTH = $("canvas.staff").width();
const STAFF_HEIGHT = $("canvas.staff").height();

const BORDER_WIDTH = 2;

const COLOR_NONE = "rgba(0,0,0,0)";
const COLOR_BLACK = "#000000";
const COLOR_WHITE = "#FFFFFF";

const COLOR_RED = "#FF0000";
const COLOR_GREEN = "#00FF00";
const COLOR_BLUE = "#0000FF";

// Drawing tools
const PEN = 0;
const ERASER = 1;
