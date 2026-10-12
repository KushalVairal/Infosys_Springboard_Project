
package com.carbontrack.carbontrackbackend.dto;

public record UserProfileUpdateDTO(
        String preferredUnit,
        Boolean goalVisibility
) {}