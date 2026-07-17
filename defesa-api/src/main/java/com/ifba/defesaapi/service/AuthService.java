package com.ifba.defesaapi.service;

import com.ifba.defesaapi.model.StatusTentativa;
import com.ifba.defesaapi.model.TentativaLogin;
import com.ifba.defesaapi.model.Usuario;
import com.ifba.defesaapi.repository.TentativaLoginRepository;
import com.ifba.defesaapi.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Optional;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final TentativaLoginRepository tentativaLoginRepository;
    private final RateLimiterService rateLimiterService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UsuarioRepository usuarioRepository,
                        TentativaLoginRepository tentativaLoginRepository,
                        RateLimiterService rateLimiterService,
                        PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.tentativaLoginRepository = tentativaLoginRepository;
        this.rateLimiterService = rateLimiterService;
        this.passwordEncoder = passwordEncoder;
    }

    public Usuario register(String username, String rawPassword) {
        if (usuarioRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Usuario ja existe: " + username);
        }
        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setSenhaHash(passwordEncoder.encode(rawPassword));
        usuario.setCriadoEm(Instant.now());
        return usuarioRepository.save(usuario);
    }

    public StatusTentativa login(String username, String rawPassword, String ip) {
        if (rateLimiterService.isBlocked(ip, username)) {
            registrarTentativa(username, ip, StatusTentativa.BLOQUEADO);
            return StatusTentativa.BLOQUEADO;
        }

        Optional<Usuario> usuario = usuarioRepository.findByUsername(username);
        boolean credenciaisValidas = usuario.isPresent()
                && passwordEncoder.matches(rawPassword, usuario.get().getSenhaHash());

        if (credenciaisValidas) {
            rateLimiterService.registrarSucesso(ip, username);
            registrarTentativa(username, ip, StatusTentativa.SUCESSO);
            return StatusTentativa.SUCESSO;
        }

        rateLimiterService.registrarFalha(ip, username);
        registrarTentativa(username, ip, StatusTentativa.FALHA);
        return StatusTentativa.FALHA;
    }

    private void registrarTentativa(String username, String ip, StatusTentativa status) {
        TentativaLogin tentativa = new TentativaLogin();
        tentativa.setUsername(username);
        tentativa.setIp(ip);
        tentativa.setStatus(status);
        tentativa.setTimestamp(Instant.now());
        tentativaLoginRepository.save(tentativa);
    }
}
