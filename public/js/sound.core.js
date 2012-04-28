// JSBG = javascript buffer globals.
// Keeping these as globals increases performance.


useClosure = false;

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


function setJSNodeBufferSize(size)
{
    audio_buffer_source.disconnect(0);
    js_node.disconnect(0);
    js_node = audio_context.createJavaScriptNode(size, 1, 1);

    //if (useClosure)
    //{
        js_node.onaudioprocess = js_buffer.BufferSound;
    //}
   // else
    //{
        //js_node.onaudioprocess = JSBufferSound;
    //}
    audio_buffer_source.connect(js_node);
    js_node.connect(gain_node);
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

    // connect the gainNode;
    gain_node.connect(audio_context.destination);
    // TODO get value with jQuery
    // gainNode.gain = document.getElementById("slider").value;

    // Animate here also
    // need to fix pausing timing issue.
    // TODO Hand over to drawing module
    start_time = audio_context.currentTime;
    audio_buffer_source.noteOn(0);

    // TODO move to draw module
    animateLine();
}

/**
 * Stops the sound.
 */
function soundOff()
{
    // turn off
    audio_is_playing = false;
    // source.noteOff(0);
    gain_node.disconnect(0);
    // position is where in the loop we stopped.
    // currentTime - start_time is the amount of time elapsed since start
    // needs to include position offset.
    // TODO don't use global here, will be calling from another function.
    scrub_line_position = ((audio_context.currentTime - start_time) + scrub_line_position) % 1.0;
    // call to animate toggle.
    animateLine();
    // el.textContent = 'play';
    //drawScrubLine(0);
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
        return null;
    }

    //bufferSound();

    // Start scanning left to right and loop
    soundOn();

    //setInterval(fadeSound, 1000);
    //setInterval(roboMode, 1000);
    //setInterval(function() { roboMode(false, true)}, 1000);
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
        //bufferSound();
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
        //bufferSound();
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
        //bufferSound();
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
        //bufferSound();
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
