var app = (function () {

    /* PRIVATE */
    
    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }
    
    var stompClient = null;

    var addPointToCanvas = function (point) {        
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };
    
    
    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    const TOPIC_ADDRESS = '/topic/newpoint';
    const PUBLISH_ADDRESS = '/app/newpoint';
    let connectionAddress = null;
    let publishAddress = null;

    var connectAndSubscribe = function (sessionId) {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        
        //subscribe to TOPIC_ADDRESS when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);

	    connectionAddress = TOPIC_ADDRESS + '.' + sessionId;
	    publishAddress = PUBLISH_ADDRESS + '.' + sessionId;

            stompClient.subscribe(connectionAddress, function (eventbody) {
                // console.log('Eventbody', eventbody);
		var point = JSON.parse(eventbody.body);
		console.log('Parsed JSON point:', point);
		addPointToCanvas(point);
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
