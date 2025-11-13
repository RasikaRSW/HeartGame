export function requireAuth(req, res, next) {
	if (req.session && req.session.userId) return next();
	if (req.accepts(["html", "json"]) === "html") {
		return res.redirect("/login");
	}
	return res.status(401).json({ message: "Authentication required" });
}





