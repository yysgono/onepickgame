// server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

app.post('/api/deleteuser', async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "user id required" });
  }
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token missing or malformed" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET);
    if (decoded.sub !== id) {
      return res.status(403).json({ error: "You can only delete your own account" });
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
