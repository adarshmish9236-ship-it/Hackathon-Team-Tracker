// controllers/chatController.js
const { query } = require('../utils/db');

// Simple sentiment analysis
const analyzeSentiment = (msg) => {
  const pos = ['great','awesome','love','excellent','good','happy','amazing','🚀','🎉','✨','🔥','👏','perfect','done'];
  const neg = ['bug','broken','failed','error','issue','bad','problem','stuck','blocker','😤','😢','terrible'];
  const lower = msg.toLowerCase();
  const posCount = pos.filter(w => lower.includes(w)).length;
  const negCount = neg.filter(w => lower.includes(w)).length;
  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'negative';
  return 'neutral';
};

exports.getMessages = async (req, res) => {
  try {
    const { team_id } = req.params;
    const limit  = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const msgs = await query(
      `SELECT c.*,u.username,u.full_name,u.avatar_url,
              r.message AS reply_text, ru.full_name AS reply_user
       FROM Chats c
       JOIN Users u ON u.id=c.sender_id
       LEFT JOIN Chats r  ON r.id=c.reply_to
       LEFT JOIN Users ru ON ru.id=r.sender_id
       WHERE c.team_id=? ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [team_id, limit, offset]);
    res.json(msgs.reverse());
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.sendMessage = async (req, res) => {
  try {
    const { team_id } = req.params;
    const { message, message_type, file_url, reply_to } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    const sentiment = analyzeSentiment(message);
    const result = await query(
      'INSERT INTO Chats (team_id,sender_id,message,message_type,file_url,reply_to,sentiment) VALUES (?,?,?,?,?,?,?)',
      [team_id, req.user.id, message, message_type||'text', file_url||null, reply_to||null, sentiment]);
    
    // Log in ActivityLogs
    await query('INSERT INTO ActivityLogs (user_id, team_id, action, entity_type, entity_id, meta) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, team_id, 'chat_sent', 'Chat', result.insertId, JSON.stringify({ message })]);

    const [msg] = await query(
      `SELECT c.*,u.username,u.full_name,u.avatar_url FROM Chats c JOIN Users u ON u.id=c.sender_id WHERE c.id=?`,
      [result.insertId]);
    res.status(201).json(msg);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.addReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const [chat] = await query('SELECT reactions FROM Chats WHERE id=?', [id]);
    let reactions = chat.reactions ? JSON.parse(chat.reactions) : {};
    if (!reactions[emoji]) reactions[emoji] = [];
    const idx = reactions[emoji].indexOf(req.user.id);
    if (idx > -1) reactions[emoji].splice(idx, 1);
    else reactions[emoji].push(req.user.id);
    if (reactions[emoji].length === 0) delete reactions[emoji];
    await query('UPDATE Chats SET reactions=? WHERE id=?', [JSON.stringify(reactions), id]);
    res.json({ reactions });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.pinMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await query('UPDATE Chats SET is_pinned=NOT is_pinned WHERE id=?', [id]);
    res.json({ message: 'Toggled pin' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getSentimentStats = async (req, res) => {
  try {
    const { team_id } = req.params;
    const [stats] = await query('SELECT * FROM vw_team_sentiment WHERE team_id=?', [team_id]);
    res.json(stats || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
};
