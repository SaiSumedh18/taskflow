package dev.taskflow;

import jakarta.validation.constraints.*;

record Register(
    @NotBlank @Size(min = 2, max = 100) String name,
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Size(min = 8, max = 72) String password) {}

record Login(@NotBlank @Email String email, @NotBlank String password) {}

record NewProject(
    @NotBlank @Size(min = 2, max = 150) String name, @Size(max = 1000) String description) {}

record AddMember(@NotBlank @Email String email) {}

record TaskInput(
    @Size(min = 2, max = 200) String title,
    @Size(max = 2000) String description,
    @Pattern(regexp = "TODO|IN_PROGRESS|DONE") String status,
    @Pattern(regexp = "LOW|MEDIUM|HIGH") String priority,
    String dueDate,
    @Positive Integer assignedTo) {}
