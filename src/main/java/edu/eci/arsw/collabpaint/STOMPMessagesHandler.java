package edu.eci.arsw.collabpaint;

import edu.eci.arsw.collabpaint.model.Polygon;
import edu.eci.arsw.collabpaint.model.Point;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.Response;
import redis.clients.jedis.Transaction;
import util.JedisUtil;

/**
 *
 * @author Alejandro Anzola email: alejandro.anzola@mail.escuelaing.edu.co
 */
@Controller
public class STOMPMessagesHandler {

    @Autowired
    SimpMessagingTemplate msgt;

    @MessageMapping("newpoint.{drawnum}")
    public void handlePointEvent(Point pt, @DestinationVariable String drawnum) throws Exception {
        System.out.println("New point received!: " + pt);

        /* REDIS TRANSACTION*/
        String xList = "x" + drawnum;
        String yList = "y" + drawnum;

        String luaScript = "local xval,yval; \n"
                + "if (redis.call('LLEN','" + xList + "')>=4) then \n"
                + "    xval=redis.call('LRANGE','" + xList + "',0,-1);\n"
                + "    yval=redis.call('LRANGE','" + yList + "',0,-1);\n"
                + "    redis.call('DEL','" + xList + "');\n"
                + "    redis.call('DEL','" + yList + "');\n"
                + "    return {xval,yval};\n"
                + "else\n"
                + "    return {};\n"
                + "end";

        Jedis jedis = JedisUtil.getPool().getResource();
        jedis.getClient().setTimeoutInfinite();

        jedis.watch(xList, yList);

        Transaction t = jedis.multi();
        t.rpush(xList, "" + pt.getX());
        t.rpush(yList, "" + pt.getY());

        Response<Object> luares = t.eval(luaScript.getBytes(), 0, "0".getBytes());

        List<Object> res = t.exec();
        /* END TRANSACTION*/

        System.out.println("Res: " + res);

        if (((ArrayList) luares.get()).size() == 2) {
            System.out.println("RESPUESTA: " + new String((byte[]) ((ArrayList) (((ArrayList) luares.get()).get(0))).get(0)));
        }

        System.out.println("SZ: " + ((ArrayList) luares.get()).size());

        if (!res.isEmpty()) { // Transaction successfull
            msgt.convertAndSend("/topic/newpoint." + drawnum, pt);
        }

        if (!res.isEmpty() && ((List) luares.get()).size() == 2) { // Checking if polygon should be added
            List<Object> xs = (List) (((List) luares.get()).get(0));
            List<Object> ys = (List) (((List) luares.get()).get(1));

            List<Point> points = new ArrayList<>();
            assert xs.size() == ys.size();
            for (int i = 0; i < xs.size(); i++) {
                points.add(new Point(Integer.parseInt(new String((byte[]) xs.get(i))),
                        Integer.parseInt(new String((byte[]) ys.get(i)))));
            }
            Polygon pol = new Polygon(points);
            msgt.convertAndSend("/topic/newpolygon." + drawnum, pol);
            System.out.println("Published new polygon with points: " + points);
        }

        jedis.close();
    }
}
