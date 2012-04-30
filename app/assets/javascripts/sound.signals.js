// Frequencies of piano keys from 1 (A0 Double Pedal A)  through 88 (C8 Eighth octave)
var keys = [27.5, 29.1352, 30.8677, 32.7032, 34.6478, 36.7081, 38.8909, 41.2034, 43.6535, 46.2493, 48.9994, 51.9131,
    55, 58.2705, 61.7354, 65.4064, 69.2957, 73.4162, 77.7817, 82.4069, 87.3071, 92.4986, 97.9989, 103.826, 110, 116.541,
    123.471, 130.813, 138.591, 146.832, 155.563, 164.814, 174.614, 184.997, 195.998, 207.652, 220, 233.082, 246.942, 261.626,
    277.183, 293.665, 311.127, 329.628, 349.228, 369.994, 391.995, 415.305, 440, 466.164, 493.883, 523.251, 554.365, 587.33,
    622.254, 659.255, 698.456, 739.989, 783.991, 830.609, 880, 932.328, 987.767, 1046.5, 1108.73, 1174.66, 1244.51, 1318.51,
    1396.91, 1479.98, 1567.98, 1661.22, 1760, 1864.66, 1975.53, 2093, 2217.46, 2349.32, 2489.02, 2637.02, 2793.83, 2959.96,
    3135.96, 3322.44, 3520, 3729.31, 3951.07, 4186.01];

const KEY_INDEX_MAPPING = {
    "A":  0,
    "Bf": 1,
    "B":  2,
    "C":  3,
    "Cs": 4,
    "D":  5,
    "Ef": 6,
    "E":  7,
    "F":  8,
    "Fs": 9,
    "G":  10,
    "Af": 11
}



var key_start_index = 0;
var key_end_index = keys.length;

//var key_start_index = 24;
//var key_end_index = 59;

/*                       A      A# (Bf)  B      C      C# (Cs)      D     D# (Ef)     E      F      F#     G      G#  (Af)       */
var no_scale =          [false, false, false, false, false, false, false, false, false, false, false, false];

var chromatic_scale =   [true,  true,  false, true,  false, false, true,  false, false, true,  false, false];
var keys_chromatic_scale = ["A", "Bf", "B", "C", "Cs", "D", "Ef", "E", "F", "Fs", "G", "Af"];

var major_scale =       [true,  false, true,  true,  false, true,  false, true,  true,  false, true,  false];
var keys_major_scale = ["A", "B", "C", "D", "E", "F", "G"];

var octave_scale =      [true, false, false, false, false, false, false, false, false, false, false, false];
var keys_octave_scale = ["C"];

var keys_chinese_scale = ["Bf", "Cs", "Ef", "Fs", "Af"];

var keys_pentatonic_scale = ["C", "D", "E", "G", "A"];

//var scale =             [true,  false, false, true,  false, false, true,  false, false, true,  false, false];

/*                       A      A#     B      C      C#      D     D#     E      F      F#     G      G#         */

const SCALE_KEYS_MAPPING = {
    "scale_chromatic": keys_chromatic_scale,
    "scale_major": keys_major_scale,
    "scale_octave": keys_octave_scale,
    "scale_chinese": keys_chinese_scale,
    "scale_pentatonic": keys_pentatonic_scale
}

var pending_scale;
var cached_signals = {};

function populateScaleControl()
{
    $('input.key_toggle').removeAttr('checked');

   var scale_keys = SCALE_KEYS_MAPPING[$('input[name="scale_selection"]:checked').val()];
    if (scale_keys)
    {
        for (var i = 0; i < scale_keys.length; i++)
        {
            $('input.key_toggle[key="'+scale_keys[i]+'"]').attr('checked', 'checked')
        }
    }
}

function makeScale()
{
    pending_scale = [false, false, false, false, false, false, false, false, false, false, false, false];

    $('.key_toggle:checked').each(function(){
        pending_scale[KEY_INDEX_MAPPING[$(this).attr('key')]] = true;
    })

    // disable button and indicate we are loading
    $('#make_scale').attr('disabled','disabled');
    var loading_notifier = $('<img src="/assets/load.gif" />');
    $('#scale_loading_notifier').append(loading_notifier);

    var pending_scale_key = pending_scale.join(',');
    if (!cached_signals[pending_scale_key])
    {
        var worker = new Worker('/assets/sound.signals.worker.js');

        worker.onmessage = function (event) {
            signals_waves = event.data;

            cached_signals[pending_scale.join(',')] = signals_waves;

            $('#make_scale').removeAttr('disabled');
            $('#scale_loading_notifier').children().remove('img');

            js_buffer.BufferAsync();
        };

        worker.postMessage({'generate_method':$('input[name="scale_generate_method"]:checked').val(), 'scale':pending_scale});
    }
    else
    {
        signals_waves = cached_signals[pending_scale_key];

        $('#make_scale').removeAttr('disabled');
        $('#scale_loading_notifier').children().remove('img');

        js_buffer.BufferAsync();
    }
}


/**
 * Calculates the values for all the waves.
 */
function initSignals(generation_method, scale)
{
    var generated_signals = {};
    generated_signals[DSP.SINE] = new Array(STAFF_HEIGHT);
    generated_signals[DSP.SAW] = new Array(STAFF_HEIGHT);
    generated_signals[DSP.SQUARE] = new Array(STAFF_HEIGHT);
    generated_signals[DSP.TRIANGLE] = new Array(STAFF_HEIGHT);

    var scale_index = key_start_index % 12;
    //var scale = octave_scale;

    var scale_frequencies = keys.slice(key_start_index, key_end_index);
    var signal_frequencies = [];

    for (var i = 0; i < scale_frequencies.length; i++)
    {
        if (scale[scale_index])
        {
            signal_frequencies.push(scale_frequencies[i]);
        }

        scale_index = (scale_index + 1) % 12;
    }

    var granularity = STAFF_HEIGHT / signal_frequencies.length;

    // 400*2^((p-64)/12) = f
    // 108 hi key on 88key piano, 21 low key
    // pdelt = (108.0-21.0) / STAFFHEIGHT;
    //pdelt = (96.0 - 40.0) / STAFF_HEIGHT;
    var pdelt = (108.0 - 40.0) / STAFF_HEIGHT;

    var freq = null;
    var i_mod;

    for (var i = 0; i < STAFF_HEIGHT; i++)
    {
        var prev_freq = freq;

        if (generation_method == "musical")
        {
            i_mod = Math.floor(i / granularity);
            freq = signal_frequencies[i_mod];
        }
        else if (generation_method == "alien")
        {
            //freq = 440.0 * Math.pow(2, (((i_mod * pdelt) + 40) - 69.0) / 12.0);
            freq = 440.0 * Math.pow(2, (((i * pdelt) + 40) - 69.0) / 12.0);
        }

        if (freq != prev_freq)
        {
            generated_signals[DSP.SINE][i] = makeSignal(freq, DSP.SINE);
            generated_signals[DSP.SAW][i] = makeSignal(freq, DSP.SAW);
            generated_signals[DSP.SQUARE][i] = makeSignal(freq, DSP.SQUARE);
            generated_signals[DSP.TRIANGLE][i] = makeSignal(freq, DSP.TRIANGLE);
        }
        else
        {
            generated_signals[DSP.SINE][i] = new Float32Array(generated_signals[DSP.SINE][i - 1]);
            generated_signals[DSP.SAW][i] = new Float32Array(generated_signals[DSP.SAW][i - 1]);
            generated_signals[DSP.SQUARE][i] = new Float32Array(generated_signals[DSP.SQUARE][i - 1]);
            generated_signals[DSP.TRIANGLE][i] = new Float32Array(generated_signals[DSP.TRIANGLE][i - 1]);
        }
    }

    return generated_signals;
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