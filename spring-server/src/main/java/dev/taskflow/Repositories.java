package dev.taskflow;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

interface Users extends JpaRepository<User, Integer> {
  Optional<User> findByEmail(String email);
}

interface Projects extends JpaRepository<Project, Integer> {
  @Query(
      "select p from Project p join Membership m on m.projectId=p.id where m.userId=:user order by p.createdAt desc,p.id desc")
  List<Project> forUser(@Param("user") Integer user);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select p from Project p where p.id=:id")
  Optional<Project> locked(@Param("id") Integer id);
}

interface Memberships extends JpaRepository<Membership, MembershipId> {
  List<Membership> findByProjectId(Integer projectId);
}

interface Tasks extends JpaRepository<Task, Integer>, JpaSpecificationExecutor<Task> {
  List<Task> findByProjectIdAndAssignedTo(Integer projectId, Integer assignedTo);

  @Query("select t.projectId from Task t where t.id=:id")
  Optional<Integer> projectIdForTask(@Param("id") Integer id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select t from Task t where t.id=:id")
  Optional<Task> locked(@Param("id") Integer id);
}
