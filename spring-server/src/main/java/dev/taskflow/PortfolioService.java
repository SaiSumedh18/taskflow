package dev.taskflow;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
class PortfolioService {
  final Users users;
  final Projects projects;
  final Memberships memberships;
  final Tasks tasks;
  final BCryptPasswordEncoder passwords;
  final JwtEncoder encoder;
  final long ttl;

  PortfolioService(
      Users u,
      Projects p,
      Memberships m,
      Tasks t,
      BCryptPasswordEncoder b,
      JwtEncoder e,
      @org.springframework.beans.factory.annotation.Value("${taskflow.jwt-ttl-seconds}") long ttl) {
    users = u;
    projects = p;
    memberships = m;
    tasks = t;
    passwords = b;
    encoder = e;
    this.ttl = ttl;
  }

  static ResponseStatusException fail(HttpStatus code, String message) {
    return new ResponseStatusException(code, message);
  }

  static Map<String, Object> row(Object... values) {
    var map = new LinkedHashMap<String, Object>();
    for (int i = 0; i < values.length; i += 2) map.put(values[i].toString(), values[i + 1]);
    return map;
  }

  static Map<String, Object> ok(String field, Object value) {
    return row("success", true, field, value);
  }

  static String text(String value, int min, int max) {
    if (value == null) throw fail(HttpStatus.BAD_REQUEST, "Required text missing");
    String s = value.strip();
    if (s.length() < min || s.length() > max)
      throw fail(HttpStatus.BAD_REQUEST, "Invalid text length");
    return s;
  }

  static Map<String, Object> userRow(User u) {
    return row(
        "id",
        u.id,
        "name",
        u.name,
        "email",
        u.email,
        "created_at",
        u.createdAt,
        "updated_at",
        u.updatedAt);
  }

  Map<String, Object> session(User u) {
    var now = Instant.now();
    var claims =
        JwtClaimsSet.builder()
            .subject(u.id.toString())
            .claim("userId", u.id)
            .issuedAt(now)
            .expiresAt(now.plusSeconds(ttl))
            .build();
    String token =
        encoder
            .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
            .getTokenValue();
    return row("success", true, "user", userRow(u), "token", token);
  }

  Map<String, Object> register(Register data) {
    if (data.password().getBytes(StandardCharsets.UTF_8).length > 72)
      throw fail(HttpStatus.BAD_REQUEST, "Password exceeds bcrypt byte limit");
    if (users.findByEmail(data.email().strip()).isPresent())
      throw fail(HttpStatus.CONFLICT, "Email is already registered");
    var u = new User();
    u.name = text(data.name(), 2, 100);
    u.email = data.email().strip();
    u.passwordHash = passwords.encode(data.password());
    return session(users.saveAndFlush(u));
  }

  @Transactional(readOnly = true)
  Map<String, Object> login(Login data) {
    var u =
        users
            .findByEmail(data.email().strip())
            .orElseThrow(() -> fail(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
    if (!passwords.matches(data.password(), u.passwordHash))
      throw fail(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    return session(u);
  }

  @Transactional(readOnly = true)
  Map<String, Object> me(Integer id) {
    return ok(
        "user",
        userRow(
            users.findById(id).orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "User not found"))));
  }

  Membership member(Integer projectId, Integer userId) {
    return memberships
        .findById(new MembershipId(projectId, userId))
        .orElseThrow(() -> fail(HttpStatus.FORBIDDEN, "You do not have access to this project"));
  }

  Project lockedAccess(Integer projectId, Integer userId, boolean owner) {
    var p =
        projects
            .locked(projectId)
            .orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Project not found"));
    var m = member(projectId, userId);
    if (owner && (!m.role.equals("OWNER") || !p.ownerId.equals(userId)))
      throw fail(HttpStatus.FORBIDDEN, "Only the owner can manage members");
    return p;
  }

  Map<String, Object> projectRow(Project p, Integer userId) {
    return row(
        "id",
        p.id,
        "name",
        p.name,
        "description",
        p.description,
        "owner_id",
        p.ownerId,
        "role",
        member(p.id, userId).role,
        "created_at",
        p.createdAt,
        "updated_at",
        p.updatedAt);
  }

  Map<String, Object> createProject(Integer userId, NewProject data) {
    var p = new Project();
    p.name = text(data.name(), 2, 150);
    p.description = data.description() == null ? "" : data.description().strip();
    p.ownerId = userId;
    projects.saveAndFlush(p);
    var m = new Membership();
    m.projectId = p.id;
    m.userId = userId;
    m.role = "OWNER";
    memberships.saveAndFlush(m);
    return ok("project", projectRow(p, userId));
  }

  @Transactional(readOnly = true)
  Map<String, Object> listProjects(Integer userId) {
    return ok(
        "projects", projects.forUser(userId).stream().map(p -> projectRow(p, userId)).toList());
  }

  @Transactional(readOnly = true)
  Map<String, Object> project(Integer id, Integer userId) {
    var p =
        projects.findById(id).orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Project not found"));
    if (!memberships.existsById(new MembershipId(id, userId)))
      throw fail(HttpStatus.NOT_FOUND, "Project not found");
    return ok("project", projectRow(p, userId));
  }

  @Transactional(readOnly = true)
  Map<String, Object> members(Integer id, Integer userId) {
    member(id, userId);
    var list = memberships.findByProjectId(id);
    var userMap = new HashMap<Integer, User>();
    users.findAllById(list.stream().map(m -> m.userId).toList()).forEach(u -> userMap.put(u.id, u));
    return ok(
        "members",
        list.stream()
            .sorted(
                Comparator.comparing((Membership m) -> !m.role.equals("OWNER"))
                    .thenComparing(m -> userMap.get(m.userId).name))
            .map(
                m -> {
                  var u = userMap.get(m.userId);
                  return row(
                      "id",
                      u.id,
                      "name",
                      u.name,
                      "email",
                      u.email,
                      "role",
                      m.role,
                      "created_at",
                      m.createdAt);
                })
            .toList());
  }

  Map<String, Object> addMember(Integer id, Integer userId, AddMember data) {
    lockedAccess(id, userId, true);
    var u =
        users
            .findByEmail(data.email().strip())
            .orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "User not found"));
    if (memberships.existsById(new MembershipId(id, u.id)))
      throw fail(HttpStatus.CONFLICT, "User is already a member");
    var m = new Membership();
    m.projectId = id;
    m.userId = u.id;
    m.role = "MEMBER";
    memberships.save(m);
    return ok("member", row("id", u.id, "name", u.name, "email", u.email, "role", m.role));
  }

  Map<String, Object> removeMember(Integer id, Integer userId, Integer target) {
    var p = lockedAccess(id, userId, true);
    if (p.ownerId.equals(target)) throw fail(HttpStatus.BAD_REQUEST, "Cannot remove project owner");
    var m =
        memberships
            .findById(new MembershipId(id, target))
            .orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Member not found"));
    memberships.delete(m);
    for (var task : tasks.findByProjectIdAndAssignedTo(id, target)) {
      task.assignedTo = null;
      tasks.save(task);
    }
    return row("success", true, "message", "Member removed successfully");
  }

  void assign(Integer projectId, Integer userId) {
    if (userId != null && !memberships.existsById(new MembershipId(projectId, userId)))
      throw fail(HttpStatus.BAD_REQUEST, "Assignee must be a project member");
  }

  static Instant date(String value) {
    return value == null ? null : Instant.parse(value);
  }

  Map<String, Object> taskRow(Task t, Map<Integer, User> names) {
    return row(
        "id",
        t.id,
        "title",
        t.title,
        "description",
        t.description,
        "status",
        t.status,
        "priority",
        t.priority,
        "due_date",
        t.dueDate,
        "project_id",
        t.projectId,
        "created_by",
        t.createdBy,
        "assigned_to",
        t.assignedTo,
        "created_at",
        t.createdAt,
        "updated_at",
        t.updatedAt,
        "creator_name",
        names.get(t.createdBy).name,
        "assignee_name",
        t.assignedTo == null ? null : names.get(t.assignedTo).name);
  }

  Map<Integer, User> names(List<Task> list) {
    var ids = new HashSet<Integer>();
    for (var t : list) {
      ids.add(t.createdBy);
      if (t.assignedTo != null) ids.add(t.assignedTo);
    }
    var map = new HashMap<Integer, User>();
    users.findAllById(ids).forEach(u -> map.put(u.id, u));
    return map;
  }

  Map<String, Object> one(Task t) {
    return ok("task", taskRow(t, names(List.of(t))));
  }

  Map<String, Object> createTask(Integer projectId, Integer userId, TaskInput data) {
    lockedAccess(projectId, userId, false);
    assign(projectId, data.assignedTo());
    var t = new Task();
    t.projectId = projectId;
    t.createdBy = userId;
    t.title = text(data.title(), 2, 200);
    t.description = data.description() == null ? "" : data.description().strip();
    t.status = data.status() == null ? "TODO" : data.status();
    t.priority = data.priority() == null ? "MEDIUM" : data.priority();
    t.dueDate = date(data.dueDate());
    t.assignedTo = data.assignedTo();
    return one(tasks.saveAndFlush(t));
  }

  @Transactional(readOnly = true)
  Map<String, Object> listTasks(
      Integer projectId, Integer userId, String status, String priority, String search) {
    member(projectId, userId);
    if (status != null && !Set.of("TODO", "IN_PROGRESS", "DONE").contains(status))
      throw fail(HttpStatus.BAD_REQUEST, "Invalid status");
    if (priority != null && !Set.of("LOW", "MEDIUM", "HIGH").contains(priority))
      throw fail(HttpStatus.BAD_REQUEST, "Invalid priority");
    Specification<Task> spec =
        (root, q, cb) -> {
          var p = new ArrayList<jakarta.persistence.criteria.Predicate>();
          p.add(cb.equal(root.get("projectId"), projectId));
          if (status != null) p.add(cb.equal(root.get("status"), status));
          if (priority != null) p.add(cb.equal(root.get("priority"), priority));
          if (search != null && !search.isBlank()) {
            String s =
                "%"
                    + search
                        .toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\")
                        .replace("%", "\\%")
                        .replace("_", "\\_")
                    + "%";
            p.add(
                cb.or(
                    cb.like(cb.lower(root.get("title")), s, '\\'),
                    cb.like(cb.lower(root.get("description")), s, '\\')));
          }
          return cb.and(p.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    var list = tasks.findAll(spec, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
    var n = names(list);
    return ok("tasks", list.stream().map(t -> taskRow(t, n)).toList());
  }

  @Transactional(readOnly = true)
  Map<String, Object> task(Integer id, Integer userId) {
    var t = tasks.findById(id).orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Task not found"));
    if (!memberships.existsById(new MembershipId(t.projectId, userId)))
      throw fail(HttpStatus.NOT_FOUND, "Task not found");
    return one(t);
  }

  Task lockedTask(Integer id, Integer userId) {
    // Read only the project ID before locking; never cache a mutable task snapshot while waiting.
    var projectId =
        tasks.projectIdForTask(id).orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Task not found"));
    if (!memberships.existsById(new MembershipId(projectId, userId)))
      throw fail(HttpStatus.NOT_FOUND, "Task not found");
    lockedAccess(projectId, userId, false);
    return tasks.locked(id).orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Task not found"));
  }

  Map<String, Object> updateTask(Integer id, Integer userId, TaskInput data, Set<String> fields) {
    if (fields.isEmpty()) throw fail(HttpStatus.BAD_REQUEST, "At least one task field is required");
    var t = lockedTask(id, userId);
    if (fields.contains("title")) t.title = text(data.title(), 2, 200);
    if (fields.contains("description")) t.description = text(data.description(), 0, 2000);
    if (fields.contains("status")) {
      if (data.status() == null) throw fail(HttpStatus.BAD_REQUEST, "Status required");
      t.status = data.status();
    }
    if (fields.contains("priority")) {
      if (data.priority() == null) throw fail(HttpStatus.BAD_REQUEST, "Priority required");
      t.priority = data.priority();
    }
    if (fields.contains("dueDate")) t.dueDate = date(data.dueDate());
    if (fields.contains("assignedTo")) {
      assign(t.projectId, data.assignedTo());
      t.assignedTo = data.assignedTo();
    }
    return one(tasks.saveAndFlush(t));
  }

  Map<String, Object> deleteTask(Integer id, Integer userId) {
    tasks.delete(lockedTask(id, userId));
    return row("success", true, "message", "Task deleted successfully");
  }
}
