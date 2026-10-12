
package com.carbontrack.carbontrackbackend.exception;

import com.carbontrack.carbontrackbackend.dto.ErrorResponseDTO;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private ErrorResponseDTO createError(
            HttpStatus status,
            String message,
            String path,
            Map<String, String> validationErrors) {

        return new ErrorResponseDTO(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                path,
                validationErrors
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        Map<String, String> errors = new LinkedHashMap<>();

        for (FieldError fieldError :
                ex.getBindingResult().getFieldErrors()) {

            errors.putIfAbsent(
                    fieldError.getField(),
                    fieldError.getDefaultMessage()
            );
        }

        ErrorResponseDTO body = createError(
                HttpStatus.BAD_REQUEST,
                "Validation failed",
                request.getRequestURI(),
                errors
        );

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponseDTO> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request) {

        ErrorResponseDTO body = createError(
                HttpStatus.BAD_REQUEST,
                "Request validation failed",
                request.getRequestURI(),
                Map.of()
        );

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponseDTO> handleInvalidBody(
            HttpMessageNotReadableException ex,
            HttpServletRequest request) {

        ErrorResponseDTO body = createError(
                HttpStatus.BAD_REQUEST,
                "Invalid request body or data format",
                request.getRequestURI(),
                Map.of()
        );

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponseDTO> handleResponseStatus(
            ResponseStatusException ex,
            HttpServletRequest request) {

        HttpStatus status = HttpStatus.valueOf(
                ex.getStatusCode().value()
        );

        String message = ex.getReason() != null
                ? ex.getReason()
                : status.getReasonPhrase();

        ErrorResponseDTO body = createError(
                status,
                message,
                request.getRequestURI(),
                Map.of()
        );

        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponseDTO> handleDatabaseConflict(
            DataIntegrityViolationException ex,
            HttpServletRequest request) {

        ErrorResponseDTO body = createError(
                HttpStatus.CONFLICT,
                "The request conflicts with existing data or a database constraint",
                request.getRequestURI(),
                Map.of()
        );

        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponseDTO> handleAccessDenied(
            AccessDeniedException ex,
            HttpServletRequest request) {

        ErrorResponseDTO body = createError(
                HttpStatus.FORBIDDEN,
                "You do not have permission to perform this action",
                request.getRequestURI(),
                Map.of()
        );

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> handleUnexpected(
            Exception ex,
            HttpServletRequest request) {

        // Log the full exception on the server, not in the API response.
        // Add your application's logger here when configured.

        ErrorResponseDTO body = createError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred",
                request.getRequestURI(),
                Map.of()
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(body);
    }
}
