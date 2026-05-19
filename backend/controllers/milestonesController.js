// controllers/milestonesController.js — Hackathon Mode milestones
const { query } = require('../utils/db');

const DEFAULT_MILESTONES = [
  { title: 'Project Idea Finalized', category: 'planning', sort_order: 1 },
  { title: 'Tech Stack Decided',     category: 'planning', sort_order: 2 },
  { title: 'GitHub Repo Created',    category: 'dev', sort_order: 3 },
  { title: 'Core Backend API Done',  category: 'dev', sort_order: 4 },
  { title: 'Frontend UI Complete',   category: 'dev', sort_order: 5 },
  { title: 'Database Schema Set',    category: 'dev', sort_order: 6 },
  { title: 'Core Features Working',  category: 'dev', sort_order: 7 },
  { title: 'Demo Video Recorded',    category: 'presentation', sort_order: 8 },
  { title: 'Slide Deck Ready',       category: 'presentation', sort_order: 9 },
  { title: 'Deployment Live',        category: 'deployment', sort_order: 10 },
  { title: 'README Documentation',   category: 'documentation', sort_order: 11 },
  { title: 'Final Submission Done',  category: 'submission', sort_order: 12 },
];

exports.getMilestones = async (req, res) => {
  try {
    const { team_id } = req.params;
    let milestones = await query(
      'SELECT * FROM HackathonMilestones WHERE team_id=? ORDER BY sort_order ASC', [team_id]);

    // Auto-seed default milestones if none exist
    if (milestones.length === 0) {
      for (const m of DEFAULT_MILESTONES) {
        await query(
          'INSERT INTO HackathonMilestones (team_id,title,category,sort_order) VALUES (?,?,?,?)',
          [team_id, m.title, m.category, m.sort_order]);
      }
      milestones = await query(
        'SELECT * FROM HackathonMilestones WHERE team_id=? ORDER BY sort_order ASC', [team_id]);
    }
    res.json(milestones);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.toggleMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const [m] = await query('SELECT * FROM HackathonMilestones WHERE id=?', [id]);
    if (!m) return res.status(404).json({ error: 'Milestone not found' });
    const newDone = m.is_done ? 0 : 1;
    await query(
      'UPDATE HackathonMilestones SET is_done=?,completed_at=? WHERE id=?',
      [newDone, newDone ? 'CURRENT_TIMESTAMP' : null, id]);
    res.json({ id, is_done: newDone });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createMilestone = async (req, res) => {
  try {
    const { team_id } = req.params;
    const { title, description, category, due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const result = await query(
      'INSERT INTO HackathonMilestones (team_id,title,description,category,due_date) VALUES (?,?,?,?,?)',
      [team_id, title, description||null, category||'general', due_date||null]);
    const [m] = await query('SELECT * FROM HackathonMilestones WHERE id=?', [result.insertId]);
    res.status(201).json(m);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
