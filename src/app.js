import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import authRouter from "./routes/auth.js";
import { requireAuth } from "./middleware/requireAuth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/jemn";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

await mongoose.connect(MONGODB_URI, {
	serverSelectionTimeoutMS: 10000
});

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
	session({
		secret: SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 7
		},
		store: MongoStore.create({ mongoUrl: MONGODB_URI })
	})
);

app.use("/auth", authRouter);

app.get("/", (req, res) => {
	if (req.session.userId) {
		return res.redirect("/dashboard");
	}
	return res.redirect("/login");
});

app.get("/login", (req, res) => {
	res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

app.get("/register", (req, res) => {
	res.sendFile(path.join(__dirname, "..", "public", "register.html"));
});

app.get("/game", requireAuth, (req, res) => {
	res.sendFile(path.join(__dirname, "..", "endless_heart_game(3).html"));
});

app.get("/dashboard", requireAuth, (req, res) => {
	res.sendFile(path.join(__dirname, "..", "public", "dashboard.html"));
});

app.get("/me", requireAuth, async (req, res) => {
	try {
		const User = (await import("./models/User.js")).User;
		const user = await User.findById(req.session.userId).select("email name");
		if (!user) return res.status(404).json({ message: "User not found" });
		res.json({ authenticated: true, userId: req.session.userId, email: user.email, name: user.name || user.email });
	} catch (err) {
		res.status(500).json({ message: "Error fetching user info" });
	}
});

app.get("/api/scores", requireAuth, async (req, res) => {
	try {
		const User = (await import("./models/User.js")).User;
		const user = await User.findById(req.session.userId).select("scores name email");
		if (!user) return res.status(404).json({ message: "User not found" });
		const sortedScores = user.scores.sort((a, b) => b.score - a.score);
		res.json({ scores: sortedScores, name: user.name || user.email, email: user.email });
	} catch (err) {
		res.status(500).json({ message: "Error fetching scores" });
	}
});

app.post("/api/scores", requireAuth, async (req, res) => {
	try {
		const { score } = req.body;
		if (typeof score !== "number" || score < 0) {
			return res.status(400).json({ message: "Invalid score" });
		}
		const User = (await import("./models/User.js")).User;
		await User.findByIdAndUpdate(req.session.userId, {
			$push: { scores: { score, date: new Date() } }
		});
		res.json({ message: "Score saved" });
	} catch (err) {
		res.status(500).json({ message: "Error saving score" });
	}
});

app.get("/logout", (req, res) => {
	req.session.destroy(() => {
		res.clearCookie("connect.sid");
		res.redirect("/login");
	});
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});





