package com.ifba.defesaapi.controller;

import com.ifba.defesaapi.dto.DefenseStatusResponse;
import com.ifba.defesaapi.dto.DefenseToggleRequest;
import com.ifba.defesaapi.service.RateLimiterService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints administrativos usados pelo ataque-cli para alternar entre os
 * modos "sem defesa" e "com defesa ativa" e para zerar o estado do rate
 * limiter entre execucoes, sem precisar reiniciar o container da API.
 */
@RestController
@RequestMapping("/admin/defense")
public class AdminController {

    private final RateLimiterService rateLimiterService;

    public AdminController(RateLimiterService rateLimiterService) {
        this.rateLimiterService = rateLimiterService;
    }

    @GetMapping
    public DefenseStatusResponse status() {
        return toStatus();
    }

    @PostMapping
    public DefenseStatusResponse toggle(@RequestBody DefenseToggleRequest request) {
        rateLimiterService.setEnabled(request.enabled());
        return toStatus();
    }

    @PostMapping("/reset")
    public ResponseEntity<Void> reset() {
        rateLimiterService.reset();
        return ResponseEntity.noContent().build();
    }

    private DefenseStatusResponse toStatus() {
        return new DefenseStatusResponse(
                rateLimiterService.isEnabled(),
                rateLimiterService.getMaxAttempts(),
                rateLimiterService.getWindowSeconds());
    }
}
