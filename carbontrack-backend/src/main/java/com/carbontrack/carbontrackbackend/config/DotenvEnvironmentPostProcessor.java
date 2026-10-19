package com.carbontrack.carbontrackbackend.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

import java.util.Map;

/**
 * Automatically executed by Spring Boot during Environment preparation (before beans and
 * properties are resolved). Ensures that variables in .env are available across all startup modes,
 * including SpringApplication.run, Maven spring-boot:run, and @SpringBootTest.
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> envProperties = DotenvLoader.load();
        if (!envProperties.isEmpty()) {
            MapPropertySource propertySource = new MapPropertySource("dotenvProperties", envProperties);
            if (environment.getPropertySources().contains(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME)) {
                environment.getPropertySources().addBefore(
                        StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
                        propertySource
                );
            } else {
                environment.getPropertySources().addFirst(propertySource);
            }
        }
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
