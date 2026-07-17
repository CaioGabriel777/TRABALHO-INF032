package com.ifba.defesaapi.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * Rate limiter em memoria por IP e por usuario, com janela deslizante.
 * O flag "enabled" pode ser ligado/desligado em runtime pelo AdminController,
 * permitindo ao ataque-cli comparar cenarios "com defesa" e "sem defesa"
 * sem precisar reiniciar o container.
 */
@Service
public class RateLimiterService {

    private final int maxAttempts;
    private final long windowSeconds;
    private volatile boolean enabled;

    private final Map<String, Deque<Instant>> falhasPorIp = new ConcurrentHashMap<>();
    private final Map<String, Deque<Instant>> falhasPorUsuario = new ConcurrentHashMap<>();

    public RateLimiterService(
            @Value("${defesa.rate-limit.enabled:true}") boolean enabled,
            @Value("${defesa.rate-limit.max-attempts:5}") int maxAttempts,
            @Value("${defesa.rate-limit.window-seconds:60}") long windowSeconds) {
        this.enabled = enabled;
        this.maxAttempts = maxAttempts;
        this.windowSeconds = windowSeconds;
    }

    public boolean isBlocked(String ip, String username) {
        if (!enabled) {
            return false;
        }
        return countFalhasRecentes(falhasPorIp, ip) >= maxAttempts
                || countFalhasRecentes(falhasPorUsuario, username) >= maxAttempts;
    }

    public void registrarFalha(String ip, String username) {
        if (!enabled) {
            return;
        }
        registrar(falhasPorIp, ip);
        registrar(falhasPorUsuario, username);
    }

    public void registrarSucesso(String ip, String username) {
        falhasPorIp.remove(ip);
        falhasPorUsuario.remove(username);
    }

    public void reset() {
        falhasPorIp.clear();
        falhasPorUsuario.clear();
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public long getWindowSeconds() {
        return windowSeconds;
    }

    private void registrar(Map<String, Deque<Instant>> mapa, String chave) {
        if (chave == null) {
            return;
        }
        Deque<Instant> falhas = mapa.computeIfAbsent(chave, k -> new ConcurrentLinkedDeque<>());
        falhas.addLast(Instant.now());
        purgarAntigas(falhas);
    }

    private long countFalhasRecentes(Map<String, Deque<Instant>> mapa, String chave) {
        if (chave == null) {
            return 0;
        }
        Deque<Instant> falhas = mapa.get(chave);
        if (falhas == null) {
            return 0;
        }
        purgarAntigas(falhas);
        return falhas.size();
    }

    private void purgarAntigas(Deque<Instant> falhas) {
        Instant limite = Instant.now().minusSeconds(windowSeconds);
        while (true) {
            Instant maisAntiga = falhas.peekFirst();
            if (maisAntiga == null || maisAntiga.isAfter(limite)) {
                break;
            }
            falhas.pollFirst();
        }
    }
}
