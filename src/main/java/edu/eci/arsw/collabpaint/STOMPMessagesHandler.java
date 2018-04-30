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

    private Map<String, Queue<Point>> pointQueuesMap = new ConcurrentHashMap<>();

    @MessageMapping("newpoint.{drawnum}")
    public void handlePointEvent(Point pt, @DestinationVariable String drawnum) throws Exception {
        System.out.println("New point received!: " + pt);
        pointQueuesMap.putIfAbsent(drawnum, new ConcurrentLinkedQueue<>());

        
        /* REDIS TRANSACTION*/
        String xList = "x" + drawnum;
        String yList = "y" + drawnum;

        Jedis jedis = JedisUtil.getPool().getResource();

        jedis.watch(xList, yList);

        Transaction t = jedis.multi();
        t.set(xList, "" + pt.getX());
        t.set(yList, "" + pt.getY());

        List<Object> res = t.exec();
        /* END TRANSACTION*/

        System.out.println("Res: " + res);

        if (!res.isEmpty()) { // Successful transaction
            msgt.convertAndSend("/topic/newpoint." + drawnum, pt);

            Queue<Point> queue = pointQueuesMap.get(drawnum);
            queue.add(pt);

            if (queue.size() >= 4) {
                List<Point> points = new ArrayList<>();
                synchronized (queue) {
                    while (!queue.isEmpty()) {
                        points.add(queue.remove());
                    }
                }

                Polygon pol = new Polygon(points);
                msgt.convertAndSend("/topic/newpolygon." + drawnum, pol);
                System.out.println("Published new polygon with points: " + points);
            }

        }

        jedis.close();
    }
}
