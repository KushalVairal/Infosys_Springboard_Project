package com.carbontrack.carbontrackbackend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Loads environment variables from a local .env file into Java System properties
 * and provides them as a key-value map for Spring Boot environment injection.
 *
 * Automatically inspects the following locations in order of preference:
 * 1. Current working directory: .env (when running inside carbontrack-backend)
 * 2. Nested directory: carbontrack-backend/.env (when running from project root)
 * 3. Parent directory: ../.env
 * 4. Fallback legacy name: backend.env / ../backend.env
 */
public final class DotenvLoader {

    private static final Logger logger = LoggerFactory.getLogger(DotenvLoader.class);
    private static volatile boolean loaded = false;
    private static final Map<String, Object> loadedProperties = new LinkedHashMap<>();

    private DotenvLoader() {}

    public static synchronized Map<String, Object> load() {
        if (loaded) {
            return Collections.unmodifiableMap(loadedProperties);
        }

        Path envPath = findEnvFile();
        if (envPath == null) {
            logger.info("No local .env file found. Falling back to system environment variables.");
            loaded = true;
            return Collections.emptyMap();
        }

        logger.info("Loading environment variables from: {}", envPath.toAbsolutePath().normalize());
        Map<String, Object> parsed = parseEnvFile(envPath, true);
        loadedProperties.putAll(parsed);
        loaded = true;
        return Collections.unmodifiableMap(loadedProperties);
    }

    public static Map<String, Object> parseEnvFile(Path envPath, boolean setSystemProperties) {
        if (envPath == null || !Files.isRegularFile(envPath)) {
            return Collections.emptyMap();
        }

        Map<String, Object> properties = new LinkedHashMap<>();
        try (BufferedReader reader = Files.newBufferedReader(envPath, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();

                // Skip empty lines and comments
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                int equalIndex = line.indexOf('=');
                if (equalIndex <= 0) {
                    continue;
                }

                String key = line.substring(0, equalIndex).trim();
                String rawValue = line.substring(equalIndex + 1).trim();
                String value = unquote(rawValue);

                // Set as System property if requested and not already set
                if (setSystemProperties && System.getProperty(key) == null && System.getenv(key) == null) {
                    System.setProperty(key, value);
                }

                properties.put(key, value);
            }
        } catch (IOException ex) {
            logger.warn("Failed to read .env file at {}: {}", envPath, ex.getMessage());
        }

        return properties;
    }


    private static Path findEnvFile() {
        Path[] candidates = new Path[] {
                Path.of(".env"),
                Path.of("carbontrack-backend", ".env"),
                Path.of("..", ".env"),
                Path.of("backend.env"),
                Path.of("..", "backend.env")
        };

        for (Path candidate : candidates) {
            try {
                if (Files.isRegularFile(candidate) && Files.isReadable(candidate)) {
                    return candidate;
                }
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private static String unquote(String val) {
        if (val.length() >= 2) {
            if ((val.startsWith("\"") && val.endsWith("\"")) ||
                (val.startsWith("'") && val.endsWith("'"))) {
                return val.substring(1, val.length() - 1);
            }
        }
        return val;
    }
}
