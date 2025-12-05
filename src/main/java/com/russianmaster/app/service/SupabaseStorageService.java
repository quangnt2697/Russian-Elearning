package com.russianmaster.app.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.util.UUID;

@Service
public class SupabaseStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.bucket}")
    private String bucketName;

    private final RestClient restClient;

    public SupabaseStorageService() {
        this.restClient = RestClient.create();
    }

    /**
     * Upload file lên Supabase Storage
     * @param file File nhận từ Controller
     * @return URL công khai của file
     */
    public String uploadFile(MultipartFile file) {
        try {
            // 1. Tạo tên file duy nhất để tránh trùng lặp
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + extension;

            // 2. Gọi API Upload của Supabase
            // URL: POST /storage/v1/object/{bucket}/{filename}
            String uploadUrl = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucketName, fileName);

            restClient.post()
                    .uri(uploadUrl)
                    .header("Authorization", "Bearer " + supabaseKey)
                    .contentType(MediaType.parseMediaType(file.getContentType()))
                    .body(file.getBytes())
                    .retrieve()
                    .toBodilessEntity();

            // 3. Trả về Public URL
            // URL chuẩn: {supabaseUrl}/storage/v1/object/public/{bucket}/{filename}
            return String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, bucketName, fileName);

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Lỗi upload file lên Supabase: " + e.getMessage());
        }
    }
}