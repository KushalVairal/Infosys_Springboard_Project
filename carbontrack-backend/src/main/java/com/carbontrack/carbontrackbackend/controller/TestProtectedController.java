
package com.carbontrack.carbontrackbackend.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class TestProtectedController {

    @GetMapping("/api/test/protected")
    public Map<String, String> protectedEndpoint(
            Authentication authentication) {

        return Map.of(
                "message", "JWT authentication successful",
                "user", authentication.getName()
        );
    }
}

