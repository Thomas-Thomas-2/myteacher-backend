require("dotenv").config();
require("./models/connection");

var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var invitationsRouter = require("./routes/invitations");
var teachersRouter = require("./routes/teachers");
var studentsRouter = require("./routes/students");
var lessonsRouter = require("./routes/lessons");
var invoicesRouter = require("./routes/invoices");
var ressourcesRouter = require("./routes/ressources");
var messagesRouter = require("./routes/messages");

var app = express();

const fileUpload = require("express-fileupload");
app.use(fileUpload());

const cors = require("cors");

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://myteacher-frontend-three.vercel.app",
  "https://www.my-teacher-app.fr/",
];

const corsOptions = {
  origin: (origin, callback) => {
    // autorise Postman/curl (origin undefined)
    if (!origin) return callback(null, true);
    // autorise l'origine exact
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // autoriser toutes les previews Vercel
    if (origin.endsWith(".vercel.app")) return callback(null, true);
    return callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.set("trust proxy", 1);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/teachers", teachersRouter);
app.use("/students", studentsRouter);
app.use("/lessons", lessonsRouter);
app.use("/invitations", invitationsRouter);
app.use("/invoices", invoicesRouter);
app.use("/ressources", ressourcesRouter);
app.use("/messages", messagesRouter);

module.exports = app;
