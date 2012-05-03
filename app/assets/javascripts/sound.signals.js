/**
 * Global signals constants (should probably put these in closure)
 */

var GENERATE_METHOD_ALIEN = "alien";
var GENERATE_METHOD_MUSICAL = "musical";

// Not gonna change unless we move away from Western music scale because we don't want to hear nice things any more.
const SEMITONE_COUNT = 12;

/**
 *Frequencies of piano keys from 1 (A0 Double Pedal A)  through 88 (C8 Eighth octave).
 * Delete this and die a slow painful death.
 * Knowledge swag: https://en.wikipedia.org/wiki/Piano_key_frequencies#Virtual_keyboard
 */
var key_frequencies = [27.5, 29.1352, 30.8677, 32.7032, 34.6478, 36.7081, 38.8909, 41.2034, 43.6535, 46.2493, 48.9994, 51.9131,
    55, 58.2705, 61.7354, 65.4064, 69.2957, 73.4162, 77.7817, 82.4069, 87.3071, 92.4986, 97.9989, 103.826, 110, 116.541,
    123.471, 130.813, 138.591, 146.832, 155.563, 164.814, 174.614, 184.997, 195.998, 207.652, 220, 233.082, 246.942, 261.626,
    277.183, 293.665, 311.127, 329.628, 349.228, 369.994, 391.995, 415.305, 440, 466.164, 493.883, 523.251, 554.365, 587.33,
    622.254, 659.255, 698.456, 739.989, 783.991, 830.609, 880, 932.328, 987.767, 1046.5, 1108.73, 1174.66, 1244.51, 1318.51,
    1396.91, 1479.98, 1567.98, 1661.22, 1760, 1864.66, 1975.53, 2093, 2217.46, 2349.32, 2489.02, 2637.02, 2793.83, 2959.96,
    3135.96, 3322.44, 3520, 3729.31, 3951.07, 4186.01];

/**
 * Keys and their indices. A is 0 because it's the first in our key frequency list.
 * Sharp/flat names are randomly chosen for aesthetics, deal with it.
 */
var KEY_TO_INDEX_MAPPING = {
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
};

// Reverse lookup of key indices, lol duplication.
var INDEX_TO_KEY_MAPPING = [
    "A",
    "Bf",
    "B",
    "C",
    "Cs",
    "D",
    "Ef",
    "E",
    "F",
    "Fs",
    "G",
    "Af"
];

/**
 * All scales in C because it's the easiest to remember. Want a different key? Too bad, don't put it here. Figure
 * it out in C and transpose in the UI.
  */
var keys_chromatic_scale =  ["A", "Bf", "B", "C", "Cs", "D", "Ef", "E", "F", "Fs", "G", "Af"];

var keys_major_scale =      ["A",       "B", "C",       "D",       "E", "F",       "G"      ];

var keys_octave_scale =     [                "C"                                            ];

var keys_chinese_scale =    [     "Bf",           "Cs",      "Ef",           "Fs",      "Af"];

var keys_pentatonic_scale = ["A",            "C",       "D",       "E",            "G"      ];

var keys_minor_scale =      [     "Bf",      "C",       "D", "Ef",      "F",       "G", "Af"];

var SCALE_KEYS_MAPPING = {
    "scale_chromatic": keys_chromatic_scale,
    "scale_major": keys_major_scale,
    "scale_minor": keys_minor_scale,
    "scale_octave": keys_octave_scale,
    "scale_chinese": keys_chinese_scale,
    "scale_pentatonic": keys_pentatonic_scale
}

// Scale with no notes. Think it's useless? Think again - used as blank canvas for building scales.
/*              A      A# (Bf)  B      C      C# (Cs)  D      D# (Ef)  E      F      F#     G      G#  (Af) */
var no_scale = [false, false,   false, false, false,   false, false,   false, false, false, false, false    ];

/**
 * Global signals variables (should probably put these in closure)
 */

// WebWorker dude. Respect his rights or he'll Occupy your CPU.
var worker = null;

// A friendly key to help the user remember their dumb scale. Also the only key since there was no point in making
// another key that does all the same things. Lol legacy naming.
var friendly_key;

// Beginning and ending keys for your musical scale needs. Default is A0 Double Pedal A - C8 Eighth Octave because
// that's a piano.
var key_start_index = 0;
var key_end_index = key_frequencies.length;

var pending_scale;
var cached_signals = {};

// Oscillator
var osc;

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