/**
 * Created by zzt on 14-10-10.
 */

var canvas, cxt, mouseX, mouseY, rect, activeVertex, info;

window.onload = function() {
    canvas = document.getElementById("canvas");
    cxt = canvas.getContext("2d");
    cxt.translate(0.5,0.5);
    canvas.width = canvasSize.maxX;
    canvas.height = canvasSize.maxY;
    rect = canvas.getBoundingClientRect();
    info = document.getElementById("info");
    activeVertex = -1;
    canvas.onmousedown = onMouseDown;
    canvas.onmousemove = onMouseMove;
    canvas.onmouseup = onMouseUp;
    reDraw(cxt);
};

function drawPoint(cxt, x, y, color) {
    drawLine(cxt, x, y, x+1, y+1, color);
}

function drawLine(cxt, x1, y1, x2, y2, color) {
    cxt.beginPath();
    cxt.strokeStyle = "rgb("+color[0]+","+color[1]+","+color[2]+")";
    cxt.lineWidth = 1;
    cxt.moveTo(x1,y1);
    cxt.lineTo(x2,y2);
    cxt.stroke();
}

function fillPolygen(cxt, polygon) {
    var vertexes, color, i, edges, AET, NET, maxY, minY;
    vertexes = new Array();
    edges = new Array();
    color = vertex_color[polygon[0]];
    minY = maxY = vertex_pos[polygon[0]][1];
    for(i=0;i<4;i++) {
        vertexes[i] = vertex_pos[polygon[i]];
        if(vertexes[i][1]<minY)
            minY = vertexes[i][1];
        if(vertexes[i][1]>maxY)
            maxY = vertexes[i][1];
    }
    AET = new Array(maxY-minY+1);
    NET = new Array(maxY-minY+1);
    for(i=0;i<NET.length;i++) {
        NET[i] = new Array();
        AET[i] = new Array();
    }
    for(i=0;i<4;i++) {
        if(vertexes[i%4][1]<vertexes[(i+1)%4][1])
            edges[i] = {p1:vertexes[i%4],p2:vertexes[(i+1)%4]};
        else
            edges[i] = {p1:vertexes[(i+1)%4],p2:vertexes[i%4]};

        // NET[N] = [x,dx,maxY]
        if((edges[i].p1[0]-edges[i].p2[0])/(edges[i].p1[1]-edges[i].p2[1])!="Infinity") {
            NET[edges[i].p1[1] - minY].push({x: edges[i].p1[0],
                dx: (edges[i].p1[0] - edges[i].p2[0]) / (edges[i].p1[1] - edges[i].p2[1]), maxY: edges[i].p2[1]});
        }
    }
    for(i=0;i<NET.length;i++) {
        var j, k, temp;
        for(k=0;k<NET[i].length;k++) {
            temp = NET[i][k].x;
            for(j=0;j<NET[i][k].maxY-minY-i;j++) {
                AET[i+j].push(Math.round(temp));
                temp += NET[i][k].dx;
            }
        }
    }
    for(i=0;i<AET.length;i++) {
        AET[i].sort(sortAETByX);
        var j;
        for(j=0;j<=AET[i].length/2;j+=2) {
            drawLine(cxt,AET[i][j],i+minY,AET[i][j+1],i+minY,color);
        }
    }
    for(i=0;i<4;i++) {
        drawLine(cxt, vertexes[i%4][0], vertexes[i%4][1], vertexes[(i+1)%4][0], vertexes[(i+1)%4][1], color);
    }
}

function sortAETByX(a,b) {
    return a - b;
}

function reDraw(cxt) {
    cxt.clearRect(0,0,canvas.width,canvas.height);
    var i;
    for(i=0;i<4;i++) {
        fillPolygen(cxt, polygon[i]);
    }
    //fillPolygen(cxt, polygon[0]);
    for(i=0;i<vertex_pos.length;i++) {
        cxt.beginPath();
        cxt.fillStyle = "rgb(255,0,0)";
        cxt.strokeStyle = "rgb(0,0,0)";
        cxt.arc(vertex_pos[i][0],vertex_pos[i][1],10,0,2*Math.PI);
        cxt.closePath();
        cxt.fill();
        cxt.stroke();
    }
}

function onMouseDown() {
    var i;
    for(i=0;i<vertex_pos.length;i++) {
        if(mouseX-vertex_pos[i][0]<10&&vertex_pos[i][0]-mouseX<10
            &&mouseY-vertex_pos[i][1]<10&&vertex_pos[i][1]-mouseY<10) {
            activeVertex = i;
            break;
        }
        else
            activeVertex = -1;
    }
}

function onMouseUp() {
    activeVertex = -1;
}

function onMouseMove(e) {
    mouseX = Math.round(e.pageX - rect.left*(canvas.width/rect.width));
    mouseY = Math.round(e.pageY - rect.top*(canvas.height/rect.height));
    if(activeVertex!=-1) {
        vertex_pos[activeVertex][0] = mouseX;
        vertex_pos[activeVertex][1] = mouseY;
        reDraw(cxt);
    }
    info.innerHTML = mouseX + " " + mouseY+" " + activeVertex;
}
