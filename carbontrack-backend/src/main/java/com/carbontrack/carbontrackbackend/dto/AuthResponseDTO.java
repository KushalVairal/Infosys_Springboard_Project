<<<<<<< HEAD

=======
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
package com.carbontrack.carbontrackbackend.dto;

public class AuthResponseDTO {

    private String message;
    private Long userId;
    private String email;
    private String token;
<<<<<<< HEAD
    private String tokenType;
=======
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170

    public AuthResponseDTO() {
    }

    public AuthResponseDTO(
            String message,
            Long userId,
            String email) {
<<<<<<< HEAD
        this(message, userId, email, null);
=======
        this.message = message;
        this.userId = userId;
        this.email = email;
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
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
<<<<<<< HEAD
        this.tokenType = token == null ? null : "Bearer";
=======
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
    }

    public String getMessage() {
        return message;
    }

<<<<<<< HEAD
=======
    public void setMessage(String message) {
        this.message = message;
    }

>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
    public Long getUserId() {
        return userId;
    }

<<<<<<< HEAD
=======
    public void setUserId(Long userId) {
        this.userId = userId;
    }

>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
    public String getEmail() {
        return email;
    }

<<<<<<< HEAD
=======
    public void setEmail(String email) {
        this.email = email;
    }

>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
    public String getToken() {
        return token;
    }

<<<<<<< HEAD
    public String getTokenType() {
        return tokenType;
=======
    public void setToken(String token) {
        this.token = token;
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
    }
}
