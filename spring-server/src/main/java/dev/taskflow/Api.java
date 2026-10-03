package dev.taskflow;

import com.fasterxml.jackson.databind.*;
import jakarta.validation.Valid;
import jakarta.validation.Validator;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
class Api {
  final PortfolioService service;
  final ObjectMapper mapper;
  final Validator validator;

  Api(PortfolioService s, ObjectMapper m, Validator v) {
    service = s;
    mapper = m;
    validator = v;
  }

  Integer user(Authentication a) {
    return Integer.valueOf(a.getName());
  }

  Integer id(Integer value) {
    if (value < 1) throw PortfolioService.fail(HttpStatus.BAD_REQUEST, "Invalid ID");
    return value;
  }

  @GetMapping("/health")
  Object health() {
    return Map.of("success", true, "message", "TaskFlow Spring API is running");
  }

  @PostMapping("/auth/register")
  @ResponseStatus(HttpStatus.CREATED)
  Object register(@Valid @RequestBody Register r) {
    return service.register(r);
  }

  @PostMapping("/auth/login")
  Object login(@Valid @RequestBody Login r) {
    return service.login(r);
  }

  @GetMapping("/auth/me")
  Object me(Authentication a) {
    return service.me(user(a));
  }

  @PostMapping("/projects")
  @ResponseStatus(HttpStatus.CREATED)
  Object createProject(Authentication a, @Valid @RequestBody NewProject p) {
    return service.createProject(user(a), p);
  }

  @GetMapping("/projects")
  Object projects(Authentication a) {
    return service.listProjects(user(a));
  }

  @GetMapping("/projects/{projectId}")
  Object project(Authentication a, @PathVariable Integer projectId) {
    return service.project(id(projectId), user(a));
  }

  @GetMapping("/projects/{projectId}/members")
  Object members(Authentication a, @PathVariable Integer projectId) {
    return service.members(id(projectId), user(a));
  }

  @PostMapping("/projects/{projectId}/members")
  @ResponseStatus(HttpStatus.CREATED)
  Object addMember(
      Authentication a, @PathVariable Integer projectId, @Valid @RequestBody AddMember m) {
    return service.addMember(id(projectId), user(a), m);
  }

  @DeleteMapping("/projects/{projectId}/members/{target}")
  Object removeMember(
      Authentication a, @PathVariable Integer projectId, @PathVariable Integer target) {
    return service.removeMember(id(projectId), user(a), id(target));
  }

  @PostMapping("/projects/{projectId}/tasks")
  @ResponseStatus(HttpStatus.CREATED)
  Object createTask(
      Authentication a, @PathVariable Integer projectId, @Valid @RequestBody TaskInput t) {
    return service.createTask(id(projectId), user(a), t);
  }

  @GetMapping("/projects/{projectId}/tasks")
  Object tasks(
      Authentication a,
      @PathVariable Integer projectId,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String priority,
      @RequestParam(required = false) String search) {
    return service.listTasks(id(projectId), user(a), status, priority, search);
  }

  @GetMapping("/tasks/{taskId}")
  Object task(Authentication a, @PathVariable Integer taskId) {
    return service.task(id(taskId), user(a));
  }

  @PatchMapping("/tasks/{taskId}")
  Object update(Authentication a, @PathVariable Integer taskId, @RequestBody JsonNode json)
      throws com.fasterxml.jackson.core.JsonProcessingException {
    if (!json.isObject()) throw PortfolioService.fail(HttpStatus.BAD_REQUEST, "Object required");
    var t = mapper.treeToValue(json, TaskInput.class);
    if (!validator.validate(t).isEmpty())
      throw PortfolioService.fail(HttpStatus.BAD_REQUEST, "Invalid task data");
    var fields = new HashSet<String>();
    json.fieldNames().forEachRemaining(fields::add);
    return service.updateTask(id(taskId), user(a), t, fields);
  }

  @DeleteMapping("/tasks/{taskId}")
  Object delete(Authentication a, @PathVariable Integer taskId) {
    return service.deleteTask(id(taskId), user(a));
  }
}
