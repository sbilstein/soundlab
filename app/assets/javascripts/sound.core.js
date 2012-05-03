var BufferController = function()
{
    // $GB_* = GetBuffer globals

    var $GB_pixel_index;

    var $GB_ending_sample_index;
    var $GB_y_pixel_index;
    var $GB_sample_index;
    var $GB_imgd;
    var $GB_pix;

    var $GB_starting_sample_index;
    var $GB_starting_sample_index_multiplier;

    var $GB_inputBuffer;
    var $GB_outputBuffer;
    var $GB_maxOutputBufferIndex;

    var $GB_buffer_time;

    var $GB_starting_x_pixel_index;
    var $GB_ending_x_pixel_index;
    var $GB_x_pixel_range;
    var $GB_x_pixel_index;

    var $GB_color_signal;
    var $GB_signal_wave;

    var $GB_base_signal_index;
    var $GB_fire_signal;


    /* Function to buffer while the user is drawing */
    this.GetBuffer = function(evt)
    {
        $GB_buffer_time = audio_context.currentTime % 1.0;
        $GB_inputBuffer = evt.inputBuffer.getChannelData(0);

        // See (long) note in sound.variables.js for explanation of these variables and what they do..
        if ((asyncBuffered || !realtime_buffering_enabled) && !glitch_mode_on)
        {
            $GB_inputBuffer = new Float32Array(evt.inputBuffer.getChannelData(0));
            evt.outputBuffer.getChannelData(0).set($GB_inputBuffer);
            evt.outputBuffer.getChannelData(1).set($GB_inputBuffer);
            return;
        }

        $GB_outputBuffer = new Float32Array($GB_inputBuffer.length);
        $GB_maxOutputBufferIndex = $GB_outputBuffer.length - 1;

        $GB_starting_x_pixel_index = parseInt($GB_buffer_time * STAFF_WIDTH);
        $GB_ending_x_pixel_index = ($GB_buffer_time + evt.inputBuffer.duration) * STAFF_WIDTH;
        $GB_x_pixel_range = (($GB_buffer_time + evt.inputBuffer.duration) * STAFF_WIDTH) - $GB_starting_x_pixel_index;

        $GB_base_signal_index = parseInt(NUM_SAMPLES * $GB_buffer_time);

        // Loop through each pixel
        for ($GB_x_pixel_index = $GB_starting_x_pixel_index; $GB_x_pixel_index < $GB_ending_x_pixel_index; $GB_x_pixel_index++)
        {
            // each pixel is (NUM_SAMPLES/STAFF_WIDTH)
            $GB_imgd = staff_canvas_context.getImageData($GB_x_pixel_index, 0, 1, STAFF_HEIGHT);
            $GB_pix = $GB_imgd.data;

            // For every pixel that is on in this sample's time span, get and add the value of the signal with the
            // frequency corresponding to the y pixel index at the time corresponding to j, multiplied by the value of
            // the pixel's alpha index (for volume/gain).
            for ($GB_y_pixel_index = BORDER_WIDTH; $GB_y_pixel_index < STAFF_HEIGHT - BORDER_WIDTH; $GB_y_pixel_index++)
            {
                $GB_pixel_index = $GB_y_pixel_index * 4;

                if ($GB_pix[$GB_pixel_index + ALPHA_INDEX_OFFSET] > 0)
                {
                    $GB_fire_signal = false;

                    if (layer_enabled_config[COLOR_RED] && $GB_pix[$GB_pixel_index + RED_INDEX_OFFSET] > 0)
                    {
                        $GB_fire_signal = true;
                        $GB_color_signal = COLOR_RED;
                    }
                    else if(layer_enabled_config[COLOR_GREEN] && $GB_pix[$GB_pixel_index + GREEN_INDEX_OFFSET] > 0)
                    {
                        $GB_fire_signal = true;
                        $GB_color_signal = COLOR_GREEN;
                    }
                    else if(layer_enabled_config[COLOR_BLUE] && $GB_pix[$GB_pixel_index + BLUE_INDEX_OFFSET] > 0)
                    {
                        $GB_fire_signal = true;
                        $GB_color_signal = COLOR_BLUE;
                    }

                    $GB_signal_wave = layer_signal_config[$GB_color_signal];

                    if ($GB_fire_signal)
                    {
                        $GB_starting_sample_index = Math.min($GB_maxOutputBufferIndex, ($GB_x_pixel_index - $GB_starting_x_pixel_index) * samples_per_pixel);
                        $GB_ending_sample_index = Math.min($GB_maxOutputBufferIndex, $GB_starting_sample_index + samples_per_pixel);

                        // Iterate over the samples in the time span of this pixel.
                        for ($GB_sample_index = $GB_starting_sample_index;
                             $GB_sample_index < $GB_ending_sample_index && $GB_base_signal_index + $GB_sample_index < NUM_SAMPLES;
                             $GB_sample_index++)
                        {
                            if (!$GB_outputBuffer[$GB_sample_index])
                            {
                                $GB_outputBuffer[$GB_sample_index] = ($GB_pix[$GB_pixel_index + ALPHA_INDEX_OFFSET]/255) *
                                    signals_waves[$GB_signal_wave][(STAFF_HEIGHT - BORDER_WIDTH - 1) - $GB_y_pixel_index][$GB_base_signal_index + $GB_sample_index];
                            }
                            else
                            {
                                $GB_outputBuffer[$GB_sample_index] += ($GB_pix[$GB_pixel_index + ALPHA_INDEX_OFFSET]/255) *
                                    signals_waves[$GB_signal_wave][(STAFF_HEIGHT - BORDER_WIDTH - 1) - $GB_y_pixel_index][$GB_base_signal_index + $GB_sample_index];
                            }

                            if(sum_signal[$GB_sample_index] > MAX_AMPLITUDE)
                            {
                                sum_signal[$GB_sample_index] = MAX_AMPLITUDE;
                            }
                            else if(sum_signal[$GB_sample_index] < -1*MAX_AMPLITUDE)
                            {
                                sum_signal[$GB_sample_index] = -1*MAX_AMPLITUDE;
                            }
                        }
                    }
                }
            }
        }

        evt.outputBuffer.getChannelData(0).set($GB_outputBuffer);
        evt.outputBuffer.getChannelData(1).set($GB_outputBuffer);
    }


    // $BA_* = BufferAsync closure variables, preallocated for perf.

    // constant-ish
    var $BA_max_sample_index = NUM_SAMPLES - 1;
    var $BA_starting_x_pixel_index = BORDER_WIDTH;
    var $BA_ending_x_pixel_index = STAFF_WIDTH - BORDER_WIDTH;

    // dynamic
    var $BA_imgd;
    var $BA_pix;
    var $BA_color_signal;
    var $BA_signal_wave;
    var $BA_pixel_index;


    var $BA_fire_red_signal;
    var $BA_fire_green_signal;
    var $BA_fire_blue_signal;

    var $BA_starting_sample_index;
    var $BA_ending_sample_index;
    var $BA_x_pixel_index;
    var $BA_y_pixel_index;
    var $BA_sample_index;

    var $BA_max_amplitude;

    /* Asynchronously build sum_signals while the user is not drawing */
    this.BufferAsync = function()
    {
        for (var i = 0; i < sum_signal.length; i++)
        {
            sum_signal[i] = 0.0;
        }

        $BA_max_amplitude = 0;

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

                if ($BA_pix[$BA_pixel_index + ALPHA_INDEX_OFFSET] > 0.0)
                {
                    $BA_fire_red_signal = false;
                    $BA_fire_green_signal = false;
                    $BA_fire_blue_signal = false;


                    if (layer_enabled_config[COLOR_RED] && $BA_pix[$BA_pixel_index + RED_INDEX_OFFSET] > 0.0)
                    {
                        $BA_fire_red_signal = true;
                        $BA_color_signal = COLOR_RED;
                    }
                    else if(layer_enabled_config[COLOR_GREEN] && $BA_pix[$BA_pixel_index + GREEN_INDEX_OFFSET] > 0.0)
                    {
                        $BA_fire_green_signal = true;
                        $BA_color_signal = COLOR_GREEN;
                    }
                    else if(layer_enabled_config[COLOR_BLUE] && $BA_pix[$BA_pixel_index + BLUE_INDEX_OFFSET] > 0.0)
                    {
                        $BA_fire_blue_signal = true;
                        $BA_color_signal = COLOR_BLUE;
                    }

                    $BA_signal_wave = layer_signal_config[$BA_color_signal];

                    if ($BA_fire_red_signal || $BA_fire_green_signal || $BA_fire_blue_signal)
                    {
                        $BA_starting_sample_index = $BA_x_pixel_index * samples_per_pixel;
                        $BA_ending_sample_index = Math.min($BA_max_sample_index, $BA_starting_sample_index + samples_per_pixel);

                        for ($BA_sample_index = $BA_starting_sample_index;
                             $BA_sample_index < $BA_ending_sample_index;
                             $BA_sample_index++)
                        {
                            if (!sum_signal[$BA_sample_index])
                            {
                                sum_signal[$BA_sample_index] = 0.0;
                            }

                            if ($BA_fire_red_signal)
                            {
                                sum_signal[$BA_sample_index] += ($BA_pix[$BA_pixel_index + ALPHA_INDEX_OFFSET] / 255.0) *
                                    signals_waves[layer_signal_config[COLOR_RED]][(STAFF_HEIGHT - BORDER_WIDTH - 1) - $BA_y_pixel_index][$BA_sample_index];
                            }

                            if ($BA_fire_green_signal)
                            {
                                sum_signal[$BA_sample_index] += ($BA_pix[$BA_pixel_index + ALPHA_INDEX_OFFSET] / 255.0) *
                                    signals_waves[layer_signal_config[COLOR_GREEN]][(STAFF_HEIGHT - BORDER_WIDTH - 1) - $BA_y_pixel_index][$BA_sample_index];
                            }

                            if ($BA_fire_blue_signal)
                            {
                                sum_signal[$BA_sample_index] += ($BA_pix[$BA_pixel_index + ALPHA_INDEX_OFFSET] / 255.0) *
                                    signals_waves[layer_signal_config[COLOR_BLUE]][(STAFF_HEIGHT - BORDER_WIDTH - 1) - $BA_y_pixel_index][$BA_sample_index];
                            }

                            if (precompression_enabled)
                            {
                                if (sum_signal[$BA_sample_index] > MAX_PRECOMPRESSED_AMPLITUDE)
                                {
                                    sum_signal[$BA_sample_index] = MAX_PRECOMPRESSED_AMPLITUDE;
                                }
                                else if (sum_signal[$BA_sample_index] < -MAX_PRECOMPRESSED_AMPLITUDE)
                                {
                                    sum_signal[$BA_sample_index] = -MAX_PRECOMPRESSED_AMPLITUDE;
                                }

                                if (Math.abs(sum_signal[$BA_sample_index]) > $BA_max_amplitude)
                                {
                                    $BA_max_amplitude = Math.abs(sum_signal[$BA_sample_index]);
                                }
                            }
                        }
                    }
                }
            }
        }

        //console.log($BA_max_amplitude);

        if (precompression_enabled && precompression_normalization_enabled && $BA_max_amplitude)
        {
            $BA_max_amplitude = parseFloat($BA_max_amplitude);

            for (var i = 0; i < sum_signal.length; i++)
            {
                if (!(i % 100))
                {
                    //console.log('pre',sum_signal[i]);
                }
                sum_signal[i] = MAX_AMPLITUDE * (sum_signal[i] / $BA_max_amplitude);
                if (!(i % 100))
                {
                    //console.log('post',sum_signal[i]);
                }
            }
        }

        audio_buffer_source.buffer.getChannelData(0).set(sum_signal);
        audio_buffer_source.buffer.getChannelData(1).set(sum_signal);
        audio_buffer_source.noteOn(0);

        asyncBuffered = true;
    }

    /*
    // saved for debugging
    function expressionLog(expression)
    {
        console.log(expression, eval(expression));
    }
    */

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

    if (glitch_mode_on)
    {
        audio_buffer_source.connect(js_node);
        js_node.connect(gain_node);
    }
    else
    {
        audio_buffer_source.connect(gain_node);
    }

    gain_node.connect(dynamic_compressor_node);
    dynamic_compressor_node.connect(audio_context.destination);
}

function toggleGlitchMode()
{
    if ($('#glitch_mode_enabled').is(':checked'))
    {
        soundOff();
        glitch_mode_on = true;
        soundOn();
    }
    else
    {
        glitch_mode_on = false;
        js_buffer.BufferAsync();
    }
}

function setJSNodeBufferSize(size)
{
    js_node = audio_context.createJavaScriptNode(size, 1, 1);
    js_node.onaudioprocess = js_buffer.GetBuffer;

    connectNodes();
}

/**
 * Calculates what sound should be playing

 */
function playSound()
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
    $('#play_pause_button').text($('#play_pause_button').attr('pause_text'));
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
    $('#play_pause_button').text($('#play_pause_button').attr('play_text'));
}

/**
 * Sets the signal for the given color/layer.
 * @param color
 * @param signal
 */
function setColorSignal(color, signal)
{
    layer_signal_config[color] = eval(signal);
    js_buffer.BufferAsync();
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
        $('#slider').val(0);
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
        decay_interval = setInterval(function()
        {
            fadeSound($("#robo_decay").val());
            js_buffer.BufferAsync();
        }, 1000);
    }
    else
    {
        clearInterval(decay_interval);
        decay_interval = null;
    }
}

function togglePrecompression()
{
    precompression_enabled = !precompression_enabled;
    js_buffer.BufferAsync();
}

function setPrecompressionAmplitude(element)
{
    MAX_PRECOMPRESSED_AMPLITUDE = 21.0 - parseFloat($(element).val());
    js_buffer.BufferAsync();
}

function setDSPWave(wave)
{
    dsp_wave = DSP_WAVE_MAPPING[wave];
    signals = signals_waves[dsp_wave];
}

/**
 * Enable or disable color layers.
 * @param layer_color Color style of layer
 */
function toggleLayer(layer_color)
{
    layer_enabled_config[layer_color] = !layer_enabled_config[layer_color];
    js_buffer.BufferAsync();
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

    js_buffer.BufferAsync();
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

    js_buffer.BufferAsync();
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

    js_buffer.BufferAsync();
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

    js_buffer.BufferAsync();
}

/**
 * Data-ish functions
 */

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
        js_buffer.BufferAsync();
    }

    img.src = dataURL;
}

// Swagg functions

function saveState(isAutoSave)
{
    saved_states['count'] += 1;

    var save_data = {
        'image_data':staff_canvas_context.getImageData(0, 0, STAFF_WIDTH, STAFF_WIDTH),
        'data_url': getStorableData()
    }

    var recall_img = $("<img src='" + save_data['data_url'] + "' />");
    recall_img.width('165px').attr('load_id',saved_states['count']).click(function()
    {
        loadState(parseInt($(this).attr('load_id')));
    });

    var remove_img_button = $('<button>X</button>').attr('title', 'Remove from list');
    remove_img_button.click(function()
    {
        $(this).parent().remove();
    });

    var recall_container= $('<div>');
    recall_container.append(recall_img).append(remove_img_button);

    if (!isAutoSave)
    {
        $('#previous_draws').append(recall_container);
    }
    else
    {
        recall_img.width('142px');

        var move_to_recall_button = $('<button title="Add to Draw Recall list">+</button>');
        move_to_recall_button.click(function()
        {
            $('#previous_draws').append($(this).parent());
            $(this).parent().children('img').width('165px');
            $(this).remove();
        });

        recall_container.append(move_to_recall_button);

        recall_container.hide();
        $("#autosave_draws").append(recall_container);

        recall_container.show('slow', function()
        {
            if( $("#autosave_limit").val() != 0 &&
                $("#autosave_draws").children().length > $("#autosave_limit").val())
            {
                $("#autosave_draws").children().first().hide('slow', function()
                {
                    $("#autosave_draws").children().first().remove();
                });
            }
        });
    }

    saved_states[saved_states['count']] = save_data;
}

function loadState(id)
{
    if (id)
    {
        staff_canvas_context.putImageData(saved_states[id]['image_data'], 0, 0);
        js_buffer.BufferAsync();
    }
}

