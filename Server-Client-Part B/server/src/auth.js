import crypto from "crypto";
import { readUsers, writeUsers } from "./storage.js";

const sessions = new Map(); // token -> username

function createToken() {
  return crypto.randomBytes(24).toString("hex");
}

export async function register(req, res) {
  const { username, password, fullName, imageUrl } = req.body;

  if (!username || !password || !fullName || !imageUrl) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const users = await readUsers();
  if (users.some(u => u.username === username)) {
    return res.status(409).json({ error: "User exists" });
  }

  users.push({ username, password, fullName, imageUrl });
  await writeUsers(users);

  res.json({ ok: true });
}

export async function login(req, res) {
  const { username, password } = req.body;

  const users = await readUsers();
  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = createToken();
  sessions.set(token, username);

  res.json({
    ok: true,
    token,
    user: {
      username: user.username,
      fullName: user.fullName,
      imageUrl: user.imageUrl
    }
  });
}

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const username = sessions.get(token);

  if (!username) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = { username };
  req.token = token;
  next();
}

export function logout(req, res) {
  sessions.delete(req.token);
  res.json({ ok: true });
}
