FROM public.ecr.aws/docker/library/maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src src
RUN mvn -B -DskipTests package
FROM public.ecr.aws/docker/library/eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/taskflow-api-1.0.0.jar app.jar
USER 10001
EXPOSE 4000
ENTRYPOINT ["java","-jar","/app/app.jar"]
