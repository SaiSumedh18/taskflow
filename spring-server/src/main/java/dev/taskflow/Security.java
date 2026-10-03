package dev.taskflow;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.util.List;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;

@Configuration
class Security {
  @Bean
  SecretKeySpec key(@Value("${taskflow.jwt-secret}") String secret) {
    byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
    if (bytes.length < 32)
      throw new IllegalArgumentException("JWT_SECRET must be at least 32 bytes");
    return new SecretKeySpec(bytes, "HmacSHA256");
  }

  @Bean
  JwtDecoder decoder(SecretKeySpec key) {
    return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
  }

  @Bean
  JwtEncoder encoder(SecretKeySpec key) {
    return new NimbusJwtEncoder(new ImmutableSecret<>(key));
  }

  @Bean
  BCryptPasswordEncoder passwords() {
    return new BCryptPasswordEncoder(12);
  }

  @Bean
  SecurityFilterChain chain(HttpSecurity http, @Value("${taskflow.client-url}") String origin)
      throws Exception {
    http.csrf(c -> c.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
    http.cors(
        c ->
            c.configurationSource(
                request -> {
                  var config = new CorsConfiguration();
                  config.setAllowedOrigins(List.of(origin));
                  config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
                  config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
                  return config;
                }));
    http.authorizeHttpRequests(
        a ->
            a.requestMatchers("/api/health", "/api/auth/register", "/api/auth/login")
                .permitAll()
                .anyRequest()
                .authenticated());
    http.oauth2ResourceServer(
        o ->
            o.jwt(
                    j ->
                        j.jwtAuthenticationConverter(
                            jwt -> {
                              Object id = jwt.getClaim("userId");
                              if (id == null || !id.toString().matches("[1-9][0-9]*"))
                                throw new org.springframework.security.oauth2.core
                                    .OAuth2AuthenticationException("Invalid userId");
                              return new UsernamePasswordAuthenticationToken(
                                  id.toString(), jwt, List.of());
                            }))
                .authenticationEntryPoint(
                    (r, s, e) -> {
                      s.setStatus(401);
                      s.setContentType("application/json");
                      s.getWriter()
                          .write("{\"success\":false,\"message\":\"Invalid or missing token\"}");
                    }));
    return http.build();
  }
}
