import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true
		},
		username: {
			type: String,
			required: true,
			unique: true
		},
		passwordHash: {
			type: String,
			required: true
		},
		role: {
			type: String,
			enum: ["student", "faculty", "admin"],
			required: true
		},
	},
	{
		timestamps: true
	}
);

export default mongoose.models.User || mongoose.model("User", userSchema);

