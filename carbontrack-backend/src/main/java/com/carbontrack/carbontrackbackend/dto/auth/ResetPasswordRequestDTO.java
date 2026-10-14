
package com.carbontrack.carbontrackbackend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ResetPasswordRequestDTO {

    @NotBlank
    private String resetToken;

    @NotBlank
    @Size(min = 8, max = 72)
    private String newPassword;

    public ResetPasswordRequestDTO() {
    }

    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) {
        this.resetToken = resetToken;
    }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
