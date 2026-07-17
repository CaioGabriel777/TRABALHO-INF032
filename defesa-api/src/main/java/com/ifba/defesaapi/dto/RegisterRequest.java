package com.ifba.defesaapi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String username,
        @NotBlank @Size(min = 4, message = "senha deve ter ao menos 4 caracteres") String password) {
}
