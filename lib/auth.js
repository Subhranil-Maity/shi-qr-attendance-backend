import jwt from "jsonwebtoken";

export function verifyToken(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return null;
  }

  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET); // returns { username, role, iat, exp }
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
    return null;
  }
}

