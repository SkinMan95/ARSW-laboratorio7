package edu.eci.arsw.collabpaint.model;

import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author Alejandro Anzola email: alejandro.anzola@mail.escuelaing.edu.co
 */
public class Polygon {

    private List<Point> points;

    public Polygon() {
        this(new ArrayList<>());
    }
    
    public Polygon(List<Point> points) {
        this.points = points;
    }

    public int getAmountOfPoints() {
        return points.size();
    }
    
    public List<Point> getPoints() {
        return new ArrayList<>(points);
    }
    
    public void setPoints(List<Point> points) {
        this.points = new ArrayList<>(points);
    }

}
