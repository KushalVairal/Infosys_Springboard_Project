
package com.carbontrack.carbontrackbackend.dto.auth;

public class AuthResponseDTO {

    private String message;
    private Long userId;
    private String email;
    private String token;
    private String tokenType;

    public AuthResponseDTO() {
    }

    public AuthResponseDTO(
            String message,
            Long userId,
            String email) {
        this(message, userId, email, null);
    }

    public AuthResponseDTO(
            String message,
            Long userId,
            String email,
            String token) {
        this.message = message;
        this.userId = userId;
        this.email = email;
        this.token = token;
        this.tokenType = token == null ? null : "Bearer";
    }

    public String getMessage() {
        return message;
    }

    public Long getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getToken() {
        return token;
    }

    public String getTokenType() {
        return tokenType;
    }
}
