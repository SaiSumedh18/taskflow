package dev.taskflow;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
class Errors {
  @ExceptionHandler(ResponseStatusException.class)
  ResponseEntity<?> api(ResponseStatusException e) {
    return ResponseEntity.status(e.getStatusCode())
        .body(
            Map.of(
                "success",
                false,
                "message",
                e.getReason() == null ? "Request failed" : e.getReason()));
  }

  @ExceptionHandler({
    MethodArgumentNotValidException.class,
    HttpMessageNotReadableException.class,
    com.fasterxml.jackson.core.JsonProcessingException.class,
    java.time.DateTimeException.class,
    IllegalArgumentException.class,
    org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class
  })
  ResponseEntity<?> bad(Exception e) {
    return ResponseEntity.badRequest()
        .body(Map.of("success", false, "message", "Invalid request data"));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<?> conflict(Exception e) {
    return ResponseEntity.status(409).body(Map.of("success", false, "message", "Conflicting data"));
  }
}
