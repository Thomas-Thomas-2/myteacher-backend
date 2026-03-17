const request = require("supertest");

// On bloque la vraie connexion Mongo
jest.mock("../models/connection", () => ({}));

// On mock l'auth pour simuler un teacher connecté
jest.mock("../middlewares/auth", () => {
  return (req, res, next) => {
    req.user = { userId: "user123", role: "teacher" };
    next();
  };
});

// On mock le contrôle de rôle
jest.mock("../middlewares/requireRole", () => {
  return () => (req, res, next) => next();
});

// On mock les modèles
jest.mock("../models/invitations", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock("../models/teachers", () => ({
  findOne: jest.fn(),
}));

jest.mock("../models/users", () => ({
  findOne: jest.fn(),
}));

jest.mock("../models/students", () => ({
  findOne: jest.fn(),
}));

// On mock l'envoi d'email
jest.mock("../services/mailer", () => ({
  sendInviteEmail: jest.fn(),
}));

const Invitation = require("../models/invitations");
const Teacher = require("../models/teachers");
const User = require("../models/users");
const Student = require("../models/students");
const { sendInviteEmail } = require("../services/mailer");

// app après les mocks
const app = require("../app");

describe("POST /invitations", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    Teacher.findOne.mockResolvedValue({
      _id: "teacher123",
      user: "user123",
    });

    User.findOne.mockResolvedValue(null);
    Student.findOne.mockResolvedValue(null);
  });

  it("should return 400 if email is missing", async () => {
    const res = await request(app).post("/invitations").send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.result).toBe(false);
  });

  it("should prevent duplicate invitations", async () => {
    Invitation.findOne.mockResolvedValue({
      _id: "invite123",
      email: "student@test.com",
    });

    const res = await request(app)
      .post("/invitations")
      .send({ email: "student@test.com" });

    expect(res.statusCode).toBe(409);
    expect(res.body.result).toBe(false);
    expect(Invitation.create).not.toHaveBeenCalled();
    expect(sendInviteEmail).not.toHaveBeenCalled();
  });
});
