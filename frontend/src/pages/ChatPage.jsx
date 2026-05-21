// FILE: e:\PROJECTS\DBMS\frontend\src\pages\ChatPage.jsx
// src/pages/ChatPage.jsx — Real-time team chat with reactions (Premium Redesign)
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { chatAPI, teamAPI } from '../api/axios';
import { useStore } from '../store/useStore';
import { useSocket } from '../hooks/useSocket';
import { Send, Smile, Reply, AlertTriangle, MessageCircle, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const REACTIONS = ['👍','❤️','🔥','😂','🚀','😮','👀','🎉'];

export default function ChatPage() {
  const { id: teamId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [typing, setTyping]     = useState(null);
  const [replyTo, setReplyTo]   = useState(null);
  const [showEmoji, setShowEmoji] = useState(null);
  const [members, setMembers]   = useState([]);
  const [sosMsg, setSosMsg]     = useState('');
  const [showSOS, setShowSOS]   = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const { user, onlineUsers } = useStore();
  const socket = useSocket();

  const load = useCallback(async () => {
    const [msgs, team] = await Promise.all([
      chatAPI.getMessages(teamId, { limit:50 }),
      teamAPI.getTeam(teamId),
    ]);
    setMessages(msgs.data);
    setMembers(team.data.members);
  }, [teamId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new-message', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    socket.on('user-typing', ({ username }) => {
      setTyping(username);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(null), 2000);
    });
    socket.on('user-stop-typing', () => setTyping(null));
    return () => {
      socket.off('new-message');
      socket.off('user-typing');
      socket.off('user-stop-typing');
    };
  }, [socket]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const payload = { message: text, reply_to: replyTo?.id || null };
    setText('');
    setReplyTo(null);
    socket?.emit('stop-typing', { teamId });
    try {
      const r = await chatAPI.send(teamId, payload);
      socket?.emit('send-message', { ...r.data, teamId });
      setMessages(prev => [...prev, r.data]);
    } catch { toast.error('Failed to send message'); }
  };

  const handleTyping = (val) => {
    setText(val);
    socket?.emit('typing', { teamId, username: user.username });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket?.emit('stop-typing', { teamId }), 1500);
  };

  const addReaction = async (msgId, emoji) => {
    try {
      const r = await chatAPI.react(teamId, msgId, emoji);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: r.data.reactions } : m));
    } catch {}
    setShowEmoji(null);
  };

  const triggerSOS = async () => {
    if (!sosMsg.trim()) return toast.error('Add an emergency message');
    socket?.emit('sos', { teamId, message: sosMsg, username: user.username });
    toast.error('🆘 SOS Sent to all teammates!', { duration:5000 });
    setShowSOS(false);
    setSosMsg('');
  };

  const sentimentColor = (s) => ({ positive:'var(--emerald)',neutral:'var(--text-muted)',negative:'var(--rose)' }[s] || 'var(--text-muted)');

  // Build grouped messages
  const groupedMessages = messages.reduce((acc, msg, idx) => {
    const prev = messages[idx - 1];
    const isGrouped = prev && prev.sender_id === msg.sender_id;
    acc.push({ ...msg, isGrouped });
    return acc;
  }, []);

  const onlineCount = onlineUsers.length;

  // Avatar gradient per sender
  const avatarGradients = [
    'linear-gradient(135deg,#6366f1,#8b5cf6)',
    'linear-gradient(135deg,#06b6d4,#6366f1)',
    'linear-gradient(135deg,#10b981,#06b6d4)',
    'linear-gradient(135deg,#f59e0b,#f43f5e)',
    'linear-gradient(135deg,#8b5cf6,#ec4899)',
  ];
  const getGrad = (id) => avatarGradients[(id || 0) % avatarGradients.length];

  return (
    <div style={{ display:'flex', height:'calc(100vh - 108px)', gap:16 }}>

      {/* ── Main Chat Area ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', borderRadius:'var(--r-xl)', border:'1px solid var(--border-sm)', background:'rgba(8,13,24,0.75)', backdropFilter:'blur(28px)' }}>

        {/* Header */}
        <div style={{ height:56, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', borderBottom:'1px solid var(--border-xs)', flexShrink:0, background:'rgba(5,8,15,0.6)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:'var(--r-md)', background:'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(6,182,212,0.2))', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(99,102,241,0.25)' }}>
              <MessageCircle size={16} color="var(--indigo-light)" />
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, color:'var(--text-primary)' }}>
                Team Chat
              </div>
              <div style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
                <span className="dot-online" style={{ width:6, height:6 }} />
                <span style={{ color:'var(--emerald-light)', fontWeight:600 }}>{onlineCount} online</span>
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
            className="btn-sos" style={{ fontSize:12, padding:'7px 16px' }}
            onClick={() => setShowSOS(true)}
          >
            <AlertTriangle size={13} /> SOS
          </motion.button>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column' }}>
          {groupedMessages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            const reactions = msg.reactions && typeof msg.reactions === 'object' ? msg.reactions : {};
            const showAvatar = !msg.isGrouped;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity:0, y:10 }}
                animate={{ opacity:1, y:0 }}
                transition={{ duration:0.25 }}
                style={{ display:'flex', flexDirection: isMe?'row-reverse':'row', gap:12, alignItems:'flex-end', marginBottom: msg.isGrouped ? 4 : 12, position:'relative' }}
              >
                {/* Avatar placeholder to maintain alignment */}
                <div style={{ width:34, flexShrink:0 }}>
                  {showAvatar && (
                    <div style={{ width:34, height:34, borderRadius:'50%', background: getGrad(msg.sender_id), display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'white', boxShadow: isMe ? '0 0 12px rgba(99,102,241,0.4)' : 'none', border:'2px solid rgba(255,255,255,0.08)' }}>
                      {(msg.full_name || '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>

                <div style={{ maxWidth:'65%', display:'flex', flexDirection:'column', alignItems: isMe?'flex-end':'flex-start' }}>
                  {/* Sender name — only first in group, only for others */}
                  {!isMe && showAvatar && (
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4, display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ fontWeight:600, color:'var(--text-secondary)' }}>{msg.full_name}</span>
                      <span style={{ width:5, height:5, borderRadius:'50%', background: sentimentColor(msg.sentiment), display:'inline-block' }} />
                    </div>
                  )}

                  {/* Reply preview */}
                  {msg.reply_text && (
                    <div style={{ fontSize:11, color:'var(--text-muted)', borderLeft:'2px solid var(--indigo)', paddingLeft:8, marginBottom:5, fontStyle:'italic', maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', opacity:0.8 }}>
                      {msg.reply_user}: {msg.reply_text.slice(0, 60)}{msg.reply_text.length > 60 ? '…' : ''}
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`msg-bubble ${isMe ? 'mine' : 'theirs'}`}>
                    {msg.message}
                  </div>

                  {/* Reactions */}
                  {Object.keys(reactions).length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:5, justifyContent: isMe?'flex-end':'flex-start' }}>
                      {Object.entries(reactions).map(([emoji, users]) => (
                        <motion.button
                          key={emoji}
                          whileHover={{ scale:1.12 }} whileTap={{ scale:0.92 }}
                          onClick={() => addReaction(msg.id, emoji)}
                          style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:99, padding:'2px 9px', fontSize:12, cursor:'pointer', color:'var(--text-primary)', fontWeight:500, display:'flex', alignItems:'center', gap:4 }}
                        >
                          {emoji} <span style={{ fontSize:10, color:'var(--text-muted)' }}>{users.length}</span>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Time + actions */}
                  <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:4, textAlign: isMe?'right':'left', display:'flex', alignItems:'center', gap:6, flexDirection: isMe?'row-reverse':'row' }}>
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                    <motion.button
                      whileHover={{ scale:1.2 }}
                      onClick={() => setShowEmoji(showEmoji === msg.id ? null : msg.id)}
                      style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--text-muted)', padding:0, lineHeight:1 }}
                    >
                      <Smile size={11} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale:1.2 }}
                      onClick={() => setReplyTo(msg)}
                      style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--text-muted)', padding:0, lineHeight:1 }}
                    >
                      <Reply size={11} />
                    </motion.button>
                  </div>

                  {/* Emoji Picker */}
                  <AnimatePresence>
                    {showEmoji === msg.id && (
                      <motion.div
                        initial={{ opacity:0, scale:0.85, y:-6 }}
                        animate={{ opacity:1, scale:1, y:0 }}
                        exit={{ opacity:0, scale:0.85, y:-6 }}
                        transition={{ duration:0.18 }}
                        className="glass-card"
                        style={{ position:'absolute', zIndex:50, bottom:'100%', [isMe?'right':'left']:0, padding:10, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4, width:180, boxShadow:'0 16px 48px rgba(0,0,0,0.5)', border:'1px solid rgba(99,102,241,0.2)' }}
                      >
                        {REACTIONS.map(e => (
                          <motion.button
                            key={e}
                            whileHover={{ scale:1.3 }} whileTap={{ scale:0.9 }}
                            onClick={() => addReaction(msg.id, e)}
                            style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, padding:'4px', borderRadius:6 }}
                          >
                            {e}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}

          {/* Typing indicator */}
          <AnimatePresence>
            {typing && (
              <motion.div
                initial={{ opacity:0, y:6 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:6 }}
                style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--text-muted)', fontStyle:'italic', marginTop:4 }}
              >
                <span style={{ display:'flex', gap:3, alignItems:'center' }}>
                  {[0,1,2].map(i => (
                    <motion.span
                      key={i}
                      style={{ width:6, height:6, borderRadius:'50%', background:'var(--indigo-light)', display:'inline-block' }}
                      animate={{ y:[0,-5,0] }}
                      transition={{ repeat:Infinity, duration:0.8, delay:i*0.15 }}
                    />
                  ))}
                </span>
                <span><strong style={{ color:'var(--indigo-light)' }}>{typing}</strong> is typing…</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Reply preview bar */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ height:0, opacity:0 }}
              animate={{ height:'auto', opacity:1 }}
              exit={{ height:0, opacity:0 }}
              style={{ borderTop:'1px solid rgba(99,102,241,0.2)', background:'rgba(99,102,241,0.06)', overflow:'hidden', flexShrink:0 }}
            >
              <div style={{ padding:'8px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}>
                  <Reply size={12} color="var(--indigo-light)" />
                  <span>Replying to</span>
                  <strong style={{ color:'var(--indigo-light)' }}>{replyTo.full_name}</strong>
                  <span style={{ color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>
                    : {replyTo.message.slice(0, 60)}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale:1.2 }}
                  onClick={() => setReplyTo(null)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}
                >
                  <X size={14} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Composer */}
        <div style={{ padding:'16px 20px', borderTop:'1px solid var(--border-sm)', display:'flex', gap:10, alignItems:'flex-end', flexShrink:0, background:'rgba(5,8,15,0.5)' }}>
          <textarea
            className="input"
            style={{ flex:1, resize:'none', minHeight:44, maxHeight:120, lineHeight:1.5, borderRadius:'var(--r-lg)' }}
            placeholder="Message your team… (Enter to send)"
            value={text}
            onChange={e => handleTyping(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            rows={1}
          />
          <motion.button
            whileHover={{ scale:1.08 }} whileTap={{ scale:0.92 }}
            className="btn-primary"
            style={{ width:44, height:44, borderRadius:'50%', padding:0, justifyContent:'center', flexShrink:0 }}
            onClick={sendMessage}
          >
            <Send size={16} />
          </motion.button>
        </div>
      </div>

      {/* ── Members Sidebar ── */}
      <div style={{ width:240, flexShrink:0, display:'flex', flexDirection:'column', gap:12 }}>
        <div className="glass-card" style={{ padding:20, flex:1, display:'flex', flexDirection:'column', gap:0 }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <Users size={14} color="var(--indigo-light)" />
            <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:13, color:'var(--text-primary)' }}>Members</span>
            <span className="badge badge-indigo" style={{ marginLeft:'auto' }}>{members.length}</span>
          </div>

          <div className="divider" style={{ marginBottom:14 }} />

          <div style={{ display:'flex', flexDirection:'column', gap:10, overflowY:'auto', flex:1 }}>
            {members.map((m, i) => {
              const isOnline = onlineUsers.some(u => u.userId == m.id);
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity:0, x:10 }}
                  animate={{ opacity:1, x:0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ display:'flex', alignItems:'center', gap:10 }}
                >
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <div style={{
                      width:40, height:40, borderRadius:'50%',
                      background: getGrad(m.id),
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:14, fontWeight:700, color:'white',
                      border: isOnline ? '2px solid var(--emerald)' : '2px solid rgba(255,255,255,0.08)',
                      boxShadow: isOnline ? '0 0 12px rgba(16,185,129,0.4)' : 'none',
                      transition:'all 0.3s'
                    }}>
                      {m.full_name[0]}
                    </div>
                    <div style={{
                      position:'absolute', bottom:1, right:1,
                      width:10, height:10, borderRadius:'50%',
                      background: isOnline ? 'var(--emerald)' : 'var(--text-muted)',
                      border:'2px solid var(--space-surface)',
                      boxShadow: isOnline ? '0 0 6px var(--emerald)' : 'none'
                    }} />
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {m.full_name.split(' ')[0]}
                    </div>
                    {m.role_tag && (
                      <span className="badge badge-purple" style={{ marginTop:2, fontSize:9 }}>{m.role_tag}</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Online summary footer */}
          <div className="divider" style={{ marginTop:14, marginBottom:12 }} />
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text-muted)' }}>
            <span className="dot-online" style={{ width:6, height:6 }} />
            <span><strong style={{ color:'var(--emerald-light)' }}>{onlineCount}</strong> of {members.length} online</span>
          </div>
        </div>
      </div>

      {/* ── SOS Modal ── */}
      <AnimatePresence>
        {showSOS && (
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', backdropFilter:'blur(16px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
            onClick={e => e.target === e.currentTarget && setShowSOS(false)}
          >
            <motion.div
              initial={{ opacity:0, scale:0.85, y:20 }}
              animate={{ opacity:1, scale:1, y:0 }}
              exit={{ opacity:0, scale:0.85, y:20 }}
              transition={{ type:'spring', damping:22, stiffness:350 }}
              className="glass-card"
              style={{ maxWidth:440, width:'100%', padding:40, textAlign:'center', border:'1px solid rgba(244,63,94,0.4)', boxShadow:'0 0 60px rgba(244,63,94,0.15), 0 24px 80px rgba(0,0,0,0.6)' }}
            >
              <motion.div
                animate={{ scale:[1,1.1,1] }}
                transition={{ repeat:Infinity, duration:1.5 }}
                style={{ fontSize:64, marginBottom:16, display:'block' }}
              >
                🆘
              </motion.div>
              <h2 style={{ color:'var(--rose)', fontFamily:'var(--font-display)', fontWeight:800, fontSize:24, marginBottom:8 }}>
                Emergency Alert
              </h2>
              <p style={{ color:'var(--text-secondary)', marginBottom:24, fontSize:14, lineHeight:1.6 }}>
                This will immediately notify <strong style={{ color:'var(--text-primary)' }}>all team members</strong>. Use only for genuine emergencies.
              </p>
              <textarea
                className="input"
                style={{ marginBottom:16, resize:'none', minHeight:80, border:'1px solid rgba(244,63,94,0.35)', textAlign:'left' }}
                placeholder="Describe the emergency situation…"
                value={sosMsg}
                onChange={e => setSosMsg(e.target.value)}
                rows={3}
                autoFocus
              />
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-ghost" style={{ flex:1 }} onClick={() => setShowSOS(false)}>
                  Cancel
                </button>
                <button className="btn-sos" style={{ flex:1, justifyContent:'center' }} onClick={triggerSOS}>
                  🆘 Send SOS Alert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
