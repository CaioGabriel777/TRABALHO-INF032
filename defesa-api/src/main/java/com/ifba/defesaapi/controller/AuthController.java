package com.ifba.defesaapi.controller;

import com.ifba.defesaapi.dto.ApiResponse;
import com.ifba.defesaapi.dto.LoginRequest;
import com.ifba.defesaapi.dto.RegisterRequest;
import com.ifba.defesaapi.dto.RegisterResponse;
import com.ifba.defesaapi.model.StatusTentativa;
import com.ifba.defesaapi.model.Usuario;
import com.ifba.defesaapi.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        Usuario usuario = authService.register(request.username(), request.password());
        RegisterResponse body = new RegisterResponse(usuario.getId(), usuario.getUsername(), usuario.getCriadoEm());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String ip = httpRequest.getRemoteAddr();
        StatusTentativa status = authService.login(request.username(), request.password(), ip);

        return switch (status) {
            case SUCESSO -> ResponseEntity.ok(new ApiResponse(true, "Login efetuado com sucesso"));
            case FALHA -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse(false, "Usuario ou senha invalidos"));
            case BLOQUEADO -> ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new ApiResponse(false, "Bloqueado por excesso de tentativas. Tente novamente mais tarde."));
        };
    }
}
