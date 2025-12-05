package com.russianmaster.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

@Configuration
public class CookieConfig {

    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();

        // Tắt SameSite strict để cho phép Cross-site cookie (Vercel gọi Render)
        serializer.setSameSite("None");

        // Bắt buộc cookie phải dùng HTTPS (Secure)
        serializer.setUseSecureCookie(true);

        return serializer;
    }
}