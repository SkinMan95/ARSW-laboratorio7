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

    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        
        //subscribe to TOPIC_ADDRESS when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe(TOPIC_ADDRESS, function (eventbody) {
                // console.log('Eventbody', eventbody);
		var point = JSON.parse(eventbody.body);
		console.log('Parsed JSON point:', point);
		addPointToCanvas(point);
            });
        });

    };

    /* PUBLIC */

    var init = function () {
        var can = document.getElementById("canvas");
        
        // websocket connection
        connectAndSubscribe();
    };

    var publishPoint = function(px, py){
        var pt=new Point(px,py);
        console.info("publishing point at "+pt);
        addPointToCanvas(pt);

        // publish the event
	stompClient.send(TOPIC_ADDRESS, {}, JSON.stringify(pt));
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
