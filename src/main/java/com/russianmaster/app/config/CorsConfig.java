package com.russianmaster.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // QUAN TRỌNG: Chỉ định chính xác Origin (không dùng *)
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));

        // Cho phép gửi credentials (cookie/session)
        configuration.setAllowCredentials(true);

        // Cho phép tất cả các method
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Cho phép tất cả header
        configuration.setAllowedHeaders(List.of("*"));

        // Expose header để frontend đọc được nếu cần
        configuration.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}