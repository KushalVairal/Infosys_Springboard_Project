
package com.carbontrack.carbontrackbackend.dto;

public class AuthResponseDTO {

    private String message;
    private Long userId;
    private String email;

    public AuthResponseDTO() {
    }

    public AuthResponseDTO(String message, Long userId, String email) {
        this.message = message;
        this.userId = userId;
        this.email = email;
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
}
