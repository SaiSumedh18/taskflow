package dev.taskflow;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@SpringBootTest(
    properties = {
      "spring.datasource.url=${TEST_JDBC_URL:jdbc:postgresql://127.0.0.1:5493/taskflow_test}",
      "spring.datasource.username=${TEST_DB_USER:finsight}",
      "spring.datasource.password=${TEST_DB_PASSWORD:}",
      "taskflow.jwt-secret=isolated-junit-secret-at-least-32-bytes",
      "spring.sql.init.mode=always"
    })
@AutoConfigureMockMvc
class ApiIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired JdbcTemplate db;
  @Autowired Environment env;
  @Autowired JwtEncoder encoder;

  record Person(String token, int id, String email) {}

  Person owner, member, outsider;
  int project;

  JsonNode call(MockHttpServletRequestBuilder req, String token, Object body, int status)
      throws Exception {
    if (token != null) req.header("Authorization", "Bearer " + token);
    if (body != null) req.contentType("application/json").content(json.writeValueAsString(body));
    String result =
        mvc.perform(req)
            .andExpect(status().is(status))
            .andReturn()
            .getResponse()
            .getContentAsString();
    return result.isBlank() ? json.createObjectNode() : json.readTree(result);
  }

  Person register(String email) throws Exception {
    var r =
        call(
            post("/api/auth/register"),
            null,
            Map.of("name", "Test User", "email", email, "password", "Password123!"),
            201);
    return new Person(r.get("token").asText(), r.get("user").get("id").asInt(), email);
  }

  @BeforeEach
  void setup() throws Exception {
    String url = env.getProperty("spring.datasource.url");
    if (url == null || !url.matches(".*[/]taskflow_test([?].*)?$"))
      throw new IllegalStateException("Refusing destructive tests outside taskflow_test");
    db.execute("TRUNCATE users RESTART IDENTITY CASCADE");
    owner = register("owner@example.invalid");
    member = register("member@example.invalid");
    outsider = register("outsider@example.invalid");
    project =
        call(
                post("/api/projects"),
                owner.token(),
                Map.of("name", "Portfolio Project", "description", "Demo"),
                201)
            .get("project")
            .get("id")
            .asInt();
  }

  void add() throws Exception {
    call(
        post("/api/projects/" + project + "/members"),
        owner.token(),
        Map.of("email", member.email()),
        201);
  }

  JsonNode create() throws Exception {
    return call(
            post("/api/projects/" + project + "/tasks"),
            owner.token(),
            Map.of("title", "Write integration tests"),
            201)
        .get("task");
  }

  @Test
  void healthIsPublic() throws Exception {
    call(get("/api/health"), null, null, 200);
  }

  @Test
  void protectedEndpointsRequireJwt() throws Exception {
    call(get("/api/projects"), null, null, 401);
  }

  @Test
  void registersAndReturnsCurrentUserWithoutHash() throws Exception {
    var r = call(get("/api/auth/me"), owner.token(), null, 200).get("user");
    assertEquals(owner.id(), r.get("id").asInt());
    assertFalse(r.has("password_hash"));
  }

  @Test
  void validLogin() throws Exception {
    assertTrue(
        call(
                post("/api/auth/login"),
                null,
                Map.of("email", owner.email(), "password", "Password123!"),
                200)
            .has("token"));
  }

  @Test
  void invalidLogin() throws Exception {
    call(post("/api/auth/login"), null, Map.of("email", owner.email(), "password", "wrong"), 401);
  }

  @Test
  void duplicateRegistration() throws Exception {
    call(
        post("/api/auth/register"),
        null,
        Map.of("name", "Duplicate", "email", owner.email(), "password", "Password123!"),
        409);
  }

  @Test
  void validatesRegistration() throws Exception {
    call(
        post("/api/auth/register"),
        null,
        Map.of("name", " ", "email", "bad", "password", "short"),
        400);
  }

  @Test
  void rejectsTamperedToken() throws Exception {
    call(
        get("/api/projects"),
        owner.token().substring(0, owner.token().lastIndexOf('.') + 1) + "invalid",
        null,
        401);
  }

  @Test
  void rejectsExpiredToken() throws Exception {
    var claims =
        JwtClaimsSet.builder()
            .claim("userId", owner.id())
            .issuedAt(Instant.now().minusSeconds(600))
            .expiresAt(Instant.now().minusSeconds(300))
            .build();
    var token =
        encoder
            .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
            .getTokenValue();
    call(get("/api/projects"), token, null, 401);
  }

  @Test
  void preservesBcrypt2bCompatibility() throws Exception {
    db.update(
        "UPDATE users SET password_hash=replace(password_hash,'$2a$','$2b$') WHERE id=?",
        owner.id());
    call(
        post("/api/auth/login"),
        null,
        Map.of("email", owner.email(), "password", "Password123!"),
        200);
  }

  @Test
  void createsOwnerMembershipAtomically() {
    assertEquals(
        1,
        db.queryForObject(
            "SELECT count(*) FROM project_members WHERE project_id=? AND user_id=? AND role='OWNER'",
            Integer.class,
            project,
            owner.id()));
  }

  @Test
  void listsOnlyAccessibleProjects() throws Exception {
    assertEquals(0, call(get("/api/projects"), outsider.token(), null, 200).get("projects").size());
    assertEquals(1, call(get("/api/projects"), owner.token(), null, 200).get("projects").size());
  }

  @Test
  void projectReadsHideForeignProjects() throws Exception {
    call(get("/api/projects/" + project), outsider.token(), null, 404);
  }

  @Test
  void addsAndListsMembers() throws Exception {
    add();
    assertEquals(
        2,
        call(get("/api/projects/" + project + "/members"), member.token(), null, 200)
            .get("members")
            .size());
  }

  @Test
  void memberCannotAddOrRemoveMembers() throws Exception {
    add();
    call(
        post("/api/projects/" + project + "/members"),
        member.token(),
        Map.of("email", outsider.email()),
        403);
    call(delete("/api/projects/" + project + "/members/" + owner.id()), member.token(), null, 403);
  }

  @Test
  void duplicateMemberIsConflict() throws Exception {
    add();
    call(
        post("/api/projects/" + project + "/members"),
        owner.token(),
        Map.of("email", member.email()),
        409);
  }

  @Test
  void ownerCannotBeRemoved() throws Exception {
    call(delete("/api/projects/" + project + "/members/" + owner.id()), owner.token(), null, 400);
  }

  @Test
  void createsTaskWithDefaultsAndSnakeCaseResponse() throws Exception {
    var t = create();
    assertEquals("TODO", t.get("status").asText());
    assertEquals("MEDIUM", t.get("priority").asText());
    assertEquals(project, t.get("project_id").asInt());
    assertTrue(t.get("assigned_to").isNull());
    assertTrue(t.has("creator_name"));
  }

  @Test
  void membersCanPerformKanbanUpdates() throws Exception {
    add();
    var t = create();
    var r =
        call(
            patch("/api/tasks/" + t.get("id").asInt()),
            member.token(),
            Map.of("status", "IN_PROGRESS"),
            200);
    assertEquals("IN_PROGRESS", r.get("task").get("status").asText());
  }

  @Test
  void filtersAndSearchesTasks() throws Exception {
    create();
    call(
        post("/api/projects/" + project + "/tasks"),
        owner.token(),
        Map.of("title", "Review release", "priority", "HIGH", "status", "DONE"),
        201);
    assertEquals(
        1,
        call(
                get("/api/projects/" + project + "/tasks?status=DONE&priority=HIGH&search=release"),
                owner.token(),
                null,
                200)
            .get("tasks")
            .size());
  }

  @Test
  void validatesFilters() throws Exception {
    call(get("/api/projects/" + project + "/tasks?status=BAD"), owner.token(), null, 400);
  }

  @Test
  void rejectsForeignTaskOperations() throws Exception {
    int id = create().get("id").asInt();
    call(get("/api/tasks/" + id), outsider.token(), null, 404);
    call(patch("/api/tasks/" + id), outsider.token(), Map.of("title", "Hijack"), 404);
    call(delete("/api/tasks/" + id), outsider.token(), null, 404);
    call(get("/api/projects/" + project + "/tasks"), outsider.token(), null, 403);
  }

  @Test
  void assignmentRequiresMembership() throws Exception {
    call(
        post("/api/projects/" + project + "/tasks"),
        owner.token(),
        Map.of("title", "Assigned task", "assignedTo", outsider.id()),
        400);
  }

  @Test
  void validatesTaskEnumsAndDates() throws Exception {
    call(
        post("/api/projects/" + project + "/tasks"),
        owner.token(),
        Map.of("title", "Task", "status", "BAD"),
        400);
    call(
        post("/api/projects/" + project + "/tasks"),
        owner.token(),
        Map.of("title", "Task", "dueDate", "bad-date"),
        400);
  }

  @Test
  void setsAndClearsDatesAndAssignment() throws Exception {
    add();
    int id = create().get("id").asInt();
    call(
        patch("/api/tasks/" + id),
        owner.token(),
        Map.of("dueDate", "2026-10-03T12:00:00Z", "assignedTo", member.id()),
        200);
    var body = json.readTree("{\"dueDate\":null,\"assignedTo\":null}");
    var t = call(patch("/api/tasks/" + id), owner.token(), body, 200).get("task");
    assertTrue(t.get("due_date").isNull());
    assertTrue(t.get("assigned_to").isNull());
  }

  @Test
  void removedMembersLoseAccessAndAssignments() throws Exception {
    add();
    int id = create().get("id").asInt();
    call(patch("/api/tasks/" + id), owner.token(), Map.of("assignedTo", member.id()), 200);
    call(delete("/api/projects/" + project + "/members/" + member.id()), owner.token(), null, 200);
    assertTrue(
        call(get("/api/tasks/" + id), owner.token(), null, 200)
            .get("task")
            .get("assigned_to")
            .isNull());
    call(patch("/api/tasks/" + id), member.token(), Map.of("status", "DONE"), 404);
  }

  @Test
  void deletesTasks() throws Exception {
    int id = create().get("id").asInt();
    call(delete("/api/tasks/" + id), owner.token(), null, 200);
    call(get("/api/tasks/" + id), owner.token(), null, 404);
  }

  @Test
  void rejectsEmptyAndUnknownPatch() throws Exception {
    int id = create().get("id").asInt();
    call(patch("/api/tasks/" + id), owner.token(), Map.of(), 400);
    call(patch("/api/tasks/" + id), owner.token(), Map.of("createdBy", outsider.id()), 400);
  }

  @Test
  void searchTreatsWildcardsLiterally() throws Exception {
    create();
    assertEquals(
        0,
        call(get("/api/projects/" + project + "/tasks?search=%25"), owner.token(), null, 200)
            .get("tasks")
            .size());
  }

  @Test
  void validatesPositiveIdentifiers() throws Exception {
    call(get("/api/projects/0"), owner.token(), null, 400);
  }

  @Test
  void concurrentPatchesPreserveBothChanges() throws Exception {
    int id = create().get("id").asInt();
    var first =
        java.util.concurrent.CompletableFuture.runAsync(
            () -> {
              try {
                call(
                    patch("/api/tasks/" + id),
                    owner.token(),
                    Map.of("title", "Concurrent title"),
                    200);
              } catch (Exception e) {
                throw new RuntimeException(e);
              }
            });
    var second =
        java.util.concurrent.CompletableFuture.runAsync(
            () -> {
              try {
                call(patch("/api/tasks/" + id), owner.token(), Map.of("status", "DONE"), 200);
              } catch (Exception e) {
                throw new RuntimeException(e);
              }
            });
    java.util.concurrent.CompletableFuture.allOf(first, second).get();
    var task = call(get("/api/tasks/" + id), owner.token(), null, 200).get("task");
    assertEquals("Concurrent title", task.get("title").asText());
    assertEquals("DONE", task.get("status").asText());
  }
}
