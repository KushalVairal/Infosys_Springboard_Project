package com.carbontrack.carbontrackbackend.dto;

public class AuthResponseDTO {

    private String message;
    private Long userId;
    private String email;
    private String token;

    public AuthResponseDTO() {
    }

    public AuthResponseDTO(
            String message,
            Long userId,
            String email) {
        this.message = message;
        this.userId = userId;
        this.email = email;
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
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
