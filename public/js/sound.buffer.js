// CLOSURE =========================================================

var JSBuffer = function()
{
    var $JSBG_pixel_index;

    var $JSBG_ending_sample_index;
    var $JSBG_y_pixel_index;
    var $JSBG_sample_index;
    var $JSBG_imgd;
    var $JSBG_pix;

    var $JSBG_starting_sample_index;
    var $JSBG_starting_sample_index_multiplier;

    var $JSBG_inputBuffer;
    var $JSBG_outputBuffer;
    var $JSBG_maxOutputBufferIndex;

    var $JSBG_buffer_time;

    var $JSBG_starting_x_pixel_index;
    var $JSBG_ending_x_pixel_index;
    var $JSBG_x_pixel_range;

    var $JSBG_fire_red_signal;
    var $JSBG_fire_green_signal;
    var $JSBG_fire_blue_signal;
    var $JSBG_color_signal;
    var $JSBG_signal_wave;



    this.BufferSound = function(evt)
    {
        // TODO only rebuffer when needed, store signal in buffer that can be sliced.

        $JSBG_inputBuffer = evt.inputBuffer.getChannelData(0);
        $JSBG_outputBuffer = new Float32Array($JSBG_inputBuffer.length);
        $JSBG_maxOutputBufferIndex = $JSBG_outputBuffer.length - 1;

        $JSBG_buffer_time = audio_context.currentTime % 1.0;

        $JSBG_starting_x_pixel_index = parseInt($JSBG_buffer_time * STAFF_WIDTH);
        $JSBG_ending_x_pixel_index = ($JSBG_buffer_time + evt.inputBuffer.duration) * STAFF_WIDTH;
        $JSBG_x_pixel_range = (($JSBG_buffer_time + evt.inputBuffer.duration) * STAFF_WIDTH) - $JSBG_starting_x_pixel_index;

        //var base_signal_index = parseInt(NUM_SAMPLES * buffer_time);

        $JSBG_starting_sample_index_multiplier = parseInt($JSBG_outputBuffer.length/$JSBG_x_pixel_range);


        // Loop through each pixel
        for (var x_pixel_index = $JSBG_starting_x_pixel_index; x_pixel_index < $JSBG_ending_x_pixel_index; x_pixel_index++)
        {
            // each pixel is (NUM_SAMPLES/STAFF_WIDTH)
            $JSBG_imgd = staff_canvas_context.getImageData(x_pixel_index, 0, 1, STAFF_HEIGHT);
            $JSBG_pix = $JSBG_imgd.data;

            // For every pixel that is on in this sample's time span, get and add the value of the signal with the
            // frequency corresponding to the y pixel index at the time corresponding to j, multiplied by the value of
            // the pixel's alpha index (for volume).
            for ($JSBG_y_pixel_index = BORDER_WIDTH; $JSBG_y_pixel_index < STAFF_HEIGHT - BORDER_WIDTH; $JSBG_y_pixel_index++)
            {
                $JSBG_pixel_index = $JSBG_y_pixel_index * 4;

                if ($JSBG_pix[$JSBG_pixel_index + ALPHA_INDEX_OFFSET] != 0)
                {
                    $JSBG_fire_red_signal = false;
                    $JSBG_fire_green_signal = false;
                    $JSBG_fire_blue_signal = false;

                    if (layer_enabled_config[COLOR_RED] && $JSBG_pix[$JSBG_pixel_index + RED_INDEX_OFFSET] != 0)
                    {
                        $JSBG_fire_red_signal = true;
                        $JSBG_color_signal = COLOR_RED;
                    }
                    else if(layer_enabled_config[COLOR_GREEN] && $JSBG_pix[$JSBG_pixel_index + GREEN_INDEX_OFFSET] != 0)
                    {
                        $JSBG_fire_green_signal = true;
                        $JSBG_color_signal = COLOR_GREEN;
                    }
                    else if(layer_enabled_config[COLOR_BLUE] && $JSBG_pix[$JSBG_pixel_index + BLUE_INDEX_OFFSET] != 0)
                    {
                        $JSBG_fire_blue_signal = true;
                        $JSBG_color_signal = COLOR_BLUE;
                    }

                    $JSBG_signal_wave = layer_signal_config[$JSBG_color_signal];

                    if ($JSBG_fire_red_signal || $JSBG_fire_green_signal || $JSBG_fire_blue_signal)
                    {
                        $JSBG_starting_sample_index = Math.min($JSBG_maxOutputBufferIndex, (x_pixel_index - $JSBG_starting_x_pixel_index) * $JSBG_starting_sample_index_multiplier);

                        $JSBG_ending_sample_index = Math.min($JSBG_maxOutputBufferIndex, $JSBG_starting_sample_index + samples_per_pixel);

                        // Iterate over the samples in the time span of this pixel.
                        for ($JSBG_sample_index = $JSBG_starting_sample_index; $JSBG_sample_index < $JSBG_ending_sample_index; $JSBG_sample_index++)
                        {
                            // TODO signals[(STAFF_HEIGHT - BORDER_WIDTH) - y_pixel_index][sample_index] should be something like
                            // signals[(STAFF_HEIGHT - BORDER_WIDTH) - y_pixel_index][base_signal_index + sample_index - starting_sample_index], but that sounds fucked up
                            // and this sounds awesome. Investigate.

                            //$JSBG_outputBuffer[$JSBG_sample_index] += ($JSBG_pix[$JSBG_pixel_index + ALPHA_INDEX_OFFSET]/255) * signals[(STAFF_HEIGHT - BORDER_WIDTH) - $JSBG_y_pixel_index][$JSBG_sample_index];
                            $JSBG_outputBuffer[$JSBG_sample_index] += ($JSBG_pix[$JSBG_pixel_index + ALPHA_INDEX_OFFSET]/255) *
                                signals_waves[$JSBG_signal_wave][(STAFF_HEIGHT - BORDER_WIDTH) - $JSBG_y_pixel_index][$JSBG_sample_index];
                        }
                    }
                }
            }
        }

        evt.outputBuffer.getChannelData(0).set($JSBG_outputBuffer);
        evt.outputBuffer.getChannelData(1).set($JSBG_outputBuffer);
    }

    return this;
}

// END CLOSURE ======================================================

// GLOBAL ========================================================

//var JSBuffer = function()
//{
var $JSBG_pixel_index;

var $JSBG_ending_sample_index;
var $JSBG_y_pixel_index;
var $JSBG_sample_index;
var $JSBG_imgd;
var $JSBG_pix;

var $JSBG_starting_sample_index;
var $JSBG_starting_sample_index_multiplier;

var $JSBG_inputBuffer;
var $JSBG_outputBuffer;
var $JSBG_maxOutputBufferIndex;

var $JSBG_buffer_time;

var $JSBG_starting_x_pixel_index;
var $JSBG_ending_x_pixel_index;
var $JSBG_x_pixel_range;

var $JSBG_fire_red_signal;
var $JSBG_fire_green_signal;
var $JSBG_fire_blue_signal;
var $JSBG_color_signal;
var $JSBG_signal_wave;



//this.BufferSound = function(evt)
function JSBufferSound(evt)
{
    // TODO only rebuffer when needed, store signal in buffer that can be sliced.

    $JSBG_inputBuffer = evt.inputBuffer.getChannelData(0);
    $JSBG_outputBuffer = new Float32Array($JSBG_inputBuffer.length);
    $JSBG_maxOutputBufferIndex = $JSBG_outputBuffer.length - 1;

    $JSBG_buffer_time = audio_context.currentTime % 1.0;

    $JSBG_starting_x_pixel_index = parseInt($JSBG_buffer_time * STAFF_WIDTH);
    $JSBG_ending_x_pixel_index = ($JSBG_buffer_time + evt.inputBuffer.duration) * STAFF_WIDTH;
    $JSBG_x_pixel_range = (($JSBG_buffer_time + evt.inputBuffer.duration) * STAFF_WIDTH) - $JSBG_starting_x_pixel_index;

    //var base_signal_index = parseInt(NUM_SAMPLES * buffer_time);

    $JSBG_starting_sample_index_multiplier = parseInt($JSBG_outputBuffer.length/$JSBG_x_pixel_range);


    // Loop through each pixel
    for (var x_pixel_index = $JSBG_starting_x_pixel_index; x_pixel_index < $JSBG_ending_x_pixel_index; x_pixel_index++)
    {
        // each pixel is (NUM_SAMPLES/STAFF_WIDTH)
        $JSBG_imgd = staff_canvas_context.getImageData(x_pixel_index, 0, 1, STAFF_HEIGHT);
        $JSBG_pix = $JSBG_imgd.data;

        // For every pixel that is on in this sample's time span, get and add the value of the signal with the
        // frequency corresponding to the y pixel index at the time corresponding to j, multiplied by the value of
        // the pixel's alpha index (for volume).
        for ($JSBG_y_pixel_index = BORDER_WIDTH; $JSBG_y_pixel_index < STAFF_HEIGHT - BORDER_WIDTH; $JSBG_y_pixel_index++)
        {
            $JSBG_pixel_index = $JSBG_y_pixel_index * 4;

            if ($JSBG_pix[$JSBG_pixel_index + ALPHA_INDEX_OFFSET] != 0)
            {
                $JSBG_fire_red_signal = false;
                $JSBG_fire_green_signal = false;
                $JSBG_fire_blue_signal = false;

                if (layer_enabled_config[COLOR_RED] && $JSBG_pix[$JSBG_pixel_index + RED_INDEX_OFFSET] != 0)
                {
                    $JSBG_fire_red_signal = true;
                    $JSBG_color_signal = COLOR_RED;
                }
                else if(layer_enabled_config[COLOR_GREEN] && $JSBG_pix[$JSBG_pixel_index + GREEN_INDEX_OFFSET] != 0)
                {
                    $JSBG_fire_green_signal = true;
                    $JSBG_color_signal = COLOR_GREEN;
                }
                else if(layer_enabled_config[COLOR_BLUE] && $JSBG_pix[$JSBG_pixel_index + BLUE_INDEX_OFFSET] != 0)
                {
                    $JSBG_fire_blue_signal = true;
                    $JSBG_color_signal = COLOR_BLUE;
                }

                $JSBG_signal_wave = layer_signal_config[$JSBG_color_signal];

                if ($JSBG_fire_red_signal || $JSBG_fire_green_signal || $JSBG_fire_blue_signal)
                {
                    $JSBG_starting_sample_index = Math.min($JSBG_maxOutputBufferIndex, (x_pixel_index - $JSBG_starting_x_pixel_index) * $JSBG_starting_sample_index_multiplier);

                    $JSBG_ending_sample_index = Math.min($JSBG_maxOutputBufferIndex, $JSBG_starting_sample_index + samples_per_pixel);

                    // Iterate over the samples in the time span of this pixel.
                    for ($JSBG_sample_index = $JSBG_starting_sample_index; $JSBG_sample_index < $JSBG_ending_sample_index; $JSBG_sample_index++)
                    {
                        // TODO signals[(STAFF_HEIGHT - BORDER_WIDTH) - y_pixel_index][sample_index] should be something like
                        // signals[(STAFF_HEIGHT - BORDER_WIDTH) - y_pixel_index][base_signal_index + sample_index - starting_sample_index], but that sounds fucked up
                        // and this sounds awesome. Investigate.

                        //$JSBG_outputBuffer[$JSBG_sample_index] += ($JSBG_pix[$JSBG_pixel_index + ALPHA_INDEX_OFFSET]/255) * signals[(STAFF_HEIGHT - BORDER_WIDTH) - $JSBG_y_pixel_index][$JSBG_sample_index];
                        $JSBG_outputBuffer[$JSBG_sample_index] += ($JSBG_pix[$JSBG_pixel_index + ALPHA_INDEX_OFFSET]/255) *
                            signals_waves[$JSBG_signal_wave][(STAFF_HEIGHT - BORDER_WIDTH) - $JSBG_y_pixel_index][$JSBG_sample_index];
                    }
                }
            }
        }
    }

    evt.outputBuffer.getChannelData(0).set($JSBG_outputBuffer);
    evt.outputBuffer.getChannelData(1).set($JSBG_outputBuffer);
}

//return this;
//}

// END GLOBAL =====================================================



function toggleBufferStrategy()
{
    useClosure = !useClosure;
    setJSNodeBufferSize(    $("#js_node_buffer_size").val())
}

useClosure = false;