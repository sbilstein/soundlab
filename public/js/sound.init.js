/**
 * Initialize contexts for canvases, audio context for audio API, preprocesses signals.
 */
$(document).ready(function()
{
    // Load up context for canvas
    staff_canvas_context = $("canvas.staff")[0].getContext("2d");
    bar_canvas_context = $("canvas.bar")[0].getContext("2d");

    // position canvas
    $('.staff-container').css({top:CANVAS_HEIGHT_OFFSET, left: CANVAS_WIDTH_OFFSET});
    $("#below_staff_area").css({top:CANVAS_HEIGHT_OFFSET + $('canvas.staff').height() + BELOW_STAFF_HEIGHT_OFFSET});
    $("#buttons").css({top:CANVAS_HEIGHT_OFFSET + $('canvas.staff').height() + BELOW_STAFF_HEIGHT_OFFSET});

    // Initialization events
    drawBorder();
    initSignals();
    initAudio();
    resetStaff();

    // UI binding
    $("canvas.bar").mousedown(startPen);


    $('input[name="layer_select"]').change(function()
        {
            setPenColor(COLOR_VALUE_MAPPING[$('input[name="layer_select"]:checked').val()]);
        }
    );

    $('input[name="tool_style"]').change(switchToolStyle);


    $("input[name='robo_mode']").change(function()
    {
        robo_mode = $("input[name='robo_mode']:checked").val();
        if (robo_mode == 'curve')
        {
            $('#robo_decay').val(255);
        }
    })

    $("#js_node_buffer_size").change(function()
    {
        setJSNodeBufferSize($(this).val());
    })

    $("#dspwave").change(function()
    {
        setDSPWave($(this).val());
    })

    $("#dspwave_red").change(function()
    {
        setColorSignal(COLOR_RED, $(this).val());
    })

    $("#dspwave_green").change(function()
    {
        setColorSignal(COLOR_GREEN, $(this).val());
    })

    $("#dspwave_blue").change(function()
    {
        setColorSignal(COLOR_BLUE, $(this).val());
    })

    // Save/Load
    if ($('#stored_data').length)
    {
        loadFromDataURL($('#stored_data').attr('data'));
    }
    else
    {
        $('#new_jam').submit(function() { $('#jam_song').val(getStorableData()); return true; });
    }

    if ($("#autoflush").is(":checked"))

    // Start the scrub line
    playSound(true);
});

/**
 * Initializes audio.
 */
function initAudio()
{
    // set window.AudioContext to either the webkit or moz context
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    if (window.AudioContext)
    {
        // TODO: alert here if browser is not Chrome using BrowserDetect

        audio_context = new AudioContext();
        audio_buffer_source = audio_context.createBufferSource();
        audio_buffer_source.buffer = audio_context.createBuffer(NUM_CHANNELS, NUM_SAMPLES, SAMPLE_RATE);
        audio_buffer_source.looping = true;  // TODO Deprecated, use loop instead
        gain_node = audio_context.createGainNode();
        gain_node.gain.value = 0.1;

        if (!asyncCalled)
        {
            js_node = audio_context.createJavaScriptNode(DEFAULT_BITRATE, 1, 1);
            js_buffer = BufferController();


            js_node.onaudioprocess = js_buffer.BufferJIT;

            audio_buffer_source.connect(js_node);
            js_node.connect(gain_node);
            gain_node.connect(audio_context.destination);
        }
        else
        {
            soundOn();
        }
    }
    else
    {
        alert("You are not using a browser that supports the AudioContext API! DrawJam will not work!!! We recommend using Google Chrome, which you can download at http://www.google.com/chrome");
    }
}

/**
 * Calculates the values for all the waves.
 */
function initSignals()
{
    var scale_index = 0;
    // 400*2^((p-64)/12) = f
    // 108 hi key on 88key piano, 21 low key
    // pdelt = (108.0-21.0)/STAFFHEIGHT;
    pdelt = (108.0 - 40.0) / STAFF_HEIGHT;
    //pdelt = (96.0 - 40.0) / STAFF_HEIGHT;
    for (var i = 0; i < STAFF_HEIGHT; i++)
    {
        // i + 5
        freq = 440.0 * Math.pow(2, (((i * pdelt) + 40) - 69.0) / 12.0);
        //freq = 440.0 * Math.pow(2, (i - 49) / 12);
        /*
         if(scale[scale_index])
         //if (true)
         {
         freq = 440.0 * Math.pow(2, (i - 49) / 12);
         }
         else
         {
         freq = 0;
         }
         */

        //signals[i] = makeSignal(freq);
        signals_waves[DSP.SINE][i] = makeSignal(freq, DSP.SINE);
        signals_waves[DSP.SAW][i] = makeSignal(freq, DSP.SAW);
        signals_waves[DSP.SQUARE][i] = makeSignal(freq, DSP.SQUARE);
        signals_waves[DSP.TRIANGLE][i] = makeSignal(freq, DSP.TRIANGLE);

        scale_index = (scale_index+1)%12;
    }

    signals = signals_waves[DSP.SINE];
}

/**
 * Generates array which corresponds to values of wave.
 * @param frequency The frequency
 * @returns Array representing the signal. Ranges -1.0 to 1.0
 */
function makeSignal(frequency, wave)
{
    if (!wave)
    {
        wave = dsp_wave;
    }
    var osc = new Oscillator(wave, frequency, 1, NUM_SAMPLES, SAMPLE_RATE);

    osc.generate();
    return osc.signal;
}
