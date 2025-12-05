package com.russianmaster.app.config;

import com.russianmaster.app.security.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Cho phép sử dụng @PreAuthorize trên các method Controller nếu cần
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Inject cấu hình CORS từ file CorsConfig.java để áp dụng cho Security
    @Autowired
    private CorsConfigurationSource corsConfigurationSource;

    /**
     * Bean AuthenticationProvider:
     * Cung cấp cơ chế xác thực dựa trên Database (UserDetailsService) và mã hóa mật khẩu (BCrypt).
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    /**
     * Bean AuthenticationManager:
     * Cần thiết để inject vào AuthController, giúp gọi hàm authenticate() thủ công khi đăng nhập.
     * Trong Spring Boot 3.x, bean này không tự động được tạo, phải khai báo tường minh.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    /**
     * Cấu hình Security Filter Chain (Quy tắc bảo mật chính)
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. Tắt CSRF: Vì chúng ta giao tiếp qua REST API và quản lý session/token riêng
                .csrf(AbstractHttpConfigurer::disable)

                // 2. Kích hoạt CORS: Sử dụng bean corsConfigurationSource đã định nghĩa
                // Bước này cực kỳ quan trọng để Frontend (cổng 5173) gọi được Backend (cổng 8080)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                // 3. Phân quyền truy cập theo URL (Authorize Requests)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // --- CÁC API CÔNG KHAI (Không cần đăng nhập) ---
                        .requestMatchers("/api/auth/**").permitAll()         // Đăng nhập, Đăng ký
                        .requestMatchers("/uploads/**", "/api/upload/**").permitAll() // File tĩnh (ảnh, audio)
                        .requestMatchers("/error").permitAll()               // Trang lỗi hệ thống

                        // --- CÁC API CHO PHÉP XEM KHÔNG CẦN LOGIN (Tùy chọn) ---
                        // Ví dụ: Khách vãng lai có thể xem danh sách bài học
                        .requestMatchers(HttpMethod.GET, "/api/lessons/**", "/api/tests/**","/api/practices/**").permitAll()

                        // --- CÁC API DÀNH RIÊNG CHO ADMIN ---
                        // Yêu cầu user phải có quyền "ADMIN" trong database
                        .requestMatchers("/api/admin/**").hasAuthority("ADMIN")

                        // --- CÁC API CÒN LẠI: BẮT BUỘC ĐĂNG NHẬP ---
                        .anyRequest().authenticated()
                )

                // 4. Cấu hình Đăng xuất (Logout)
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout") // URL để gọi logout
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setStatus(200); // Trả về HTTP 200 OK thay vì redirect
                            response.getWriter().write("Logout success");
                        })
                        .invalidateHttpSession(true) // Hủy session hiện tại
                        .deleteCookies("JSESSIONID") // Xóa cookie phiên
                );

        // Thêm Provider xác thực vào chuỗi cấu hình
        http.authenticationProvider(authenticationProvider());

        return http.build();
    }
}