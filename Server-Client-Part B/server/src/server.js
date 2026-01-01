import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { register, login, logout, authMiddleware } from "./auth.js";
import { readPlaylists, writePlaylists } from "./storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../uploads");
const app = express();
const storage = multer.diskStorage({
  destination: uploadDir,
  
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "audio/mpeg") cb(null, true);
    else cb(new Error("Only MP3 allowed"));
  }
});


app.use("/uploads", express.static(uploadDir));
app.use(cors());
app.use(express.json());
app.post(
  "/api/playlists/:name/upload",
  authMiddleware,
  upload.single("mp3"),
  async (req, res) => {
    const { name } = req.params;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const all = await readPlaylists();
    const user = all.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ error: "User not found" });

    const playlist = user.playlists.find(p => p.name === name);
    if (!playlist) return res.status(404).json({ error: "Playlist not found" });

    const fixedName = Buffer
    .from(file.originalname, "latin1")
    .toString("utf8");

    playlist.videos.push({
      videoId: "mp3-" + Date.now(),
      title: fixedName,
      channel: "Local MP3",
      type: "mp3",
      file: `/uploads/${file.filename}`,
      rating: 0
    });


    await writePlaylists(all);
    res.json({ ok: true });
  }
);


/* ======================
   AUTH
   ====================== */
app.post("/api/register", register);
app.post("/api/login", login);
app.post("/api/logout", authMiddleware, logout);

/* ======================
   PLAYLISTS
   ====================== */

/* Get user playlists */
app.get("/api/playlists", authMiddleware, async (req, res) => {
  const all = await readPlaylists();
  const user = all.find(u => u.username === req.user.username);
  res.json(user?.playlists || []);
});

/* Create new playlist */
app.post("/api/playlists", authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Playlist name required" });

  const all = await readPlaylists();

  let user = all.find(u => u.username === req.user.username);
  if (!user) {
    user = { username: req.user.username, playlists: [] };
    all.push(user);
  }

  if (user.playlists.some(p => p.name === name)) {
    return res.status(409).json({ error: "Playlist already exists" });
  }

  user.playlists.push({ name, videos: [] });
  await writePlaylists(all);

  res.json({ ok: true });
});

/* Delete playlist */
app.delete("/api/playlists/:name", authMiddleware, async (req, res) => {
  const { name } = req.params;

  const all = await readPlaylists();
  const user = all.find(u => u.username === req.user.username);
  if (!user) return res.status(404).json({ error: "User not found" });

  const before = user.playlists.length;
  user.playlists = user.playlists.filter(p => p.name !== name);

  if (user.playlists.length === before) {
    return res.status(404).json({ error: "Playlist not found" });
  }

  await writePlaylists(all);
  res.json({ ok: true });
});

/* Add video to playlist */
app.post("/api/playlists/:name/videos", authMiddleware, async (req, res) => {
  const { name } = req.params;
  const video = req.body;

  const all = await readPlaylists();
  const user = all.find(u => u.username === req.user.username);
  if (!user) return res.status(404).json({ error: "User not found" });

  const playlist = user.playlists.find(p => p.name === name);
  if (!playlist) return res.status(404).json({ error: "Playlist not found" });

  const exists = playlist.videos.some(v => v.videoId === video.videoId);
  if (exists) {
    return res.status(409).json({ error: "Video already exists in playlist" });
  }

  playlist.videos.push(video);
  await writePlaylists(all);

  res.json({ ok: true });
});

/* Delete video from playlist */
app.delete(
  "/api/playlists/:name/videos/:videoId",
  authMiddleware,
  async (req, res) => {
    const { name, videoId } = req.params;

    const all = await readPlaylists();
    const user = all.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ error: "User not found" });

    const playlist = user.playlists.find(p => p.name === name);
    if (!playlist) return res.status(404).json({ error: "Playlist not found" });

    const before = playlist.videos.length;
    playlist.videos = playlist.videos.filter(v => v.videoId !== videoId);

    if (playlist.videos.length === before) {
      return res.status(404).json({ error: "Video not found" });
    }

    await writePlaylists(all);
    res.json({ ok: true });
  }
);

/* Update video rating */
app.put(
  "/api/playlists/:name/videos/:videoId/rating",
  authMiddleware,
  async (req, res) => {
    const { name, videoId } = req.params;
    const { rating } = req.body;

    const all = await readPlaylists();
    const user = all.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ error: "User not found" });

    const playlist = user.playlists.find(p => p.name === name);
    if (!playlist) return res.status(404).json({ error: "Playlist not found" });

    const video = playlist.videos.find(v => v.videoId === videoId);
    if (!video) return res.status(404).json({ error: "Video not found" });

    video.rating = rating;
    await writePlaylists(all);

    res.json({ ok: true });
  }
);

/* ======================
   SERVER
   ====================== */
app.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);
