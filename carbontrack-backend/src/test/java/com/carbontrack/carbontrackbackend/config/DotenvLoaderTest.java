package com.carbontrack.carbontrackbackend.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class DotenvLoaderTest {

    @Test
    void testDotenvLoaderReturnsMap() {
        Map<String, Object> props = DotenvLoader.load();
        assertNotNull(props);
    }

    @Test
    void testParseEnvFile(@TempDir Path tempDir) throws IOException {
        Path envFile = tempDir.resolve(".env");
        String content = """
                # Comment line
                
                DB_URL=jdbc:mysql://localhost:3306/testdb
                DB_USERNAME='test_user'
                DB_PASSWORD="test_secret_password"
                JWT_SECRET=super_long_secret_key_1234567890
                MAIL_USERNAME=test@gmail.com
                MAIL_PASSWORD=app_password_123
                EMPTY_VAL=
                """;
        Files.writeString(envFile, content);

        Map<String, Object> map = DotenvLoader.parseEnvFile(envFile, false);
        assertEquals("jdbc:mysql://localhost:3306/testdb", map.get("DB_URL"));
        assertEquals("test_user", map.get("DB_USERNAME"));
        assertEquals("test_secret_password", map.get("DB_PASSWORD"));
        assertEquals("super_long_secret_key_1234567890", map.get("JWT_SECRET"));
        assertEquals("test@gmail.com", map.get("MAIL_USERNAME"));
        assertEquals("app_password_123", map.get("MAIL_PASSWORD"));
        assertEquals("", map.get("EMPTY_VAL"));
        assertNull(map.get("# Comment line"));
    }
}
