/**
 * Initialize contexts for canvases, audio context for audio API, preprocesses signals.
 */

$(document).ready(function()
{	
	//Check to see if canvas exists on this page. if not, return since we are not on a drawing page.
	if ($("canvas.staff").length == 0)
    {
	    return true;
	}

    // Position canvas
    $('canvas.staff').css('border', "thin solid green");
    $('.staff-container').css({top:CANVAS_HEIGHT_OFFSET, left: CANVAS_WIDTH_OFFSET}).removeClass('hidden');

    // Load up context for canvas
    staff_canvas_context = $("canvas.staff")[0].getContext("2d");
    bar_canvas_context = $("canvas.bar")[0].getContext("2d");

    staff_canvas_context.lineCap = 'round';

    // Position panels
    //$("#below_staff_area").css({top:CANVAS_HEIGHT_OFFSET + $('canvas.staff').height() + BELOW_STAFF_HEIGHT_OFFSET}).removeClass('hidden');
    $("#controls").css({top:CANVAS_HEIGHT_OFFSET + $('canvas.staff').height() + BELOW_STAFF_HEIGHT_OFFSET}).removeClass('hidden');

    /*
        .ready(function()
    {
        // Initialization events
        initScale();
        initAudio();
        resetStaff();
        playSound();
    });
    */

    $("#side_panel").css({top:CANVAS_HEIGHT_OFFSET, left:CANVAS_WIDTH_OFFSET + $('canvas.staff').width() + BELOW_STAFF_HEIGHT_OFFSET}).removeClass('hidden');


     // Initialization events
    initScale();
    initAudio();
    resetStaff();

	//Draw graph lines
    /*
	for(var i = 0; i < STAFF_HEIGHT; i+=signal_granularity) 
	{
		// #("canvas.bar").drawLine({
		// 	x0 = 0,
		// 	y0 = i;
		// 	x1= STAFF_WIDTH;
		// 	y1 = il
		// });
	}
	*/

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
    });

    $("#js_node_buffer_size").change(function()
    {
        setJSNodeBufferSize($(this).val());
    });

    $("#dspwave_red").change(function()
    {
        setColorSignal(COLOR_RED, $(this).val());
    });

    $("#dspwave_green").change(function()
    {
        setColorSignal(COLOR_GREEN, $(this).val());
    });

    $("#dspwave_blue").change(function()
    {
        setColorSignal(COLOR_BLUE, $(this).val());
    });

    // Scale controls
    $('.scale_key_control').each(function()
    {
        $(this).append($('#scale_key_control_definitive').children('select').first().clone());
    });
    $('#scale_key_control_definitive').addClass('scale_key_control');

    var scale_selection_input_selector = 'input[name="scale_selection"]';

    $(scale_selection_input_selector).change(function()
    {
        if ($('input[name="scale_generate_method"]:checked').val() == "musical" &&
            $(this).is(":checked"))
        {
            var transpose = parseInt($(this).parents('.premade_scale').children('.scale_key_control').children('select').val());
            populateScaleControl(transpose);
        }
    });

    $('.scale_key_control select').change(function()
    {
        if ($('input[name="scale_generate_method"]:checked').val() == "musical" &&
            $(this).parents('.premade_scale').find(scale_selection_input_selector).is(':checked'))
        {
            var transpose = parseInt($(this).val());
            populateScaleControl(transpose);
        }
    });

    // Start the scrub line
    playSound();

    // Save/Load
    if ($('#stored_data').length)
    {
        loadFromDataURL($('#stored_data').attr('data'));
    }
    else
    {
        $('#new_jam').submit(function() { $('#jam_song').val(getStorableData()); return true; });
    }
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
        if (!$.browser.webkit)
        {
            alert("You area browser that supports the AudioContext API, but does not appear to be Google Chrome. DrawJam will probably not work correctly for you! "+
                "DrawJam is only supported in Google Chrome, which you can download at http://www.google.com/chrome");
        }

        audio_context = new AudioContext();

        audio_buffer_source = audio_context.createBufferSource();
        audio_buffer_source.buffer = audio_context.createBuffer(NUM_CHANNELS, NUM_SAMPLES, SAMPLE_RATE);

        audio_buffer_source.loop = true;

        js_node = audio_context.createJavaScriptNode(DEFAULT_BITRATE, 1, 1);
        js_buffer = BufferController();
        js_node.onaudioprocess = js_buffer.GetBuffer;

        gain_node = audio_context.createGainNode();
        gain_node.gain.value = 0.1;

        dynamic_compressor_node = audio_context.createDynamicsCompressor();

        convolution_node = audio_context.createConvolver();
        convolution_node.buffer = audio_context.createBuffer(NUM_CHANNELS, NUM_SAMPLES, SAMPLE_RATE);

        var delta_function = new Float32Array(NUM_SAMPLES);
        delta_function[0] = 1.0;

        convolution_node.buffer.getChannelData(0).set(delta_function);
        convolution_node.buffer.getChannelData(1).set(delta_function);

        connectNodes();
    }
    else
    {
        alert("You are not using a browser that supports the AudioContext API! DrawJam will not work!!!" +
            " DrawJam is only supported in Google Chrome, which you can download at http://www.google.com/chrome");
    }
}

function initScale()
{
    $('input[name="scale_selection"][value="scale_pentatonic"]').attr("checked", "checked");
    populateScaleControl();
    //signals_waves = initSignals("musical", {'scale':generateScaleFromKeys(keys_pentatonic_scale)});
    signals_waves = initSignals("alien",
        {
            'base_freq':440.0,
            'top':108,
            'bottom':40,
            'pdelt_subtract':40
        }
    );
    signals = signals_waves[DSP.SINE];
    cached_signals['default'] = signals_waves;
}

function recallDefaultScale()
{
    signals_waves = cached_signals['default'];
    js_buffer.BufferAsync();
}