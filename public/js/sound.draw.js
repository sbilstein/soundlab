/**
 * Toggles between pen and eraser
 * @param el The button calling for the switch
 */
function switchToolStyle(el)
{
    if (tool_style == PEN)
    {
        tool_style = ERASER;
        el.textContent = "pen";
        pen_directive.strokeStyle = COLOR_NONE;
        pen_directive.strokeWidth = PEN_STROKE_WIDTH.toString();
    }
    else
    {
        tool_style = PEN;
        el.textContent = "eraser";

        pen_directive.strokeWidth = ERASER_STROKE_WIDTH.toString();
    }
}

/**
 * Renders the scrub line
 * @param time The time elapsed since last draw.

 */
function drawScrubLine(time)
{
    // Erase the line
    //scrub_line_directive["strokeStyle"] = COLOR_WHITE;
    //$("canvas.bar").drawLine(scrub_line_directive);
    $("canvas.bar").clearCanvas(
        {
            x: STAFF_WIDTH / 2,
            y: STAFF_HEIGHT / 2,
            width: STAFF_WIDTH - 2 * BORDER_WIDTH,
            height: STAFF_HEIGHT - 2 * BORDER_WIDTH
        });

    // Move over and draw the line in new position
    var tick_x = Math.round(time * STAFF_WIDTH);

    scrub_line_directive["strokeStyle"] = COLOR_BLACK;
    scrub_line_directive["x1"] = tick_x;
    scrub_line_directive["x2"] = tick_x;
    scrub_line_directive["y1"] = BORDER_WIDTH + 1;
    scrub_line_directive["y2"] = STAFF_HEIGHT - BORDER_WIDTH;

    $("canvas.bar").drawLine(scrub_line_directive);
}

/**
 * Gets called every time the browser is ready to draw another frame.
 * Timing is not 'predictable'
 */
function step()
{
    // ms
    if (!is_drawing)
    {
        return;
    }
    // need to figure out how to line this up with the canvas drawings
    var time = audio_context.currentTime;

    // time elapsed since last started
    time_elapsed = time - start_time;

    // figure out positon modulo length of note, ie 1 sec
    // progress is the absolute position in a second.
    // so if we paused at .3 seconds, .2 seconds have elapsed
    // we want to draw something at .5 seconds.
    var progress = (time_elapsed + scrub_line_position) % 1.0;
    // using where in a second we are, we can calc exactly where we need to
    // draw.

    // var rate = progress
    // * (STAFFWIDTH / 1000);

    // var fps = (1 / progress) * 1000;
    // var fps_text = document.getElementById("fps");
    // fps_text.innerHTML = parseInt(fps).toString() + "fps";

    drawScrubLine(progress);
    current_audio_time = time;
    is_drawing = true;
    window.webkitRequestAnimationFrame(step);
}

/**
 * Initializes drawing of the scrub line. Gets the ball rolling.
 */
function animateLine()
{
    if (is_drawing)
    {
        is_drawing = false;
        // el.textContent = 'animate';
        return;
    }

    current_audio_time = audio_context.currentTime;
    // set up starting position
    is_drawing = true;
    // el.textContent = 'pause';
    window.webkitRequestAnimationFrame(step);
}

/**
 * Draw a black border around the canvas.
 */
function drawBorder()
{
    border_directive["x1"] = BORDER_WIDTH;
    border_directive["y1"] = BORDER_WIDTH;
    border_directive["x2"] = STAFF_WIDTH - BORDER_WIDTH;
    border_directive["y2"] = BORDER_WIDTH;
    $("canvas.bar").drawLine(border_directive);

    border_directive["x1"] = border_directive["x2"];
    border_directive["y1"] = border_directive["y2"];
    border_directive["x2"] = STAFF_WIDTH - BORDER_WIDTH;
    border_directive["y2"] = STAFF_HEIGHT - BORDER_WIDTH;
    $("canvas.bar").drawLine(border_directive);

    border_directive["x1"] = border_directive["x2"];
    border_directive["y1"] = border_directive["y2"];
    border_directive["x2"] = BORDER_WIDTH;
    border_directive["y2"] = STAFF_HEIGHT -BORDER_WIDTH;
    $("canvas.bar").drawLine(border_directive);

    border_directive["x1"] = border_directive["x2"];
    border_directive["y1"] = border_directive["y2"];
    border_directive["x2"] = BORDER_WIDTH;
    border_directive["y2"] = BORDER_WIDTH;
    $("canvas.bar").drawLine(border_directive);
}


/**
 * ===========================
 * PEN FUNCTIONS
 * ===========================
 */

/**
 * Sets drawing directive and binds mouse to listen for events to draw stuff.
 * @param e Mouse event
 */
function startPen(e)
{
    window.getSelection().removeAllRanges()

    pen_directive["x1"] = e.pageX - CANVAS_WIDTH_OFFSET;
    pen_directive["y1"] = e.pageY - CANVAS_HEIGHT_OFFSET;

    $("canvas.bar").mousemove(movePen);
    $("canvas.bar").mouseup(endPen);
    $("canvas.bar").mouseleave(endPen);

    do_update = true;
}

/**
 * Strokes during mouse movement.
 * @param e Mouse event
 */
function movePen(e)
{
    window.getSelection().removeAllRanges()

    pen_directive["x2"] = e.pageX - CANVAS_WIDTH_OFFSET;
    pen_directive["y2"] = e.pageY - CANVAS_HEIGHT_OFFSET;

    if (tool_style == PEN)
    {
        $("canvas.staff").drawLine(pen_directive);
    }
    else if (tool_style == ERASER)
    {
        $("canvas.staff").clearCanvas(
            {
                x: Math.min(pen_directive["x1"], pen_directive["x2"]),
                y: Math.min(pen_directive["y1"], pen_directive["y2"]),
                width: ERASER_STROKE_WIDTH,
                height: ERASER_STROKE_WIDTH
            });
    }


    pen_directive["x1"] = e.pageX - CANVAS_WIDTH_OFFSET;
    pen_directive["y1"] = e.pageY - CANVAS_HEIGHT_OFFSET;

    do_update = true;
}

/**
 * Strokes the last bit of movement the mouse did,
 * then unbinds the mouse from the events.
 * @param e Mouse event
 */
function endPen(e)
{
    pen_directive["x2"] = e.pageX - CANVAS_WIDTH_OFFSET;
    pen_directive["y2"] = e.pageY - CANVAS_HEIGHT_OFFSET;
    $("canvas.staff").drawLine(pen_directive);

    //unbind drawing related events.
    $("canvas.bar").unbind('mousemove', movePen);
    $("canvas.bar").unbind('mouseup', endPen);
    $("canvas.bar").unbind('mouseleave', endPen);

    do_update = true;
}

function setPenColor(color_style)
{
    pen_directive.strokeStyle = color_style;
}

function changePenStrokeWidth(width)
{
    PEN_STROKE_WIDTH = width;
    pen_directive.strokeWidth = PEN_STROKE_WIDTH.toString();
}
