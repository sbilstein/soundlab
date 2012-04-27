function weirdSound(period, freq)
{
    var row_pixel_index;

    // Loop through each pixel
    var imgd = staff_canvas_context.getImageData(BORDER_WIDTH,
        BORDER_WIDTH,
        STAFF_WIDTH - BORDER_WIDTH * 2,
        STAFF_HEIGHT - BORDER_WIDTH * 2);

    var data = imgd.data;

    for (var column_pixel_index = 0; column_pixel_index < imgd.width; column_pixel_index++)
    {
        //row_pixel_index = parseInt(Math.sin(column_pixel_index) * imgd.height);
        //row_pixel_index = column_pixel_index > imgd.width / 2? parseInt(imgd.height * 0.75) : parseInt(imgd.height * 0.25);
        /*
         if (column_pixel_index % 100 > 50)
         {
         row_pixel_index = imgd.height * 0.75;
         }
         else
         {
         row_pixel_index = imgd.height * 0.5;
         }
         */

        row_pixel_index = parseInt(imgd.height * freq + Math.sin(period* column_pixel_index) * 50);

        pixel_index = computePixelIndex(column_pixel_index, row_pixel_index, imgd.width);
        data[pixel_index + RED_INDEX_OFFSET] = 255;
        data[pixel_index + ALPHA_INDEX_OFFSET] = 255;
    }

    imgd.data = data;
    staff_canvas_context.putImageData(imgd, BORDER_WIDTH, BORDER_WIDTH);

    if (audio_is_playing)
    {
        bufferSound();
        soundOn();
        animateLine();
    }
}

function makeBeat(frequency, beats_per_frame, offset, beat_structure, beat_length)
{
    var beat_units = STAFF_WIDTH/beats_per_frame;
    console.log('beat units',beat_units);

    if (!offset)
    {
        offset = 0;
    }

    if (!beat_length)
    {
        beat_length = 1;
    }

    var row_pixel_index;
    var pixel_index;

    // Loop through each pixel
    var imgd = staff_canvas_context.getImageData(BORDER_WIDTH,
        BORDER_WIDTH,
        STAFF_WIDTH - BORDER_WIDTH * 2,
        STAFF_HEIGHT - BORDER_WIDTH * 2);

    var data = imgd.data;

    var beat_increment = parseInt(beat_units);
    var beat_index = 0;

    var column_pixel_index = offset;
    var beat_frequency = frequency;

    console.log('imgd.width', imgd.width);

    while (column_pixel_index < imgd.width)
    {
        /*
         if (beat_structure)
         {
         if (beat_structure[beat_index] < 0)
         {
         beat_frequency = 1 - frequency;
         }
         else
         {
         beat_frequency = frequency;
         }
         }
         */

        row_pixel_index = parseInt(imgd.height * beat_frequency);
        var target = row_pixel_index - 100;


        var swag_modifier = 1;

        for (var i = row_pixel_index; i > target; i--)
        {

            for (var j = 0; j < beat_length; j++)
            {
                //console.log(j,parseInt(Math.log(j))+1);
                pixel_index = computePixelIndex(column_pixel_index + (1 - parseInt(1 - 4*Math.sqrt(swag_modifier))) + j, i, imgd.width);
                data[pixel_index + RED_INDEX_OFFSET] = 255;
                data[pixel_index + ALPHA_INDEX_OFFSET] = 255;

            }

            swag_modifier += 1;
        }

        if (beat_structure)
        {
            //beat_increment = Math.abs(beat_structure[beat_index]) * beat_units;
            beat_increment = beat_structure[beat_index] * beat_units;
            beat_index = (beat_index + 1) % beat_structure.length;
        }

        column_pixel_index += parseInt(beat_increment);
        console.log('column_pixel_index now', column_pixel_index);
    }

    imgd.data = data;
    staff_canvas_context.putImageData(imgd, BORDER_WIDTH, BORDER_WIDTH);

    if (audio_is_playing)
    {
        bufferSound();
        soundOn();
        animateLine();
    }
}


function fadeSound(rate)
{
    if (!rate)
    {
        rate = 20;
    }
    // Loop through each pixel
    var imgd = staff_canvas_context.getImageData(BORDER_WIDTH,
        BORDER_WIDTH,
        STAFF_WIDTH - BORDER_WIDTH * 2,
        STAFF_HEIGHT - BORDER_WIDTH * 2);

    var data = imgd.data;

    for (var i = 0; i < imgd.width * imgd.height; i++)
    {
        data[i*4 + ALPHA_INDEX_OFFSET] = Math.max(0, data[i*4 + ALPHA_INDEX_OFFSET] - rate);
    }

    imgd.data = data;
    staff_canvas_context.putImageData(imgd, BORDER_WIDTH, BORDER_WIDTH);

    if (audio_is_playing)
    {
        bufferSound();
        soundOn();
        animateLine();
    }
}

var robo_mode = "random";

// TODO: Clean up this mess!
function roboMode()
{
    var robo_directive = pen_directive;

    if (robo_mode == 'chaos')
    {
        robo_directive['x1'] = parseInt(Math.random() * STAFF_WIDTH - BORDER_WIDTH * 2) + BORDER_WIDTH;
        robo_directive['x2'] = parseInt(Math.random() * STAFF_WIDTH - BORDER_WIDTH * 2) + BORDER_WIDTH;
        robo_directive['y1'] = parseInt(Math.random() * STAFF_HEIGHT - BORDER_WIDTH * 2) + BORDER_WIDTH;
        robo_directive['y2'] = parseInt(Math.random() * STAFF_HEIGHT - BORDER_WIDTH * 2) + BORDER_WIDTH;
        $("canvas.staff").drawLine(robo_directive);
    }
    else
    {

        //var length_to_draw = 100;
        var length_to_draw = parseInt(Math.random()* 400 + 10);
        //var length_to_draw = parseInt(((Math.random() * STAFF_WIDTH - BORDER_WIDTH * 2) + BORDER_WIDTH)/4);
        var y = parseInt(Math.random() * STAFF_HEIGHT - BORDER_WIDTH * 2) + BORDER_WIDTH;
        var x = 0;

        if (robo_mode=='random')
        {
            while (x < STAFF_WIDTH)
            {
                robo_directive['x1'] = x;
                robo_directive['x2'] = x + length_to_draw;
                robo_directive['y1'] = y;
                robo_directive['y2'] = y + parseInt(Math.random()* 200 - 10);
                robo_directive.strokeStyle = 'rgb('+parseInt(Math.random()*255)+','+parseInt(Math.random()*255)+','+parseInt(Math.random()*255)+')';

                if (Math.random() > 0.7)
                {
                    //$("canvas.staff").drawLine(robo_directive);
                    staff_canvas_context.beginPath();
                    staff_canvas_context.arc((robo_directive['x1'] + robo_directive['x2'])/2,
                        (robo_directive['y1'] + robo_directive['y2'])/2,
                        (robo_directive['x2'] - robo_directive['x1'])/2,
                        2*Math.PI * Math.random(),
                        2*Math.PI * Math.random(),
                        false);
                    staff_canvas_context.closePath();
                    staff_canvas_context.strokeStyle = robo_directive.strokeStyle;
                    staff_canvas_context.lineWidth = 2;
                    staff_canvas_context.stroke();
                }

                x +=  length_to_draw;
                y = parseInt(Math.random() * STAFF_HEIGHT - BORDER_WIDTH * 2) + BORDER_WIDTH;
                length_to_draw = parseInt(Math.random()* 200 + 10);

                /*
                 if (STAFF_WIDTH - (x+length_to_draw) > 100)
                 {
                 length_to_draw = parseInt(((Math.random() * STAFF_WIDTH - (x+length_to_draw) - BORDER_WIDTH * 2) + BORDER_WIDTH)/4);
                 }
                 else
                 {
                 length_to_draw = STAFF_WIDTH - (x+length_to_draw)
                 }
                 */
            }

            fadeSound($('#robo_decay').val());
        }
        else if (robo_mode == 'curve')
        {
            clearCanvas();
            var y1 = parseInt(Math.random() * STAFF_HEIGHT - BORDER_WIDTH * 2) + BORDER_WIDTH;
            var y2 = parseInt(Math.random() * STAFF_HEIGHT - BORDER_WIDTH * 2) + BORDER_WIDTH;
            staff_canvas_context.moveTo(BORDER_WIDTH, y1);

            var ctrl_x_1 = parseInt(Math.random() * STAFF_WIDTH - BORDER_WIDTH * 2) + BORDER_WIDTH;
            var ctrl_x_2 = parseInt(Math.random() * STAFF_WIDTH - BORDER_WIDTH * 2) + BORDER_WIDTH;
            var ctrl_y_1 = parseInt(Math.random() * STAFF_HEIGHT - BORDER_WIDTH * 2) + BORDER_WIDTH;
            var ctrl_y_2 = parseInt(Math.random() * STAFF_HEIGHT - BORDER_WIDTH * 2) + BORDER_WIDTH;

            staff_canvas_context.bezierCurveTo(ctrl_x_1, ctrl_y_1,
                ctrl_x_2, ctrl_y_2,
                STAFF_WIDTH - BORDER_WIDTH, y2);

            staff_canvas_context.lineWidth = PEN_STROKE_WIDTH;
            staff_canvas_context.strokeStyle = robo_directive.strokeStyle;
            staff_canvas_context.stroke();

            fadeSound($('#robo_decay').val());

            bufferSound();
            soundOn();
            animateLine();
        }
    }

}

var robo_interval = null;

function toggleRobo()
{
    if (!robo_interval)
    {
        robo_interval = setInterval(roboMode, 1000);
    }
    else
    {
        clearInterval(robo_interval);
        robo_interval = false;
    }
}