package com.ifba.defesaapi.dto;

import java.time.Instant;

public record RegisterResponse(Long id, String username, Instant criadoEm) {
}
