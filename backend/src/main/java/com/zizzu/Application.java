package com.zizzu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** Entry point for the Zizzu store backend. */
@SpringBootApplication
public class Application {

    /** Starts the Spring Boot application. */
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
