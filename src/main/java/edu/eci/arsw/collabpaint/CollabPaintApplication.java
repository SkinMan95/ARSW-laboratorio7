package edu.eci.arsw.collabpaint;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.web.bind.annotation.CrossOrigin;

@SpringBootApplication
@CrossOrigin(origins = "*")
@ComponentScan(basePackages = {"edu.eci.arsw.collabpaint"})
public class CollabPaintApplication {

    public static void main(String[] args) {
        SpringApplication.run(CollabPaintApplication.class, args);
    }
}
