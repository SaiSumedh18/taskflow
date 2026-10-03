package dev.taskflow;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

@MappedSuperclass
abstract class Timed {
  @Column(name = "created_at")
  Instant createdAt;

  @Column(name = "updated_at")
  Instant updatedAt;

  @PrePersist
  void createTime() {
    createdAt = Instant.now();
    updatedAt = createdAt;
  }

  @PreUpdate
  void updateTime() {
    updatedAt = Instant.now();
  }
}

@Entity
@Table(name = "users")
class User extends Timed {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  Integer id;

  String name;
  String email;

  @Column(name = "password_hash")
  String passwordHash;

  protected User() {}
}

@Entity
@Table(name = "projects")
class Project extends Timed {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  Integer id;

  String name;
  String description;

  @Column(name = "owner_id")
  Integer ownerId;

  protected Project() {}
}

class MembershipId implements Serializable {
  public Integer projectId;
  public Integer userId;

  public MembershipId() {}

  public MembershipId(Integer p, Integer u) {
    projectId = p;
    userId = u;
  }

  @Override
  public boolean equals(Object o) {
    return o instanceof MembershipId m
        && Objects.equals(projectId, m.projectId)
        && Objects.equals(userId, m.userId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(projectId, userId);
  }
}

@Entity
@Table(name = "project_members")
@IdClass(MembershipId.class)
class Membership {
  @Id
  @Column(name = "project_id")
  Integer projectId;

  @Id
  @Column(name = "user_id")
  Integer userId;

  String role;

  @Column(name = "created_at")
  Instant createdAt;

  protected Membership() {}

  @PrePersist
  void timestamp() {
    createdAt = Instant.now();
  }
}

@Entity
@Table(name = "tasks")
class Task extends Timed {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  Integer id;

  String title;
  String description;
  String status;
  String priority;

  @Column(name = "due_date")
  Instant dueDate;

  @Column(name = "project_id")
  Integer projectId;

  @Column(name = "created_by")
  Integer createdBy;

  @Column(name = "assigned_to")
  Integer assignedTo;

  protected Task() {}
}
