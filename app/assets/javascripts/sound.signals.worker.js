// try/catch since importScripts is only defined when called as worker.
try
{
    importScripts('/assets/dsp.js');
    importScripts('/assets/sound.variables.constants.js');
    importScripts('/assets/sound.variables.js');
    importScripts('/assets/sound.signals.js');
}
catch(e){}

onmessage = function(event)
{
    var generated_signals = initSignals(event.data['generate_method'], event.data['scale']);
    postMessage(generated_signals);
}