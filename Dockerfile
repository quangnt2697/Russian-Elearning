# Giai đoạn 1: Build ứng dụng bằng Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Build ra file .jar, bỏ qua test để tiết kiệm thời gian build trên server
RUN mvn clean package -DskipTests

# Giai đoạn 2: Chạy ứng dụng bằng JDK rút gọn
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
# Copy file .jar từ giai đoạn build sang
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Djava.net.preferIPv4Stack=true", "-jar", "app.jar"]