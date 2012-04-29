var BufferController = function()
{
    // $JSBG_* = javascript buffer globals (holdover from before using closure, will rename eventually)

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
    var $JSBG_x_pixel_index;

    var $JSBG_color_signal;
    var $JSBG_signal_wave;

    var $JSBG_base_signal_index;
    var $JSBG_fire_signal;


    /* Function to buffer while the user is drawing */
    this.GetBuffer = function(evt)
    {
        $JSBG_buffer_time = audio_context.currentTime % 1.0;
        $JSBG_inputBuffer = evt.inputBuffer.getChannelData(0);

        if ((asyncBuffered || !realtime_buffering_enabled) && !glitch_mode_on)
        {
            evt.outputBuffer.getChannelData(0).set($JSBG_inputBuffer);
            evt.outputBuffer.getChannelData(1).set($JSBG_inputBuffer);
            return;
        }

        $JSBG_outputBuffer = new Float32Array($JSBG_inputBuffer.length);
        $JSBG_maxOutputBufferIndex = $JSBG_outputBuffer.length - 1;

        $JSBG_starting_x_pixel_index = parseInt($JSBG_buffer_time * STAFF_WIDTH);
        $JSBG_ending_x_pixel_index = ($JSBG_buffer_time + evt.inputBuffer.duration) * STAFF_WIDTH;
        $JSBG_x_pixel_range = (($JSBG_buffer_time + evt.inputBuffer.duration) * STAFF_WIDTH) - $JSBG_starting_x_pixel_index;

        $JSBG_base_signal_index = parseInt(NUM_SAMPLES * $JSBG_buffer_time);

        // Loop through each pixel
        for ($JSBG_x_pixel_index = $JSBG_starting_x_pixel_index; $JSBG_x_pixel_index < $JSBG_ending_x_pixel_index; $JSBG_x_pixel_index++)
        {
            // each pixel is (NUM_SAMPLES/STAFF_WIDTH)
            $JSBG_imgd = staff_canvas_context.getImageData($JSBG_x_pixel_index, 0, 1, STAFF_HEIGHT);
            $JSBG_pix = $JSBG_imgd.data;

            // For every pixel that is on in this sample's time span, get and add the value of the signal with the
            // frequency corresponding to the y pixel index at the time corresponding to j, multiplied by the value of
            // the pixel's alpha index (for volume/gain).
            for ($JSBG_y_pixel_index = BORDER_WIDTH; $JSBG_y_pixel_index < STAFF_HEIGHT - BORDER_WIDTH; $JSBG_y_pixel_index++)
            {
                $JSBG_pixel_index = $JSBG_y_pixel_index * 4;

                if ($JSBG_pix[$JSBG_pixel_index + ALPHA_INDEX_OFFSET] > 0)
                {
                    $JSBG_fire_signal = false;

                    if (layer_enabled_config[COLOR_RED] && $JSBG_pix[$JSBG_pixel_index + RED_INDEX_OFFSET] > 0)
                    {
                        $JSBG_fire_signal = true;
                        $JSBG_color_signal = COLOR_RED;
                    }
                    else if(layer_enabled_config[COLOR_GREEN] && $JSBG_pix[$JSBG_pixel_index + GREEN_INDEX_OFFSET] > 0)
                    {
                        $JSBG_fire_signal = true;
                        $JSBG_color_signal = COLOR_GREEN;
                    }
                    else if(layer_enabled_config[COLOR_BLUE] && $JSBG_pix[$JSBG_pixel_index + BLUE_INDEX_OFFSET] > 0)
                    {
                        $JSBG_fire_signal = true;
                        $JSBG_color_signal = COLOR_BLUE;
                    }

                    $JSBG_signal_wave = layer_signal_config[$JSBG_color_signal];

                    if ($JSBG_fire_signal)
                    {
                        $JSBG_starting_sample_index = Math.min($JSBG_maxOutputBufferIndex, ($JSBG_x_pixel_index - $JSBG_starting_x_pixel_index) * samples_per_pixel);
                        $JSBG_ending_sample_index = Math.min($JSBG_maxOutputBufferIndex, $JSBG_starting_sample_index + samples_per_pixel);

                        // Iterate over the samples in the time span of this pixel.
                        for ($JSBG_sample_index = $JSBG_starting_sample_index;
                             $JSBG_sample_index < $JSBG_ending_sample_index && $JSBG_base_signal_index + $JSBG_sample_index < NUM_SAMPLES;
                             $JSBG_sample_index++)
                        {
                            if (!$JSBG_outputBuffer[$JSBG_sample_index])
                            {
                                $JSBG_outputBuffer[$JSBG_sample_index] = ($JSBG_pix[$JSBG_pixel_index + ALPHA_INDEX_OFFSET]/255) *
                                    signals_waves[$JSBG_signal_wave][(STAFF_HEIGHT - BORDER_WIDTH) - $JSBG_y_pixel_index][$JSBG_base_signal_index + $JSBG_sample_index];
                            }
                            else
                            {
                                $JSBG_outputBuffer[$JSBG_sample_index] += ($JSBG_pix[$JSBG_pixel_index + ALPHA_INDEX_OFFSET]/255) *
                                    signals_waves[$JSBG_signal_wave][(STAFF_HEIGHT - BORDER_WIDTH) - $JSBG_y_pixel_index][$JSBG_base_signal_index + $JSBG_sample_index];
                            }
                        }
                    }
                }
            }
        }

        evt.outputBuffer.getChannelData(0).set($JSBG_outputBuffer);
        evt.outputBuffer.getChannelData(1).set($JSBG_outputBuffer);
    }


    // $BA_* = BufferAsync closure variables, preallocated for perf.

    // constant-ish
    var $BA_max_sample_index = (STAFF_WIDTH - BORDER_WIDTH) * samples_per_pixel;
    var $BA_starting_x_pixel_index = BORDER_WIDTH;
    var $BA_ending_x_pixel_index = STAFF_WIDTH - BORDER_WIDTH;

    // dynamic
    var $BA_imgd;
    var $BA_pix;
    var $BA_color_signal;
    var $BA_signal_wave;
    var $BA_pixel_index;
    var $BA_fire_signal;
    var $BA_starting_sample_index;
    var $BA_ending_sample_index;
    var $BA_x_pixel_index;
    var $BA_y_pixel_index;
    var $BA_sample_index;

    /* Asynchronously build sum_signals while the user is not drawing */
    this.BufferAsync = function()
    {
        for (var i = 0; i < sum_signal.length; i++)
        {
            sum_signal[i] = 0.0;
        }

        // Loop through each pixel
        for ($BA_x_pixel_index = $BA_starting_x_pixel_index; $BA_x_pixel_index < $BA_ending_x_pixel_index; $BA_x_pixel_index++)
        {
            // each pixel is (NUM_SAMPLES/STAFF_WIDTH)
            $BA_imgd = staff_canvas_context.getImageData($BA_x_pixel_index, 0, 1, STAFF_HEIGHT);
            $BA_pix = $BA_imgd.data;

            // For every pixel that is on in this sample's time span, get and add the value of the signal with the
            // frequency corresponding to the y pixel index at the time corresponding to j, multiplied by the value of
            // the pixel's alpha index (for volume/gain).
            for ($BA_y_pixel_index = BORDER_WIDTH; $BA_y_pixel_index < STAFF_HEIGHT - BORDER_WIDTH; $BA_y_pixel_index++)
            {
                $BA_pixel_index = $BA_y_pixel_index * 4;

                if ($BA_pix[$BA_pixel_index + ALPHA_INDEX_OFFSET] != 0)
                {
                    $BA_fire_signal = false;

                    if (layer_enabled_config[COLOR_RED] && $BA_pix[$BA_pixel_index + RED_INDEX_OFFSET] != 0)
                    {
                        $BA_fire_signal = true;
                        $BA_color_signal = COLOR_RED;
                    }
                    else if(layer_enabled_config[COLOR_GREEN] && $BA_pix[$BA_pixel_index + GREEN_INDEX_OFFSET] != 0)
                    {
                        $BA_fire_signal = true;
                        $BA_color_signal = COLOR_GREEN;
                    }
                    else if(layer_enabled_config[COLOR_BLUE] && $BA_pix[$BA_pixel_index + BLUE_INDEX_OFFSET] != 0)
                    {
                        $BA_fire_signal = true;
                        $BA_color_signal = COLOR_BLUE;
                    }

                    $BA_signal_wave = layer_signal_config[$BA_color_signal];

                    if ($BA_fire_signal)
                    {
                        $BA_starting_sample_index = $BA_x_pixel_index * samples_per_pixel;
                        $BA_ending_sample_index = Math.min($BA_max_sample_index, $BA_starting_sample_index + samples_per_pixel);

                        for ($BA_sample_index = $BA_starting_sample_index;
                             $BA_sample_index < $BA_ending_sample_index && $BA_sample_index < NUM_SAMPLES;
                             $BA_sample_index++)
                        {
                            if (!sum_signal[$BA_sample_index])
                            {
                                sum_signal[$BA_sample_index] = ($BA_pix[$BA_pixel_index + ALPHA_INDEX_OFFSET]/255) *
                                    signals_waves[$BA_signal_wave][(STAFF_HEIGHT - BORDER_WIDTH) - $BA_y_pixel_index][$BA_sample_index];
                            }
                            else
                            {
                                sum_signal[$BA_sample_index] += ($BA_pix[$BA_pixel_index + ALPHA_INDEX_OFFSET]/255) *
                                    signals_waves[$BA_signal_wave][(STAFF_HEIGHT - BORDER_WIDTH) - $BA_y_pixel_index][$BA_sample_index];
                            }
                        }
                    }
                }
            }
        }

        audio_buffer_source.buffer.getChannelData(0).set(sum_signal);
        audio_buffer_source.buffer.getChannelData(1).set(sum_signal);

        audio_buffer_source.noteOn(0);

        asyncBuffered = true;
    }

    return this;
}

function disconnectNodes()
{
    audio_buffer_source.disconnect(0);
    js_node.disconnect(0);
    gain_node.disconnect(0);
    dynamic_compressor_node.disconnect(0);
}

function connectNodes()
{
    disconnectNodes();

    audio_buffer_source.connect(js_node);
    js_node.connect(gain_node);
    gain_node.connect(dynamic_compressor_node);
    dynamic_compressor_node.connect(audio_context.destination);
}

function setJSNodeBufferSize(size)
{
    js_node = audio_context.createJavaScriptNode(size, 1, 1);
    js_node.onaudioprocess = js_buffer.GetBuffer;

    connectNodes();
}

function setColorSignal(color, signal)
{
    layer_signal_config[color] = eval(signal);
}

/**
 * Starts the sound.
 */
function soundOn()
{
    audio_is_playing = true;

    // Set both channels to signal.
    audio_buffer_source.buffer.getChannelData(0).set(sum_signal);
    audio_buffer_source.buffer.getChannelData(1).set(sum_signal);

    connectNodes();

    // Animate here also
    // need to fix pausing timing issue.
    // TODO Hand over to drawing module
    start_time = audio_context.currentTime;
    audio_buffer_source.noteOn(0);

    animateLine();
}

/**
 * Stops the sound.
 */
function soundOff()
{
    // turn off
    disconnectNodes();
    audio_is_playing = false;

    // position is where in the loop we stopped.
    // currentTime - start_time is the amount of time elapsed since start
    // needs to include position offset.
    // TODO don't use global here, will be calling from another function.
    scrub_line_position = ((audio_context.currentTime - start_time) + scrub_line_position) % 1.0;

    // call to animate toggle.
    animateLine();
}

/**
 * Calculates what sound should be playing
 * @param el Button that called the function
 */
function playSound(el)
{
    if (audio_is_playing)
    {
        soundOff();
    }
    else
    {
        soundOn();
    }
}

/**
 * Changes the volume.
 * @param event
 */
function changeVolume(event)
{
    var newVolume = $("#slider").val();

    if (newVolume != 0)
    {
        $("#mute").attr('checked', false)
    }

    gain_node.gain.value = newVolume;
}

function toggleMute()
{
    if ($('#mute').is(":checked"))
    {
        premute_volume = parseFloat($('#slider').val())
        $('#slider').val(0)
        changeVolume(true);
    }
    else
    {
        $('#slider').val(premute_volume);
        changeVolume(premute_volume);
    }
}

function toggleDecay()
{
    if ($('#decay_enabled').is(":checked"))
    {
        decayInterval = setInterval(function() { fadeSound($("#robo_decay").val()); }, 1000);
    }
    else
    {
        clearInterval(decayInterval);
        decayInterval = null;
    }
}

function setDSPWave(wave)
{
    eval("dsp_wave = "+wave);
    signals = signals_waves[dsp_wave];
}

function computePixelIndex(x, y, imgWidth)
{
    return (y*(imgWidth*4)) + (x*4);
}

/**
 * Enable or disable color layers.
 * @param layer_color Color style of layer
 */
function toggleLayer(layer_color)
{
    layer_enabled_config[layer_color] = !layer_enabled_config[layer_color];
}

/**
 * Sets buffer to true white instead of transparent black.
 */
function resetStaff()
{
    clearCanvas();

    if (audio_is_playing)
    {
        soundOn();
        animateLine();
    }
}

function clearCanvas()
{
    // Loop through each pixel
    var imgd = staff_canvas_context.getImageData(BORDER_WIDTH,
        BORDER_WIDTH,
        STAFF_WIDTH - BORDER_WIDTH * 2,
        STAFF_HEIGHT - BORDER_WIDTH * 2);

    var data = imgd.data;

    for (var i = 0; i < imgd.data.length; i++)
    {
        data[i] = 0;
    }

    imgd.data = data;
    staff_canvas_context.putImageData(imgd, BORDER_WIDTH, BORDER_WIDTH);
}

function clearRed()
{
    // Loop through each pixel
    var imgd = staff_canvas_context.getImageData(BORDER_WIDTH,
        BORDER_WIDTH,
        STAFF_WIDTH - BORDER_WIDTH * 2,
        STAFF_HEIGHT - BORDER_WIDTH * 2);

    var data = imgd.data;

    for (var i = 0; i < imgd.width * imgd.height; i++)
    {
        data[i*4 + RED_INDEX_OFFSET] = 0;
        if(data[i*4 + BLUE_INDEX_OFFSET] == 0 && data[i*4 + GREEN_INDEX_OFFSET] == 0)
        {
            data[i*4 + ALPHA_INDEX_OFFSET] = 0;
        }
    }

    imgd.data = data;
    staff_canvas_context.putImageData(imgd, BORDER_WIDTH, BORDER_WIDTH);

    if (audio_is_playing)
    {
        soundOn();
        animateLine();
    }
}

function clearGreen()
{
    // Loop through each pixel
    var imgd = staff_canvas_context.getImageData(BORDER_WIDTH,
        BORDER_WIDTH,
        STAFF_WIDTH - BORDER_WIDTH * 2,
        STAFF_HEIGHT - BORDER_WIDTH * 2);

    var data = imgd.data;

    for (var i = 0; i < imgd.width * imgd.height; i++)
    {
        data[i*4 + GREEN_INDEX_OFFSET] = 0;
        if(data[i*4 + RED_INDEX_OFFSET] == 0 && data[i*4 + BLUE_INDEX_OFFSET] == 0)
        {
            data[i*4 + ALPHA_INDEX_OFFSET] = 0;
        }
    }

    imgd.data = data;
    staff_canvas_context.putImageData(imgd, BORDER_WIDTH, BORDER_WIDTH);

    if (audio_is_playing)
    {
        soundOn();
        animateLine();
    }
}

function clearBlue()
{
    // Loop through each pixel
    var imgd = staff_canvas_context.getImageData(BORDER_WIDTH,
        BORDER_WIDTH,
        STAFF_WIDTH - BORDER_WIDTH * 2,
        STAFF_HEIGHT - BORDER_WIDTH * 2);

    var data = imgd.data;

    for (var i = 0; i < imgd.width * imgd.height; i++)
    {
        data[i*4 + BLUE_INDEX_OFFSET] = 0;
        if(data[i*4 + RED_INDEX_OFFSET] == 0 && data[i*4 + GREEN_INDEX_OFFSET] == 0)
        {
            data[i*4 + ALPHA_INDEX_OFFSET] = 0;
        }
    }

    imgd.data = data;
    staff_canvas_context.putImageData(imgd, BORDER_WIDTH, BORDER_WIDTH);

    if (audio_is_playing)
    {
        soundOn();
        animateLine();
    }
}

// TODO move stuff below this comment to sound.data.js once I understand the JS include system
function getStorableData()
{
    return $('canvas.staff')[0].toDataURL('image/bmp');
}

function loadFromDataURL(dataURL)
{
    var img = new Image();

    img.onload = function()
    {
        $('canvas.staff')[0].getContext('2d').drawImage(img, 0, 0);
    }

    img.src = dataURL;
}
