package com.carbontrack.carbontrackbackend.exception;

public class InvalidActivityException extends RuntimeException {
    public InvalidActivityException(String message) {
        super(message);
    }
}