import { Router } from "express";
import { User } from "../models/User.js";

const router = Router();

router.post("/register", async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.status(400).json({ message: "Email and password required" });
		const user = await User.register(email, password);
		req.session.userId = user._id.toString();
		res.status(201).json({ message: "Registered", userId: req.session.userId });
	} catch (err) {
		res.status(400).json({ message: err.message || "Registration failed" });
	}
});

router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.status(400).json({ message: "Email and password required" });
		const user = await User.findOne({ email });
		if (!user) return res.status(401).json({ message: "Invalid credentials" });
		const ok = await user.verifyPassword(password);
		if (!ok) return res.status(401).json({ message: "Invalid credentials" });
		req.session.userId = user._id.toString();
		res.json({ message: "Logged in", userId: req.session.userId });
	} catch (err) {
		res.status(500).json({ message: "Login failed" });
	}
});

export default router;





