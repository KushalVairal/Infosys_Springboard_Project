package com.carbontrack.carbontrackbackend.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.Map;

/**
 * Automatically executed by Spring Boot during Environment preparation (before beans and
 * properties are resolved). Ensures that variables in .env are available across all startup modes,
 * including SpringApplication.run, Maven spring-boot:run, and @SpringBootTest.
 */
@SuppressWarnings("removal")
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> envProperties = DotenvLoader.load();
        if (!envProperties.isEmpty()) {
            environment.getPropertySources().addLast(
                    new MapPropertySource("dotenvProperties", envProperties)
            );
        }
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
