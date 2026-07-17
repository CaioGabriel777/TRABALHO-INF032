package com.ifba.defesaapi.dto;

public record DefenseStatusResponse(boolean enabled, int maxAttempts, long windowSeconds) {
}
