/**
 * Created by 35517_000 on 2014/11/27.
 */
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'varying vec4 v_Color;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'void main() {\n' +
    '   gl_Position = u_ModelMatrix * a_Position;\n' +
    '   v_Color = a_Color;\n' +
    '}\n';

var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'varying vec4 v_Color;\n' +
    'uniform vec4 u_FragColor;\n' +
    'uniform bool u_DrawFrame;\n' +
    'void main() {\n' +
    '   if(u_DrawFrame)\n' +
    '       gl_FragColor = u_FragColor;\n' +
    '   else\n' +
    '       gl_FragColor = v_Color;\n'+
    '}\n';

var ANGEL_STEP=45.0, ZOOM_STEP=0.2;

var g_last;

function main() {
    var canvas = document.getElementById("webgl");
    var isMouseDown = false, vertexIndex, showFrame = false, playMod = false, editMod = true;
    canvas.width = canvasSize.maxX;
    canvas.height = canvasSize.maxY;
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    //初始化Shader
    if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }
    var u_FragColor = gl.getUniformLocation(gl.program,'u_FragColor');
    gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0,1.0);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    var modelMatrix = new Matrix4();
    modelMatrix.setIdentity();
    var currentAngle = 0.0;
    var currentZoom = 1.0;
    var mag = false;
    var play = function () {
        if(playMod) {
            var currentInfo = animate(currentAngle, currentZoom, mag);
            currentAngle = currentInfo.currentAngle;
            currentZoom = currentInfo.currentZoom;
            mag = currentInfo.mag;
            modelMatrix.setRotate(currentAngle, 0, 0, 1);
            modelMatrix.scale(currentZoom, currentZoom, currentZoom);
            drawPolygons(gl, canvas, polygon, showFrame, modelMatrix);
            requestAnimationFrame(play);
        }
        else
            return;
    };
    //画出原始图形
    drawPolygons(gl, canvas, polygon, showFrame, modelMatrix);
    //添加与拖动相关的时间处理函数
    canvas.onmousedown = function(e) {
        var x = e.clientX;
        var y = e.clientY;
        var rect = e.target.getBoundingClientRect();
        x = x - rect.left;
        y = y - rect.top;
        isMouseDown = true;
        vertexIndex = getVertexByMouse(x, y);
    };
    canvas.onmouseup = function() {
        isMouseDown = false;
    };
    canvas.onmousemove = function (e) {
        if(isMouseDown&&(vertexIndex>=0)&&editMod) {
            var x = e.clientX;
            var y = e.clientY;
            var rect = e.target.getBoundingClientRect();
            x = x - rect.left;
            y = y - rect.top;
            vertex_pos[vertexIndex][0] = x;
            vertex_pos[vertexIndex][1] = y;
            drawPolygons(gl, canvas, polygon, showFrame,modelMatrix);
        }
    };
    document.body.onkeypress = function (e) {
        var keynum, keychar;
        if(window.event)
            keynum = e.keyCode;
        else if(e.which)
            keynum = e.which;
        keychar = String.fromCharCode(keynum);
        switch (keychar) {
            case 'b':
            case 'B':
                showFrame = !showFrame;
                drawPolygons(gl,canvas,polygon,showFrame,modelMatrix);
                break;
            case 't':
            case 'T':
                playMod = !playMod;
                editMod = false;
                if(playMod) {
                    g_last = Date.now();
                    play();
                }
                break;
            case 'e':
            case 'E':
                playMod = false;
                editMod = true;
                modelMatrix.setIdentity();
                drawPolygons(gl,canvas,polygon,showFrame,modelMatrix);
                break;
        }
    }
}

function drawPolygons(gl, canvas, polygons, showFrame, matrix4) {
    //每次画完整图形前清空画布
    gl.clear(gl.COLOR_BUFFER_BIT);
    //分别画出各个四边形
    var i;
    for(i=0;i<polygons.length;i++) {
        drawPolygon(gl, canvas, polygons[i], matrix4);
    }
    if(showFrame) {
    for(i=0;i<polygons.length;i++) {
        drawFrame(gl, canvas, polygons[i], matrix4);
    }}
}

function drawPolygon(gl, canvas, polygon, matrix4) {
    var vertices_info = new Float32Array(20);
    //将四边形顶点的位置及颜色信息按v0, v1, v2, v3的顺序存入vertices_info数组
    var i;
    for(i=0;i<4;i++) {
        var x = vertex_pos[polygon[i]][0];
        var y = vertex_pos[polygon[i]][1];
        var r = vertex_color[polygon[i]][0]/255.0;
        var g = vertex_color[polygon[i]][1]/255.0;
        var b = vertex_color[polygon[i]][2]/255.0;
        x = (x-canvas.width/2)/(canvas.width/2);
        y = (canvas.height/2-y)/(canvas.height/2);
        vertices_info[5*i] = x;
        vertices_info[5*i+1] = y;
        vertices_info[5*i+2] = r;
        vertices_info[5*i+3] = g;
        vertices_info[5*i+4] = b;
    }
    var vertexBuffer = gl.createBuffer();
    if(!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices_info, gl.STATIC_DRAW);

    var u_ModelMatrix = gl.getUniformLocation(gl.program,'u_ModelMatrix');
    gl.uniformMatrix4fv(u_ModelMatrix, false, matrix4.elements);

    var FSIZE = vertices_info.BYTES_PER_ELEMENT;

    var u_DrawFrame = gl.getUniformLocation(gl.program,'u_DrawFrame');
    gl.uniform1i(u_DrawFrame,false);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*5, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_Color = gl.getAttribLocation(gl.program,'a_Color');
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*5, FSIZE*2);
    gl.enableVertexAttribArray(a_Color);

    //因为顶点顺序为v0, v1, v2, v3，使用gl.TRIANGLE_FAN可将v0v2作为对角线将四边形分为两个三角形，绘制填充区域
    gl.drawArrays(gl.TRIANGLE_FAN,0,4);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function drawFrame(gl, canvas, polygon, matrix4) {
    var vertices_pos = new Float32Array(8);
    var i;
    for(i=0;i<4;i++) {
        var x = vertex_pos[polygon[i]][0];
        var y = vertex_pos[polygon[i]][1];
        x = (x-canvas.width/2)/(canvas.width/2);
        y = (canvas.height/2-y)/(canvas.height/2);
        vertices_pos[2*i] = x;
        vertices_pos[2*i+1] = y;
    }
    var vertexBuffer = gl.createBuffer();
    if(!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices_pos, gl.STATIC_DRAW);

    var FSIZE = vertices_pos.BYTES_PER_ELEMENT;

    var u_ModelMatrix = gl.getUniformLocation(gl.program,'u_ModelMatrix');
    gl.uniformMatrix4fv(u_ModelMatrix, false, matrix4.elements);

    var u_DrawFrame = gl.getUniformLocation(gl.program,'u_DrawFrame');
    gl.uniform1i(u_DrawFrame,true);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*4, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(gl.LINES,0,2);

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(gl.LINE_LOOP,0,4);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

}

//判断鼠标按下时是否在顶点附近，若在附近，则返回顶点下标，否则返回-1
function getVertexByMouse(x, y) {
    var i;
    for(i=0;i<vertex_pos.length;i++) {
        if(Math.abs(x-vertex_pos[i][0])<10&&Math.abs(y-vertex_pos[i][1])<10)
            return i;
    }
    return -1;
}
function animate(angle, zoom, mag) {
    var now = Date.now();
    var elasped = now-g_last;
    g_last = now;
    var newAngle = angle + (ANGEL_STEP * elasped) / 1000.0;
    newAngle %= 360;
    var newZoom, newMag=mag;
    if(mag)
        newZoom = zoom + (ZOOM_STEP * elasped) / 1000.0;
    else
        newZoom = zoom - (ZOOM_STEP * elasped) / 1000.0;
    if(newZoom>=1.0)
        newMag = false;
    else if(newZoom<=0.2)
        newMag = true;
    return {currentAngle:newAngle, currentZoom:newZoom, mag:newMag};
}
