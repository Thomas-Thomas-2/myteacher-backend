const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const app = require("../app");
const User = require("../models/users");
const Teacher = require("../models/teachers");
const Invitation = require("../models/invitations");

describe("POST /invitations - sans mock", () => {
  let token;
  let teacher;
  let user;

  beforeAll(async () => {
    // Vérifie la connexion Mongo
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.CONNECTION_STRING, {
        connectTimeoutMS: 2000,
      });
    }

    // On récupère le vrai user teacher
    user = await User.findOne({
      email: "bara.laetitia@gmail.com",
      role: "teacher",
    });

    if (!user) {
      throw new Error("User teacher introuvable en base");
    }

    // On récupère le vrai teacher profile lié
    teacher = await Teacher.findOne({ user: user._id });

    if (!teacher) {
      throw new Error("Teacher profile introuvable pour ce user");
    }

    // On génère un vrai JWT
    token = jwt.sign(
      {
        userId: user._id.toString(),
        role: "teacher",
      },
      process.env.JWT_SECRET,
    );
  });

  afterEach(async () => {
    // Nettoyage des invitations de test seulement
    await Invitation.deleteMany({
      email: {
        $in: ["jest-duplicate@test.com", "jest-integration@test.com"],
      },
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should return 400 if email is missing", async () => {
    const res = await request(app)
      .post("/invitations")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.result).toBe(false);
    expect(res.body.error).toBe("Missing fields");
  });

  it("should prevent duplicate active invitations", async () => {
    const email = "jest-duplicate@test.com";

    // 1ère requête réelle : crée l'invitation
    const firstRes = await request(app)
      .post("/invitations")
      .set("Authorization", `Bearer ${token}`)
      .send({ email });

    expect(firstRes.statusCode).toBe(201);
    expect(firstRes.body.result).toBe(true);

    // 2ème requête réelle : même email => doublon
    const secondRes = await request(app)
      .post("/invitations")
      .set("Authorization", `Bearer ${token}`)
      .send({ email });

    expect(secondRes.statusCode).toBe(409);
    expect(secondRes.body.result).toBe(false);
    expect(secondRes.body.error).toBe(
      "Active invitation already exists for this email",
    );
  });
});
