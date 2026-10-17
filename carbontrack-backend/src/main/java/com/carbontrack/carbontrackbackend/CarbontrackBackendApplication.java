package com.carbontrack.carbontrackbackend;

import com.carbontrack.carbontrackbackend.config.DotenvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CarbontrackBackendApplication {

    public static void main(String[] args) {
        DotenvLoader.load();
        SpringApplication.run(CarbontrackBackendApplication.class, args);
    }

}

