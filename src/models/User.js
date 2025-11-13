import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
	{
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		passwordHash: { type: String, required: true },
		name: { type: String, default: "" },
		scores: [{
			score: { type: Number, required: true },
			date: { type: Date, default: Date.now }
		}]
	},
	{ timestamps: true }
);

userSchema.statics.register = async function (email, password) {
	const existing = await this.findOne({ email });
	if (existing) throw new Error("Email already in use");
	const passwordHash = await bcrypt.hash(password, 12);
	const user = await this.create({ email, passwordHash });
	return user;
};

userSchema.methods.verifyPassword = async function (password) {
	return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model("User", userSchema);





