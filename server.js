const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const usersFile = path.resolve("./users.json");
const messagesFile = path.resolve("./messages.json");

async function readJSON(file) {
  try {
    const data = await fs.readFile(file, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

// ثبت‌نام
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  if (typeof username !== "string" || username.trim() === "") {
    return res.status(400).json({ error: "نام کاربری معتبر نیست." });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "رمز عبور باید حداقل 8 کاراکتر باشد." });
  }

  const users = await readJSON(usersFile);
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ error: "این نام کاربری قبلاً ثبت شده است." });
  }

  const hashed = await bcrypt.hash(password, 10);
  users.push({ id: Date.now(), username, password: hashed });
  await writeJSON(usersFile, users);

  res.json({ message: "ثبت‌نام با موفقیت انجام شد." });
});

// ورود
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "نام کاربری و رمز عبور باید وارد شود." });
  }

  const users = await readJSON(usersFile);
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است." });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است." });
  }

  res.json({ message: "ورود با موفقیت انجام شد." });
});

// دریافت پیام‌ها
app.get("/api/messages", async (req, res) => {
  const messages = await readJSON(messagesFile);
  res.json(messages);
});

// ارسال پیام کاربر
app.post("/api/messages", async (req, res) => {
  const { userMessage } = req.body;
  if (typeof userMessage !== "string" || userMessage.trim() === "") {
    return res.status(400).json({ error: "متن پیام نامعتبر است." });
  }
  const messages = await readJSON(messagesFile);
  messages.push({
    id: Date.now(),
    userMessage: userMessage.trim(),
    adminReply: null,
  });
  await writeJSON(messagesFile, messages);
  res.status(201).json({ message: "پیام با موفقیت ارسال شد." });
});

// پاسخ ادمین
app.post("/api/messages/reply", async (req, res) => {
  const { id, reply } = req.body;
  if (typeof id !== "number" && typeof id !== "string") {
    return res.status(400).json({ error: "شناسه پیام نامعتبر است." });
  }
  if (typeof reply !== "string" || reply.trim() === "") {
    return res.status(400).json({ error: "پاسخ نمی‌تواند خالی باشد." });
  }
  const messages = await readJSON(messagesFile);
  const msg = messages.find(m => m.id == id);
  if (!msg) {
    return res.status(404).json({ error: "پیام مورد نظر پیدا نشد." });
  }
  msg.adminReply = reply.trim();
  await writeJSON(messagesFile, messages);
  res.json({ message: "پاسخ با موفقیت ثبت شد." });
});

// سرو فایل‌های ایستا مثل HTML/CSS/JS
app.use(express.static("public"));

// اجرای سرور
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
