// src/pages/ChatPage.jsx — Real-time team chat with reactions
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { chatAPI, teamAPI } from '../api/axios';
import { useStore } from '../store/useStore';
import { useSocket } from '../hooks/useSocket';
import { Send, Smile, Pin, Reply, AlertTriangle } from 'lucide-react';
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

  const sentimentColor = (s) => ({ positive:'var(--accent-green)',neutral:'var(--text-muted)',negative:'#ef4444' }[s] || 'var(--text-muted)');

  return (
    <div style={{ display:'flex', height:'calc(100vh - 108px)', gap:16 }}>
      {/* Chat Area */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:'var(--bg-secondary)', borderRadius:16, border:'1px solid var(--border-glass)', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-glass)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h2 style={{ fontWeight:700, fontSize:16 }}>💬 Team Chat</h2>
            <p style={{ fontSize:12, color:'var(--accent-green)' }}>
              {onlineUsers.length} online
            </p>
          </div>
          <button className="btn-danger sos-btn" style={{ padding:'6px 14px',fontSize:12 }} onClick={() => setShowSOS(true)}>
            🆘 SOS
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
          {messages.map((msg) => {
            const isMe = msg.sender_id === user.id;
            const reactions = msg.reactions && typeof msg.reactions === 'object' ? msg.reactions : {};
            return (
              <motion.div key={msg.id} initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }}
                style={{ display:'flex', flexDirection: isMe?'row-reverse':'row', gap:10, alignItems:'flex-end' }}>
                {/* Avatar */}
                <div style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'white',flexShrink:0 }}>
                  {(msg.full_name||'?')[0]}
                </div>
                <div style={{ maxWidth:'65%' }}>
                  {!isMe && (
                    <div style={{ fontSize:11,color:'var(--text-muted)',marginBottom:4,display:'flex',alignItems:'center',gap:6 }}>
                      <span style={{ fontWeight:600 }}>{msg.full_name}</span>
                      <span style={{ width:6,height:6,borderRadius:'50%',background:sentimentColor(msg.sentiment) }}/>
                    </div>
                  )}
                  {/* Reply preview */}
                  {msg.reply_text && (
                    <div style={{ fontSize:11,color:'var(--text-muted)',borderLeft:'2px solid var(--accent-blue)',paddingLeft:8,marginBottom:4,fontStyle:'italic' }}>
                      {msg.reply_user}: {msg.reply_text.slice(0,60)}...
                    </div>
                  )}
                  <div className={`msg-bubble ${isMe?'mine':'theirs'}`}>
                    {msg.message}
                  </div>
                  {/* Reactions */}
                  {Object.keys(reactions).length > 0 && (
                    <div style={{ display:'flex',flexWrap:'wrap',gap:4,marginTop:4,justifyContent:isMe?'flex-end':'flex-start' }}>
                      {Object.entries(reactions).map(([emoji, users]) => (
                        <button key={emoji} onClick={() => addReaction(msg.id, emoji)}
                          style={{ background:'var(--bg-glass)',border:'1px solid var(--border-glass)',borderRadius:99,padding:'2px 8px',fontSize:12,cursor:'pointer',color:'var(--text-primary)' }}>
                          {emoji} {users.length}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize:10,color:'var(--text-muted)',marginTop:3,textAlign:isMe?'right':'left' }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour:'2-digit',minute:'2-digit' })}
                    <span style={{ cursor:'pointer',marginLeft:6 }} onClick={() => setShowEmoji(msg.id)}>😊</span>
                    <span style={{ cursor:'pointer',marginLeft:6 }} onClick={() => setReplyTo(msg)}>↩</span>
                  </div>
                  {/* Emoji Picker */}
                  <AnimatePresence>
                    {showEmoji === msg.id && (
                      <motion.div initial={{ opacity:0,scale:0.9 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:0.9 }}
                        style={{ position:'absolute',zIndex:50,background:'var(--bg-card)',border:'1px solid var(--border-glass)',borderRadius:12,padding:8,display:'flex',gap:4,flexWrap:'wrap',width:220,boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>
                        {REACTIONS.map(e => (
                          <button key={e} onClick={() => addReaction(msg.id,e)}
                            style={{ background:'none',border:'none',cursor:'pointer',fontSize:20,padding:4,borderRadius:6,transition:'transform 0.1s' }}
                            onMouseEnter={ev=>ev.target.style.transform='scale(1.3)'}
                            onMouseLeave={ev=>ev.target.style.transform='scale(1)'}>
                            {e}
                          </button>
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
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                style={{ fontSize:12,color:'var(--text-muted)',fontStyle:'italic',display:'flex',alignItems:'center',gap:6 }}>
                <span style={{ display:'flex',gap:3 }}>
                  {[0,1,2].map(i=>(
                    <motion.span key={i} style={{ width:6,height:6,borderRadius:'50%',background:'var(--accent-blue)',display:'inline-block' }}
                      animate={{ y:[0,-4,0] }} transition={{ repeat:Infinity,duration:0.8,delay:i*0.15 }}/>
                  ))}
                </span>
                {typing} is typing...
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef}/>
        </div>

        {/* Reply preview */}
        {replyTo && (
          <div style={{ padding:'8px 20px',background:'rgba(79,142,247,0.06)',borderTop:'1px solid rgba(79,142,247,0.2)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div style={{ fontSize:12,color:'var(--text-muted)' }}>
              <Reply size={12} style={{ display:'inline',marginRight:6 }}/>
              Replying to <strong>{replyTo.full_name}</strong>: {replyTo.message.slice(0,60)}
            </div>
            <button onClick={() => setReplyTo(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)' }}>&times;</button>
          </div>
        )}

        {/* Input */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border-glass)', display:'flex', gap:10, alignItems:'flex-end' }}>
          <textarea className="input" style={{ flex:1, resize:'none', minHeight:44, maxHeight:120, lineHeight:1.5 }}
            placeholder="Message your team... (Enter to send)"
            value={text} onChange={e => handleTyping(e.target.value)}
            onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            rows={1}/>
          <button className="btn-primary" style={{ padding:'10px 16px',flexShrink:0 }} onClick={sendMessage}>
            <Send size={16}/>
          </button>
        </div>
      </div>

      {/* Sidebar: Online members */}
      <div style={{ width:220, display:'flex', flexDirection:'column', gap:12 }}>
        <div className="glass-card" style={{ padding:16, flex:1 }}>
          <h3 style={{ fontWeight:700,fontSize:14,marginBottom:16 }}>Team Members</h3>
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {members.map(m => {
              const isOnline = onlineUsers.some(u => u.userId == m.id);
              return (
                <div key={m.id} style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <div style={{ position:'relative' }}>
                    <div style={{ width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'white' }}>
                      {m.full_name[0]}
                    </div>
                    <div style={{ position:'absolute',bottom:0,right:0,width:10,height:10,borderRadius:'50%',background:isOnline?'var(--accent-green)':'var(--text-muted)',border:'2px solid var(--bg-secondary)',boxShadow:isOnline?'0 0 6px var(--accent-green)':'none' }}/>
                  </div>
                  <div>
                    <div style={{ fontSize:13,fontWeight:600 }}>{m.full_name.split(' ')[0]}</div>
                    <div style={{ fontSize:11,color:'var(--text-muted)' }}>{m.role_tag}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SOS Modal */}
      {showSOS && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,padding:24 }}
          onClick={e=>e.target===e.currentTarget&&setShowSOS(false)}>
          <motion.div initial={{ opacity:0,scale:0.9 }} animate={{ opacity:1,scale:1 }}
            style={{ background:'rgba(239,68,68,0.1)',border:'2px solid rgba(239,68,68,0.4)',borderRadius:20,padding:40,maxWidth:420,width:'100%',textAlign:'center' }}>
            <div style={{ fontSize:64,marginBottom:16 }}>🆘</div>
            <h2 style={{ color:'#ef4444',fontWeight:800,fontSize:24,marginBottom:8 }}>Emergency Alert</h2>
            <p style={{ color:'var(--text-secondary)',marginBottom:24,fontSize:14 }}>This will immediately notify all team members</p>
            <textarea className="input" style={{ marginBottom:16,resize:'none',border:'1px solid rgba(239,68,68,0.4)' }}
              placeholder="Describe the emergency..." value={sosMsg} onChange={e=>setSosMsg(e.target.value)} rows={3}/>
            <div style={{ display:'flex',gap:10 }}>
              <button className="btn-ghost" style={{ flex:1 }} onClick={()=>setShowSOS(false)}>Cancel</button>
              <button className="btn-danger sos-btn" style={{ flex:1 }} onClick={triggerSOS}>🆘 Send SOS Alert</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
