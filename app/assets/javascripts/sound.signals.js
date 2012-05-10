/**
 * Signals Functions
 */

/**
 * Old-school scale generation, only used on init when we're not reading from the UI.
 * @param scale_keys
 * @return {Array}
 */
function generateScaleFromKeys(scale_keys)
{
    var this_scale = new Array(SEMITONE_COUNT);

    // Me? Trust array allocation? Hah!
    for (var i = 0; i < SEMITONE_COUNT; i++)
    {
        this_scale[i] = false;
    }

    for (var key in scale_keys)
    {
        this_scale[key] = true;
    }

    return this_scale;
}

/**
 * Fill outs the UI keyboard to reflect the selected scale. Transpose is the key. A=-3, Bf=-2, B=-1, C=0, ... since
 * all scales are transposed from C.
 * @param transpose Keys up/down from C.
 */
function populateScaleControl(transpose)
{
    if (!transpose)
    {
        transpose = 0;
    }

    $('input.key_toggle').removeAttr('checked');

    var scale_keys = SCALE_KEYS_MAPPING[$('input[name="scale_selection"]:checked').val()].slice(0);

    if (scale_keys)
    {
        for (var i = 0; i < scale_keys.length; i++)
        {
            scale_keys[i] = INDEX_TO_KEY_MAPPING[(KEY_TO_INDEX_MAPPING[scale_keys[i]] + transpose) % SEMITONE_COUNT];
            $('input.key_toggle[key="'+scale_keys[i]+'"]').attr('checked', 'checked')
        }
    }
}

/**
 * Reads scale data from the UI, gives it to the web worker and tells worker to swap out signals and cache it.
 */
function makeScale()
{
    if ($("#pause_on_scale_update").is(":checked"))
    {
        soundOff();
    }

    $("#pause_on_scale_update").attr('disabled', 'disabled');

    var generate_method = $('input[name="scale_generate_method"]:checked').val();

    var parameters = {};

    if (generate_method == GENERATE_METHOD_MUSICAL)
    {
        pending_scale = [false, false, false, false, false, false, false, false, false, false, false, false];

        friendly_key = [];

        $('.key_toggle:checked').each(function(){
            pending_scale[KEY_TO_INDEX_MAPPING[$(this).attr('key')]] = true;
            friendly_key.push($(this).attr('key'));
        });

        friendly_key.sort(function(a, b)
        {
            return KEY_TO_INDEX_MAPPING[a] - KEY_TO_INDEX_MAPPING[b];
        });

        friendly_key.push(key_start_index);
        friendly_key.push(key_end_index);

        friendly_key = friendly_key.join('-');

        parameters['scale'] = pending_scale;
    }
    else if (generate_method == GENERATE_METHOD_ALIEN)
    {
        parameters['base_freq'] = parseFloat($('#alien_base_freq').val());
        parameters['top'] = parseInt($('#alien_top').val());
        parameters['bottom'] = parseInt($('#alien_bottom').val());
        parameters['pdelt_subtract'] = parseInt($('#alien_pdelt_subtract').val());

        friendly_key = ["Alien",
            parseInt(parameters['base_freq']).toString(),
            parameters['top'].toString(),
            parameters['bottom'].toString(),
            parameters['pdelt_subtract'].toString()].join('-');
    }

    // disable button and indicate we are loading
    $('#make_scale').attr('disabled','disabled').text('Updating, please wait...');

    var loading_notifier = $('<img src="/assets/load.gif" />');
    $('#scale_loading_notifier').append(loading_notifier);

    if (!cached_signals[friendly_key])
    {
        if (worker == null)
        {
            worker = new Worker('/assets/sound.signals.worker.js');

            worker.onmessage = function (event)
            {
                signals_waves = event.data;

                cached_signals[friendly_key] = signals_waves;

                $('#make_scale').text('Scale generation complete');

                setTimeout(function(){
                    $('#make_scale').text('Update Scale').removeAttr('disabled');
                }, 1000);

                $('#scale_loading_notifier').children().remove('img');

                var previous_scale_button = $("<button>");
                previous_scale_button.addClass('active_scale_button').addClass('scale_button');

                previous_scale_button.text(friendly_key).attr('scale_key', friendly_key).click(function()
                {
                    $('.scale_button').removeClass('active_scale_button');
                    $(this).addClass('active_scale_button');
                    signals_waves = cached_signals[$(this).attr('scale_key')];
                    js_buffer.BufferAsync();
                });

                $('.scale_button').removeClass('active_scale_button');
                $("#previous_scales").append(previous_scale_button);

                if ($("#pause_on_scale_update").is(":checked"))
                {
                    playSound();
                }

                $("#pause_on_scale_update").removeAttr('disabled');

                js_buffer.BufferAsync();
            };
        }

        worker.postMessage({'generate_method':generate_method, 'parameters':parameters});
    }
    else
    {
        signals_waves = cached_signals[friendly_key];

        $('#make_scale').removeAttr('disabled');
        $('#scale_loading_notifier').children().remove('img');
        $('#make_scale').text('Scale updated');

        setTimeout(function()
        {
            $('#make_scale').text('Update Scale').removeAttr('disabled');
        }, 1000);

        js_buffer.BufferAsync();
    }
}

/**
 * Calculates the values for all the waves.
 */
function initSignals(generation_method, parameters)
{
    var generated_signals = {};
    generated_signals[DSP.SINE] = new Array(STAFF_HEIGHT);
    generated_signals[DSP.SAW] = new Array(STAFF_HEIGHT);
    generated_signals[DSP.SQUARE] = new Array(STAFF_HEIGHT);
    generated_signals[DSP.TRIANGLE] = new Array(STAFF_HEIGHT);

    // musical variables
    var scale_index;
    var scale_frequencies;
    var signal_frequencies;
    var granularity;
    var base_overtone_power;

    // alien variables
    var pdelt;
    var base_frequency;
    var pdelt_subtract;

    if (generation_method == GENERATE_METHOD_MUSICAL)
    {
        var scale = parameters['scale'];

        scale_index = key_start_index % SEMITONE_COUNT;

        scale_frequencies = key_frequencies.slice(key_start_index, key_end_index);
        signal_frequencies = [];

        for (var i = 0; i < scale_frequencies.length; i++)
        {
            if (scale[scale_index])
            {
                signal_frequencies.push(scale_frequencies[i]);
            }

            scale_index = (scale_index + 1) % SEMITONE_COUNT;
        }

        granularity = STAFF_HEIGHT / signal_frequencies.length;

        base_overtone_power = -1 * (Math.floor(granularity / 2) - !(Math.floor(granularity) % 2));
    }
    else if (generation_method == GENERATE_METHOD_ALIEN)
    {
        // 400*2^((p-64)/12) = f
        // 108 hi key on 88key piano, 21 low key

        pdelt = (parameters['top'] - parameters['bottom']) / STAFF_HEIGHT;
        base_frequency = parameters['base_freq'];
        pdelt_subtract = parameters['pdelt_subtract'];
    }

    var freq = null;
    var base_freq;
    var overtone_power = base_overtone_power;
    var bucket_index;
    var bucket_index_previous;

    var overtone_amplitude = null;

    for (var i = 0; i < STAFF_HEIGHT; i++)
    {
        var freq_previous = freq;

        if (generation_method == GENERATE_METHOD_MUSICAL)
        {
            bucket_index = Math.floor(i / granularity);

            if (bucket_index != bucket_index_previous)
            {
                overtone_power = base_overtone_power;
            }

            base_freq = signal_frequencies[bucket_index];
            freq = base_freq * Math.pow(2, overtone_power);

            bucket_index_previous = bucket_index;
            overtone_power += 1;
        }
        else if (generation_method == GENERATE_METHOD_ALIEN)
        {
            freq = base_frequency * Math.pow(2, ((i * pdelt) - pdelt_subtract) / parseFloat(SEMITONE_COUNT));
        }

        if (freq != freq_previous)
        {
            generated_signals[DSP.SINE][i] = makeSignal(freq, DSP.SINE, overtone_amplitude);
            generated_signals[DSP.SAW][i] = makeSignal(freq, DSP.SAW, overtone_amplitude);
            generated_signals[DSP.SQUARE][i] = makeSignal(freq, DSP.SQUARE, overtone_amplitude);
            generated_signals[DSP.TRIANGLE][i] = makeSignal(freq, DSP.TRIANGLE, overtone_amplitude);
        }
        else
        {
            /*
            generated_signals[DSP.SINE][i] = new Float32Array(generated_signals[DSP.SINE][i - 1]);
            generated_signals[DSP.SAW][i] = new Float32Array(generated_signals[DSP.SAW][i - 1]);
            generated_signals[DSP.SQUARE][i] = new Float32Array(generated_signals[DSP.SQUARE][i - 1]);
            generated_signals[DSP.TRIANGLE][i] = new Float32Array(generated_signals[DSP.TRIANGLE][i - 1]);
            */

            /*
            // hopefully cloning fixes crashes people have been getting or not
            generated_signals[DSP.SINE][i] = cloneFloat32Array(generated_signals[DSP.SINE][i - 1]);
            generated_signals[DSP.SAW][i] = cloneFloat32Array(generated_signals[DSP.SAW][i - 1]);
            generated_signals[DSP.SQUARE][i] = cloneFloat32Array(generated_signals[DSP.SQUARE][i - 1]);
            generated_signals[DSP.TRIANGLE][i] = cloneFloat32Array(generated_signals[DSP.TRIANGLE][i - 1]);
            */

            generated_signals[DSP.SINE][i] = generated_signals[DSP.SINE][i - 1];
            generated_signals[DSP.SAW][i] = generated_signals[DSP.SAW][i - 1];
            generated_signals[DSP.SQUARE][i] = generated_signals[DSP.SQUARE][i - 1];
            generated_signals[DSP.TRIANGLE][i] = generated_signals[DSP.TRIANGLE][i - 1];
        }
    }

    return generated_signals;
}

/**
 * Generates array which corresponds to values of wave.
 * @param frequency The frequency
 * @returns Array representing the signal. Ranges -1.0 to 1.0
 */
function makeSignal(frequency, wave, amplitude)
{
    if (!wave)
    {
        wave = dsp_wave;
    }

    if (!amplitude)
    {
        amplitude = MAX_AMPLITUDE;
    }

    osc = new Oscillator(wave, frequency, amplitude, NUM_SAMPLES, SAMPLE_RATE);

    osc.generate();
    return osc.signal;
}

function cloneFloat32Array(array_to_clone)
{
    var clone = new Float32Array(array_to_clone.length);

    for (var i = 0; i < array_to_clone.length; i++)
    {
        clone[i] = array_to_clone[i];
    }

    return clone;
}

function setKeyStartIndex(element)
{
    key_start_index = parseInt($(element).val());
    $('#key_top').val(Math.max(parseInt($('#key_top').val()), key_start_index + 1));
}

function setKeyEndIndex(element)
{
    key_end_index = parseInt($(element).val());
    $('#key_bottom').val(Math.min($('#key_bottom').val(), $(this).val() - 1));
}