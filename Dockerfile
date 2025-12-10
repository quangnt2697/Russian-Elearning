# Giai đoạn 1: Build ứng dụng
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
# Build file .jar (Bỏ qua test để build nhanh hơn)
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app

RUN apt-get update && apt-get install -y fontconfig fonts-dejavu && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/*.jar app.jar

RUN mkdir -p uploads

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Xmx350m", "-Xms350m", "-Djava.net.preferIPv4Stack=true", "-jar", "app.jar"]