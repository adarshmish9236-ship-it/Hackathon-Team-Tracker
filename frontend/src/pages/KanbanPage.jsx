// src/pages/KanbanPage.jsx — Full drag-and-drop Kanban board
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { taskAPI, teamAPI } from '../api/axios';
import { useStore } from '../store/useStore';
import { useSocket } from '../hooks/useSocket';
import { Plus, X, Calendar, User, Flag, Zap, Rocket, Target, Play, Pause, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const COLS = [
  { id:'todo',        label:'📋 To Do',      color:'var(--text-muted)' },
  { id:'in_progress', label:'⚡ In Progress', color:'var(--accent-blue)' },
  { id:'review',      label:'👀 Review',      color:'var(--accent-yellow)' },
  { id:'done',        label:'✅ Done',         color:'var(--accent-green)' },
  { id:'blocked',     label:'🚫 Blocked',     color:'#ef4444' },
];

const PRIORITIES = ['low','medium','high','critical'];
const PRIORITY_COLORS = { low:'var(--accent-green)',medium:'var(--accent-yellow)',high:'#f97316',critical:'#ef4444' };

export default function KanbanPage() {
  const { id: teamId } = useParams();
  const [grouped, setGrouped]   = useState({ todo:[],in_progress:[],review:[],done:[],blocked:[] });
  const [members, setMembers]   = useState([]);
  const [showForm, setShowForm] = useState(null); // column id
  const [newTask, setNewTask]   = useState({ title:'',priority:'medium',assigned_to:'',due_date:'' });
  const [loading, setLoading]   = useState(true);
  
  // Board Scrolling State
  const scrollRef = useRef(null);
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Focus Mode State
  const [focusTask, setFocusTask] = useState(null);
  const [timeLeft, setTimeLeft]   = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);

  const socket = useSocket();
  const { user, hackathonMode, triggerXPBurst } = useStore();

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const startFocus = (task) => {
    setFocusTask(task);
    setTimeLeft(25 * 60);
    setTimerActive(true);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const load = useCallback(async () => {
    const [tasks, team] = await Promise.all([
      taskAPI.getAll(teamId),
      teamAPI.getTeam(teamId),
    ]);
    setGrouped(tasks.data.grouped);
    setMembers(team.data.members);
    setLoading(false);
  }, [teamId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!socket) return;
    socket.on('task-moved', ({ taskId, from, to, task }) => {
      setGrouped(prev => {
        const next = { ...prev };
        next[from] = next[from].filter(t => t.id !== taskId);
        if (task && !next[to].find(t => t.id === taskId)) next[to] = [task, ...next[to]];
        return next;
      });
    });
    return () => socket.off('task-moved');
  }, [socket]);

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const taskId = parseInt(draggableId);
    const fromCol = source.droppableId;
    const toCol   = destination.droppableId;

    // Optimistic update
    setGrouped(prev => {
      const next = { ...prev };
      const [moved] = next[fromCol].splice(source.index, 1);
      moved.status = toCol;
      next[toCol].splice(destination.index, 0, moved);
      return { ...next };
    });

    try {
      const r = await taskAPI.move(teamId, taskId, toCol);
      socket?.emit('task-move', { teamId, taskId, from: fromCol, to: toCol, task: r.data });
      if (toCol === 'done') triggerXPBurst(r.data.xp_reward || 10);
    } catch {
      toast.error('Failed to move task');
      load();
    }
  };

  const completeFocusTask = async () => {
    if (!focusTask) return;
    const fromCol = focusTask.status;
    const toCol = 'done';
    
    // Optimistic UI update
    setGrouped(prev => {
      const next = { ...prev };
      const idx = next[fromCol].findIndex(t => t.id === focusTask.id);
      if (idx > -1) {
        const [moved] = next[fromCol].splice(idx, 1);
        moved.status = toCol;
        next[toCol] = [moved, ...next[toCol]];
      }
      return { ...next };
    });

    try {
      const r = await taskAPI.move(teamId, focusTask.id, toCol);
      socket?.emit('task-move', { teamId, taskId: focusTask.id, from: fromCol, to: toCol, task: r.data });
      triggerXPBurst(r.data.xp_reward || 10);
      toast.success('Task demolished! XP Awarded 🚀');
    } catch {
      toast.error('Failed to move task');
      load();
    }
    setFocusTask(null);
    setTimerActive(false);
  };

  // Board Drag to Scroll Handlers
  const handleBoardDragStart = (e) => {
    if (!scrollRef.current) return;
    // Prevent dragging if interacting with a card (which has its own drag system), button, or input
    if (e.target.closest('.glass-card') || e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
    
    setIsDraggingBoard(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleBoardDragEnd = () => setIsDraggingBoard(false);

  const handleBoardDragMove = (e) => {
    if (!isDraggingBoard || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleBoardWheel = (e) => {
    if (scrollRef.current && e.deltaY !== 0 && !e.shiftKey) {
      // Scroll horizontally instead of vertically
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const createTask = async (colId) => {
    if (!newTask.title.trim()) return toast.error('Title required');
    try {
      const r = await taskAPI.create(teamId, {
        ...newTask, status: colId,
        assigned_to: newTask.assigned_to || null,
      });
      setGrouped(prev => ({ ...prev, [colId]: [r.data, ...prev[colId]] }));
      socket?.emit('task-update', { teamId, task: r.data });
      setNewTask({ title:'',priority:'medium',assigned_to:'',due_date:'' });
      setShowForm(null);
      toast.success('Task created! ✅');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const deleteTask = async (colId, taskId) => {
    await taskAPI.delete(teamId, taskId);
    setGrouped(prev => ({ ...prev, [colId]: prev[colId].filter(t => t.id !== taskId) }));
    toast.success('Task deleted');
  };

  const quickAssignToMe = async (colId, task) => {
    try {
      const r = await taskAPI.update(teamId, task.id, { assigned_to: user.id });
      setGrouped(prev => {
        const next = { ...prev };
        const idx = next[colId].findIndex(t => t.id === task.id);
        if(idx > -1) next[colId][idx] = r.data;
        return { ...next };
      });
      socket?.emit('task-update', { teamId, task: r.data });
      toast.success('Task claimed! Get to work 🚀');
    } catch { toast.error('Failed to claim task'); }
  };

  if (loading) return (
    <div style={{ display:'flex',gap:20 }}>
      {COLS.map(c => (
        <div key={c.id} style={{ flex:'0 0 260px',height:400 }} className="skeleton"/>
      ))}
    </div>
  );

  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24 }}>
        <h1 style={{ fontFamily:"'Space Grotesk',sans-serif",fontSize:'1.5rem',fontWeight:700 }}>
          🗂 Kanban Board
        </h1>
        <div style={{ fontSize:13,color:'var(--text-muted)' }}>
          {Object.values(grouped).flat().length} total tasks · Drag to move
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div 
          ref={scrollRef}
          onMouseDown={handleBoardDragStart}
          onMouseLeave={handleBoardDragEnd}
          onMouseUp={handleBoardDragEnd}
          onMouseMove={handleBoardDragMove}
          onWheel={handleBoardWheel}
          style={{ 
            display:'flex', gap:20, overflowX:'auto', paddingBottom:24, minHeight: 'calc(100vh - 200px)',
            cursor: isDraggingBoard ? 'grabbing' : 'grab',
            scrollBehavior: isDraggingBoard ? 'auto' : 'smooth'
          }}
          className="kanban-scroll-container"
        >
          {COLS.map(col => (
            <div key={col.id} className="glass-hud" style={{ flex:'0 0 280px', display:'flex', flexDirection:'column', background: hackathonMode ? 'rgba(8,15,31,0.6)' : 'var(--bg-secondary)', border: hackathonMode ? `1px solid ${col.color}40` : '1px solid var(--border-glass)' }}>
              {/* Column Header */}
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px', borderBottom: '1px solid var(--border-glass)', background: hackathonMode ? `${col.color}10` : 'transparent' }}>
                <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <span style={{ fontWeight:800,fontSize:14,color:col.color,textTransform:'uppercase',letterSpacing:1 }}>{col.label}</span>
                  <span style={{ background:'var(--bg-glass)',color:'var(--text-primary)',fontSize:11,padding:'2px 8px',borderRadius:99,fontWeight:700, border: '1px solid var(--border-glass)' }}>
                    {grouped[col.id]?.length || 0}
                  </span>
                </div>
                <button onClick={() => setShowForm(col.id)}
                  style={{ background:'var(--accent-blue)',border:'none',color:'white',cursor:'pointer',width:24,height:24,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,boxShadow:'0 0 10px rgba(79,142,247,0.4)',transition:'transform 0.2s' }}
                  onMouseEnter={e=>e.target.style.transform='scale(1.1)'} onMouseLeave={e=>e.target.style.transform='scale(1)'}>
                  +
                </button>
              </div>

              {/* Add Task Form */}
              <AnimatePresence>
                {showForm === col.id && (
                  <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }} exit={{ opacity:0,height:0 }}
                    className="glass-card" style={{ padding:12,marginBottom:10,overflow:'hidden' }}>
                    <input className="input" style={{ marginBottom:8,fontSize:13 }} placeholder="Task title..."
                      value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})}
                      onKeyDown={e=>e.key==='Enter'&&createTask(col.id)} autoFocus/>
                    <select className="input" style={{ marginBottom:8,fontSize:13 }} value={newTask.priority}
                      onChange={e=>setNewTask({...newTask,priority:e.target.value})}>
                      {PRIORITIES.map(p=><option key={p}>{p}</option>)}
                    </select>
                    <select className="input" style={{ marginBottom:8,fontSize:13 }} value={newTask.assigned_to}
                      onChange={e=>setNewTask({...newTask,assigned_to:e.target.value})}>
                      <option value="">Unassigned</option>
                      {members.map(m=><option key={m.id} value={m.id}>{m.full_name}</option>)}
                    </select>
                    <input className="input" style={{ marginBottom:8,fontSize:12 }} type="date" value={newTask.due_date}
                      onChange={e=>setNewTask({...newTask,due_date:e.target.value})}/>
                    <div style={{ display:'flex',gap:8 }}>
                      <button className="btn-primary" style={{ flex:1,padding:'6px',fontSize:12,justifyContent:'center' }} onClick={()=>createTask(col.id)}>Add</button>
                      <button className="btn-ghost" style={{ padding:'6px 10px',fontSize:12 }} onClick={()=>setShowForm(null)}><X size={14}/></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Droppable Column */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    style={{
                      flex:1,padding:16,display:'flex',flexDirection:'column',gap:12,
                      background: snapshot.isDraggingOver ? 'rgba(79,142,247,0.05)' : 'transparent',
                      transition:'all 0.2s',
                    }}>
                    <AnimatePresence>
                      {grouped[col.id]?.map((task, idx) => {
                        const isCritical = task.priority === 'critical';
                        const xpReward = task.xp_reward || 10;
                        return (
                        <Draggable key={String(task.id)} draggableId={String(task.id)} index={idx}>
                          {(prov, snap) => (
                            <motion.div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                              initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,scale:0.9 }}
                              className="glass-card" style={{
                                padding:0, overflow:'hidden', cursor:'grab', position: 'relative',
                                background: 'var(--bg-card)',
                                border: isCritical ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border-glass)',
                                boxShadow: snap.isDragging ? '0 16px 40px rgba(0,0,0,0.4)' : isCritical ? '0 0 10px rgba(239,68,68,0.2)' : '0 4px 12px rgba(0,0,0,0.1)',
                                transform: snap.isDragging ? 'rotate(3deg) scale(1.02)' : 'none',
                                ...prov.draggableProps.style,
                              }}>
                              
                              {/* Critical Priority Top Bar */}
                              {isCritical && <div style={{ height:4,background:'linear-gradient(90deg,#ef4444,#f97316)',width:'100%' }}/>}
                              
                              <div style={{ padding:16 }}>
                                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12 }}>
                                  <p style={{ fontSize:14,fontWeight:700,flex:1,lineHeight:1.4, color:'var(--text-primary)' }}>{task.title}</p>
                                  <button onClick={()=>deleteTask(col.id,task.id)}
                                    style={{ background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',padding:2,flexShrink:0,transition:'color 0.2s' }}
                                    onMouseEnter={e=>e.target.style.color='#ef4444'} onMouseLeave={e=>e.target.style.color='var(--text-muted)'}>
                                    <X size={14}/>
                                  </button>
                                </div>
                                
                                <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:12 }}>
                                  <span style={{ fontSize:10,color:PRIORITY_COLORS[task.priority],background:`${PRIORITY_COLORS[task.priority]}15`,padding:'2px 8px',borderRadius:6,fontWeight:700,display:'flex',alignItems:'center',gap:4,textTransform:'uppercase' }}>
                                    <Flag size={10}/>{task.priority}
                                  </span>
                                  <span style={{ fontSize:10,color:'var(--accent-yellow)',background:'rgba(245,158,11,0.1)',padding:'2px 8px',borderRadius:6,fontWeight:700,display:'flex',alignItems:'center',gap:4 }}>
                                    <Zap size={10} fill="var(--accent-yellow)"/> {xpReward} XP
                                  </span>
                                  {task.status !== 'done' && (
                                    <button onClick={() => startFocus(task)} title="Enter Focus Mode"
                                      style={{ marginLeft:'auto',background:'rgba(79,142,247,0.1)',border:'1px solid rgba(79,142,247,0.3)',color:'var(--accent-blue)',cursor:'pointer',padding:'3px 8px',borderRadius:6,fontSize:10,fontWeight:700,display:'flex',alignItems:'center',gap:4,transition:'0.2s' }}
                                      onMouseEnter={e=>{e.target.style.background='var(--accent-blue)';e.target.style.color='white';}} onMouseLeave={e=>{e.target.style.background='rgba(79,142,247,0.1)';e.target.style.color='var(--accent-blue)';}}>
                                      <Target size={12}/> Focus
                                    </button>
                                  )}
                                </div>
                                
                                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:'1px solid var(--border-glass)',paddingTop:12,marginTop:4 }}>
                                  <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                                    {task.assignee_name ? (
                                      <>
                                        <div style={{ width:20,height:20,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'white' }}>
                                          {task.assignee_name[0]}
                                        </div>
                                        <span style={{ fontSize:11,color:'var(--text-secondary)',fontWeight:500 }}>{task.assignee_name.split(' ')[0]}</span>
                                      </>
                                    ) : (
                                      <button onClick={() => quickAssignToMe(col.id, task)} style={{ background:'rgba(79,142,247,0.1)',border:'1px solid rgba(79,142,247,0.3)',color:'var(--accent-blue)',padding:'3px 8px',borderRadius:6,fontSize:10,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4,transition:'0.2s' }}
                                        onMouseEnter={e=>e.target.style.background='var(--accent-blue)'} onMouseLeave={e=>e.target.style.background='rgba(79,142,247,0.1)'}>
                                        <User size={10}/> Claim Task
                                      </button>
                                    )}
                                  </div>
                                  
                                  {task.due_date && (
                                    <span style={{ fontSize:10,color:'var(--text-muted)',display:'flex',alignItems:'center',gap:4,fontWeight:500 }}>
                                      <Calendar size={10}/>{new Date(task.due_date).toLocaleDateString(undefined, {month:'short',day:'numeric'})}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </Draggable>
                        );
                      })}
                    </AnimatePresence>
                    {provided.placeholder}
                    {grouped[col.id]?.length === 0 && (
                      <div style={{ textAlign:'center',padding:'24px 0',color:'var(--text-muted)',fontSize:13 }}>
                        Drop tasks here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {focusTask && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5, 8, 15, 0.98)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            
            <button onClick={() => { setFocusTask(null); setTimerActive(false); }} style={{ position: 'absolute', top: 32, right: 32, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 8 }}>
              <X size={32} />
            </button>

            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ textAlign: 'center', maxWidth: 800, padding: 20 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--accent-yellow)', padding: '6px 16px', borderRadius: 99, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 32 }}>
                <Target size={16} /> Deep Work Session
              </div>
              
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '3rem', fontWeight: 900, marginBottom: 16, lineHeight: 1.2, textShadow: '0 0 40px rgba(79,142,247,0.4)' }}>
                {focusTask.title}
              </h2>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'var(--text-muted)', fontSize: 18, marginBottom: 48 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={18} fill="var(--accent-yellow)" color="var(--accent-yellow)"/> {focusTask.xp_reward || 10} XP Reward</span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Flag size={18} color={PRIORITY_COLORS[focusTask.priority]}/> {focusTask.priority}</span>
              </div>

              {/* Huge Timer */}
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10rem', fontWeight: 800, letterSpacing: -5, lineHeight: 1, marginBottom: 48, background: 'linear-gradient(180deg, #fff, #4f8ef7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 30px rgba(79,142,247,0.3))' }}>
                {formatTime(timeLeft)}
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                <button onClick={() => setTimerActive(!timerActive)}
                  style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.05)'}>
                  {timerActive ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: 4 }} />}
                </button>

                <button onClick={completeFocusTask}
                  style={{ height: 80, padding: '0 48px', borderRadius: 40, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', fontSize: 20, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 0 40px rgba(16,185,129,0.4)', transition: '0.2s' }}
                  onMouseEnter={e => e.target.style.transform = 'scale(1.05)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
                  <CheckCircle2 size={28} /> Complete & Claim XP
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
