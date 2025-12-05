# Giai đoạn 1: Build ứng dụng
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
# Build file .jar (Bỏ qua test để build nhanh hơn)
RUN mvn clean package -DskipTests

# Giai đoạn 2: Chạy ứng dụng
# [THAY ĐỔI QUAN TRỌNG]: Chuyển từ 'alpine' sang bản 'jre' (Debian) chuẩn
# Bản này ổn định hơn nhiều về mạng và DNS so với Alpine
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# FIX LỖI "Network unreachable" với Supabase:
# Thêm cờ -Djava.net.preferIPv4Stack=true để ép dùng IPv4
ENTRYPOINT ["java", "-Djava.net.preferIPv4Stack=true", "-jar", "app.jar"]