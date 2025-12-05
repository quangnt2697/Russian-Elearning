# Giai đoạn 1: Build ứng dụng
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
# Build file .jar (Bỏ qua test để build nhanh hơn)
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

ENTRYPOINT ["java", "-Xmx350m", "-Xms350m", "-Djava.net.preferIPv4Stack=true", "-jar", "app.jar"]