package edu.eci.arsw.collabpaint.PersistenceMessageHandler;

import edu.eci.arsw.collabpaint.model.Point;

/**
 *
 * @author Alejandro Anzola email: alejandro.anzola@mail.escuelaing.edu.co
 */
public interface PersistanceMessageHandler {
    public void handleRequest(Point pt, String drawnum);
}
