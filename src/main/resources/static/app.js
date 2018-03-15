var app = (function () {

    /* PRIVATE */
    
    class Point {
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }

    class Polygon {
	constructor(points) {
	    this.points = points;
	}
    }

    const POLYGON_FILL_COLOR = '#f00';
    
    var stompClient = null;

    var addPointToCanvas = function (point) {        
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };

    var addPolygonToCanvas = function (polygon) {        
        var canvas = document.getElementById("canvas");
	var c2 = canvas.getContext('2d');
	c2.fillStyle = POLYGON_FILL_COLOR;
	
	let points = polygon.points;

	c2.beginPath();
	c2.moveTo(points[0].x, points[0].y);

	let i = 1;
        while(i < points.length) {
	    c2.lineTo(points[i].x, points[i].y);
	    ++i;
	}

	c2.closePath();
	c2.fill();
    };
    
    
    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    const TOPIC_POINT_ADDRESS = '/topic/newpoint';
    const TOPIC_POLYGON_ADDRESS = '/topic/newpolygon';
    const PUBLISH_ADDRESS = '/app/newpoint';
    let pointConnectionAddress = null;
    let polygonConnectionAddress = null;
    let publishAddress = null;

    var connectAndSubscribe = function (sessionId) {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        
        //subscribe to TOPIC_POINT_ADDRESS when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);

	    pointConnectionAddress = TOPIC_POINT_ADDRESS + '.' + sessionId;
	    polygonConnectionAddress = TOPIC_POLYGON_ADDRESS + '.' + sessionId;
	    publishAddress = PUBLISH_ADDRESS + '.' + sessionId;

            stompClient.subscribe(pointConnectionAddress, function (eventbody) {
                // console.log('Eventbody', eventbody);
		var point = JSON.parse(eventbody.body);
		console.log('Parsed JSON point:', point);
		addPointToCanvas(point);
            });

	    stompClient.subscribe(polygonConnectionAddress, function (eventbody) {
                // console.log('Eventbody', eventbody);
		var polygon = JSON.parse(eventbody.body);
		console.log('Parsed JSON polygon:', polygon);
		addPolygonToCanvas(polygon);
            });
        });

    };

    /* PUBLIC */

    var sessionId = null;
    
    var init = function () {
        var can = document.getElementById("canvas");

	$('#sendPointBtn').prop('disabled', true);
	
	$('#connectBtn').click(function () {
	    sessionId = Number($('#sessionIdentifier').val());
	    if (isNaN(sessionId)) {
		sessionId = null;
	    } else {
		// websocket connection
		connectAndSubscribe(sessionId);
		$('#sendPointBtn').prop('disabled', false);

		$('#connectBtn').prop('disabled', true);
	    }
	});
	
	$('#sendPointBtn').click(function () {
	    var x = $('#x').val();
	    var y = $('#y').val();
	    if (sessionId != null) {
		publishPoint(x, y);
	    }
	});

	$('#canvas').click(function (event) {
	    let canvasPoint = getMousePosition(event);
	    if (sessionId != null) {
		publishPoint(canvasPoint.x, canvasPoint.y);
	    }
	});
    };

    var publishPoint = function(px, py){
	if (sessionId == null) {
	    alert('No se ha establecido el numero de sesion');
	    return;
	}
	
        var pt = new Point(px, py);
        console.info("publishing point at " + pt);
        addPointToCanvas(pt);

        // publish the event
	console.log(publishAddress);
	stompClient.send(publishAddress, {}, JSON.stringify(pt));
    };

    var disconnect = function () {
        if (stompClient !== null) {
            stompClient.disconnect();
        }
        setConnected(false);
        console.log("Disconnected");
    };

    /* =============== */
    
    return {
        init: init,
        publishPoint: publishPoint,
        disconnect: disconnect
    };

})();
