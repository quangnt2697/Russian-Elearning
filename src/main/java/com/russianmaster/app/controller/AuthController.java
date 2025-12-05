package com.russianmaster.app.controller;

import com.russianmaster.app.entity.Role;
import com.russianmaster.app.entity.User;
import com.russianmaster.app.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AuthenticationManager authenticationManager;

    // Tự động tạo Admin
    @PostConstruct
    public void initAdmin() {
        if (!userRepository.existsByUsername("adminrussian")) {
            User admin = new User();
            admin.setFullName("ADMINISTRATOR");
            admin.setUsername("adminrussian");
            admin.setPassword(passwordEncoder.encode("adminrussian"));
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
            System.out.println(">>> ADMIN CREATED: adminrussian / adminrussian");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request, HttpServletRequest httpRequest) {
        try {
            // 1. Xác thực username/password
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.get("username"), request.get("password"))
            );

            // 2. Lưu vào Security Context
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 3. QUAN TRỌNG: Tạo Session HTTP và lưu SecurityContext vào đó
            // Bước này đảm bảo JSESSIONID được tạo ra và gửi về client
            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, SecurityContextHolder.getContext());

            // 4. Trả về thông tin User
            User user = userRepository.findByUsername(request.get("username")).orElseThrow();
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login Failed: " + e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        if (userRepository.existsByUsername(request.get("username")))
            return ResponseEntity.badRequest().body("User exists");

        User u = new User();
        u.setFullName(request.get("fullName"));
        u.setUsername(request.get("username"));
        u.setPassword(passwordEncoder.encode(request.get("password")));
        u.setRole(Role.USER); // Mặc định là User thường
        userRepository.save(u);
        return ResponseEntity.ok("Registered");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return userRepository.findByUsername(auth.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}