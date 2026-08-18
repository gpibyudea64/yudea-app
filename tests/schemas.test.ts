import { describe, expect, it } from "vitest";
import { loginSchema } from "@/schemas/auth.schema";
import { userFormSchema } from "@/schemas/user.schema";
import { createMemberSchema, updateMemberSchema } from "@/schemas/api.schemas";

const validMember = {
  firstName: "John",
  gender: "MALE",
  birthDate: "1990-01-01",
  role: "FAMILY_HEAD",
  familyId: "family-1",
};

describe("auth schemas", () => {
  describe("loginSchema", () => {
    it("validates correct login data", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid email");
      }
    });

    it("rejects short password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "12345",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "at least 6 characters",
        );
      }
    });

    it("rejects empty email", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("member schemas", () => {
  describe("createMemberSchema bloodType", () => {
    it("accepts a valid blood type", () => {
      const result = createMemberSchema.safeParse({
        ...validMember,
        bloodType: "AB",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.bloodType).toBe("AB");
    });

    it("defaults bloodType to empty string when omitted", () => {
      const result = createMemberSchema.safeParse(validMember);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.bloodType).toBe("");
    });

    it("rejects an invalid blood type", () => {
      const result = createMemberSchema.safeParse({
        ...validMember,
        bloodType: "Z",
      });
      expect(result.success).toBe(false);
    });

    it("allows clearing bloodType via empty string", () => {
      const result = createMemberSchema.safeParse({
        ...validMember,
        bloodType: "",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.bloodType).toBe("");
    });
  });

  describe("updateMemberSchema bloodType", () => {
    it("accepts a valid blood type without requiring other fields", () => {
      const result = updateMemberSchema.safeParse({ bloodType: "O" });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid blood type", () => {
      const result = updateMemberSchema.safeParse({ bloodType: "X" });
      expect(result.success).toBe(false);
    });
  });
});

describe("user schemas", () => {
  describe("userFormSchema", () => {
    it("validates complete user form", () => {
      const result = userFormSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "secret123",
        role: "ADMIN",
        regionId: "region-1",
      });
      expect(result.success).toBe(true);
    });

    it("accepts user form without password and region", () => {
      const result = userFormSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        role: "STAFF",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = userFormSchema.safeParse({
        name: "",
        email: "john@example.com",
        role: "ADMIN",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = userFormSchema.safeParse({
        name: "John",
        email: "invalid",
        role: "ADMIN",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid role", () => {
      const result = userFormSchema.safeParse({
        name: "John",
        email: "john@example.com",
        role: "INVALID_ROLE",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password shorter than 6 characters", () => {
      const result = userFormSchema.safeParse({
        name: "John",
        email: "john@example.com",
        password: "12345",
        role: "ADMIN",
      });
      expect(result.success).toBe(false);
    });

    it("accepts empty password string", () => {
      const result = userFormSchema.safeParse({
        name: "John",
        email: "john@example.com",
        password: "",
        role: "MEMBER",
      });
      expect(result.success).toBe(true);
    });
  });
});
