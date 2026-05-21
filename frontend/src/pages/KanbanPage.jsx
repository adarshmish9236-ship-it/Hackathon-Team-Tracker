// FILE: e:\PROJECTS\DBMS\frontend\src\pages\KanbanPage.jsx
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
  { id:'todo',        label:'Backlog',     color:'#475569', accent:'rgba(71,85,105,0.8)',  emoji:'○' },
  { id:'in_progress', label:'In Progress', color:'#6366f1', accent:'rgba(99,102,241,0.8)', emoji:'◉' },
  { id:'review',      label:'Review',      color:'#f59e0b', accent:'rgba(245,158,11,0.8)', emoji:'◈' },
  { id:'done',        label:'Done',        color:'#10b981', accent:'rgba(16,185,129,0.8)', emoji:'✓' },
  { id:'blocked',     label:'Blocked',     color:'#f43f5e', accent:'rgba(244,63,94,0.8)',  emoji:'✕' },
];

const PRIORITIES = ['low','medium','high','critical'];
const PRIORITY_COLORS = {
  low:      '#10b981',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#f43f5e',
};

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
        next[from] = (next[from] || []).filter(t => t.id !== taskId);
        if (task) {
          next[to] = [...(next[to] || [])];
          if (!next[to].find(t => t.id === taskId)) next[to] = [task, ...next[to]];
        }
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
      next[fromCol] = [...(next[fromCol] || [])];
      if (fromCol !== toCol) {
        next[toCol] = [...(next[toCol] || [])];
      }

      const [moved] = next[fromCol].splice(source.index, 1);
      moved.status = toCol;

      if (fromCol === toCol) {
        next[fromCol].splice(destination.index, 0, moved);
      } else {
        next[toCol].splice(destination.index, 0, moved);
      }
      return next;
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
      next[fromCol] = [...(next[fromCol] || [])];
      next[toCol] = [...(next[toCol] || [])];

      const idx = next[fromCol].findIndex(t => t.id === focusTask.id);
      if (idx > -1) {
        const [moved] = next[fromCol].splice(idx, 1);
        moved.status = toCol;
        next[toCol] = [moved, ...next[toCol]];
      }
      return next;
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
        next[colId] = [...(next[colId] || [])];
        const idx = next[colId].findIndex(t => t.id === task.id);
        if(idx > -1) next[colId][idx] = r.data;
        return next;
      });
      socket?.emit('task-update', { teamId, task: r.data });
      toast.success('Task claimed! Get to work 🚀');
    } catch { toast.error('Failed to claim task'); }
  };

  const totalTasks = Object.values(grouped).flat().length;

  // ── Loading skeleton ──
  if (loading) return (
    <div style={{ display:'flex', gap:20, padding:'0 0 24px' }}>
      {COLS.map(c => (
        <div key={c.id} style={{ flex:'0 0 292px', height:'calc(100vh - 200px)', borderRadius:'var(--r-xl)' }} className="skeleton"/>
      ))}
    </div>
  );

  return (
    <div>
      {/* ── Page Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:'var(--r-md)', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(99,102,241,0.35)' }}>
            <Rocket size={22} color="white"/>
          </div>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.65rem', fontWeight:900, lineHeight:1, letterSpacing:'-0.3px' }}>
              <span className="gradient-text">Kanban</span> Board
            </h1>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>Drag cards to move between stages</div>
          </div>
          <span className="badge badge-indigo" style={{ fontSize:11, padding:'4px 12px' }}>
            {totalTasks} tasks
          </span>
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:'#10b981', display:'inline-block', boxShadow:'0 0 8px #10b981' }}/>
          Live sync active
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
            display: 'flex',
            gap: 20,
            overflowX: 'auto',
            paddingBottom: 24,
            minHeight: 'calc(100vh - 180px)',
            cursor: isDraggingBoard ? 'grabbing' : 'grab',
            scrollBehavior: isDraggingBoard ? 'auto' : 'smooth',
          }}
          className="kanban-scroll-container"
        >
          {COLS.map(col => {
            const colTasks = grouped[col.id] || [];
            return (
              <div
                key={col.id}
                className="glass-hud"
                style={{
                  flex: '0 0 292px',
                  display: 'flex',
                  flexDirection: 'column',
                  background: `rgba(${col.id === 'todo' ? '71,85,105' : col.id === 'in_progress' ? '99,102,241' : col.id === 'review' ? '245,158,11' : col.id === 'done' ? '16,185,129' : '244,63,94'},0.03)`,
                  border: `1px solid ${col.color}25`,
                  borderRadius: 'var(--r-xl)',
                  overflow: 'hidden',
                }}
              >
                {/* Column top accent bar */}
                <div style={{ height:4, background:`linear-gradient(90deg, ${col.color}, ${col.color}80)`, width:'100%', flexShrink:0 }}/>

                {/* Column Header */}
                <div style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'14px 16px',
                  borderBottom:`1px solid ${col.color}18`,
                  background:`${col.color}06`,
                  flexShrink:0,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:15, color:col.color, fontWeight:900 }}>{col.emoji}</span>
                    <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:13, color:'var(--text-primary)', textTransform:'uppercase', letterSpacing:0.8 }}>
                      {col.label}
                    </span>
                    <span style={{
                      background:`${col.color}18`, color:col.color,
                      fontSize:11, padding:'1px 8px', borderRadius:99, fontWeight:800,
                      border:`1px solid ${col.color}30`,
                    }}>
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowForm(showForm === col.id ? null : col.id)}
                    style={{
                      width:26, height:26, borderRadius:'50%',
                      background:`linear-gradient(135deg,${col.color},${col.color}bb)`,
                      border:'none', color:'white', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow:`0 0 12px ${col.color}50`, transition:'transform 0.2s',
                      flexShrink:0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform='scale(1.15) rotate(90deg)'}
                    onMouseLeave={e => e.currentTarget.style.transform='scale(1) rotate(0deg)'}
                  >
                    <Plus size={14}/>
                  </button>
                </div>

                {/* Add Task Form */}
                <AnimatePresence>
                  {showForm === col.id && (
                    <motion.div
                      initial={{ opacity:0, height:0 }}
                      animate={{ opacity:1, height:'auto' }}
                      exit={{ opacity:0, height:0 }}
                      style={{ overflow:'hidden', flexShrink:0 }}
                    >
                      <div className="glass-card" style={{ margin:'10px 12px 0', padding:14, borderRadius:'var(--r-md)', border:`1px solid ${col.color}30` }}>
                        <input
                          className="input"
                          style={{ marginBottom:8, fontSize:13 }}
                          placeholder="Task title..."
                          value={newTask.title}
                          onChange={e => setNewTask({...newTask, title:e.target.value})}
                          onKeyDown={e => e.key==='Enter' && createTask(col.id)}
                          autoFocus
                        />
                        <select
                          className="input"
                          style={{ marginBottom:8, fontSize:13 }}
                          value={newTask.priority}
                          onChange={e => setNewTask({...newTask, priority:e.target.value})}
                        >
                          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                        </select>
                        <select
                          className="input"
                          style={{ marginBottom:8, fontSize:13 }}
                          value={newTask.assigned_to}
                          onChange={e => setNewTask({...newTask, assigned_to:e.target.value})}
                        >
                          <option value="">Unassigned</option>
                          {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                        </select>
                        <input
                          className="input"
                          style={{ marginBottom:10, fontSize:12 }}
                          type="date"
                          value={newTask.due_date}
                          onChange={e => setNewTask({...newTask, due_date:e.target.value})}
                        />
                        <div style={{ display:'flex', gap:8 }}>
                          <button
                            className="btn-primary"
                            style={{ flex:1, padding:'7px', fontSize:12, justifyContent:'center', background:`linear-gradient(135deg,${col.color},${col.color}bb)`, boxShadow:`0 4px 14px ${col.color}40` }}
                            onClick={() => createTask(col.id)}
                          >
                            Add Task
                          </button>
                          <button className="btn-ghost" style={{ padding:'7px 10px', fontSize:12 }} onClick={() => setShowForm(null)}>
                            <X size={14}/>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Droppable Column */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        flex:1,
                        padding:'12px 12px 16px',
                        display:'flex',
                        flexDirection:'column',
                        gap:10,
                        background: snapshot.isDraggingOver ? `${col.color}08` : 'transparent',
                        transition:'background 0.2s',
                        minHeight:80,
                      }}
                    >
                      <AnimatePresence>
                        {colTasks.map((task, idx) => {
                          const prioColor = PRIORITY_COLORS[task.priority] || '#475569';
                          const xpReward = task.xp_reward || 10;
                          return (
                            <Draggable key={String(task.id)} draggableId={String(task.id)} index={idx}>
                              {(prov, snap) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  style={{
                                    ...prov.draggableProps.style,
                                    marginBottom: 0,
                                  }}
                                >
                                  <motion.div
                                    initial={{ opacity:0, y:10 }}
                                    animate={{ opacity:1, y:0 }}
                                    exit={{ opacity:0, scale:0.9 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className="glass-card"
                                    style={{
                                      padding: 0,
                                      overflow: 'hidden',
                                      cursor: 'grab',
                                      position: 'relative',
                                      borderLeft: `3px solid ${prioColor}`,
                                      boxShadow: snap.isDragging
                                        ? `0 20px 48px rgba(0,0,0,0.5), 0 0 24px ${col.color}30`
                                        : '0 4px 12px rgba(0,0,0,0.12)',
                                      transform: snap.isDragging ? 'rotate(2deg) scale(1.03)' : 'none',
                                      transition: snap.isDragging ? 'none' : 'box-shadow 0.2s, transform 0.2s',
                                    }}
                                  >
                                    {/* Priority accent top bar */}
                                    <div style={{ height:3, background:`linear-gradient(90deg,${prioColor},${prioColor}60)`, width:'100%' }}/>

                                    <div style={{ padding:'12px 14px' }}>
                                      {/* Title row */}
                                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, gap:6 }}>
                                        <p style={{ fontSize:13, fontWeight:700, flex:1, lineHeight:1.4, color:'var(--text-primary)', fontFamily:'var(--font-sans)' }}>
                                          {task.title}
                                        </p>
                                        <button
                                          onClick={() => deleteTask(col.id, task.id)}
                                          style={{
                                            background:'none', border:'none', color:'var(--text-muted)',
                                            cursor:'pointer', padding:2, flexShrink:0, transition:'color 0.2s',
                                            lineHeight:1,
                                          }}
                                          onMouseEnter={e => e.currentTarget.style.color='#f43f5e'}
                                          onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}
                                        >
                                          <X size={13}/>
                                        </button>
                                      </div>

                                      {/* Tags row */}
                                      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                                        <span style={{
                                          fontSize:9, color:prioColor, background:`${prioColor}18`,
                                          padding:'2px 7px', borderRadius:6, fontWeight:800,
                                          display:'flex', alignItems:'center', gap:3, textTransform:'uppercase', letterSpacing:0.5,
                                        }}>
                                          <Flag size={9}/>{task.priority}
                                        </span>
                                        <span style={{
                                          fontSize:9, color:'#f59e0b', background:'rgba(245,158,11,0.12)',
                                          padding:'2px 7px', borderRadius:6, fontWeight:800,
                                          display:'flex', alignItems:'center', gap:3,
                                        }}>
                                          <Zap size={9} fill="#f59e0b"/>{xpReward} XP
                                        </span>
                                        {task.status !== 'done' && (
                                          <button
                                            onClick={() => startFocus(task)}
                                            title="Enter Focus Mode"
                                            style={{
                                              marginLeft:'auto',
                                              background:'rgba(99,102,241,0.1)',
                                              border:'1px solid rgba(99,102,241,0.3)',
                                              color:'var(--indigo)', cursor:'pointer',
                                              padding:'2px 8px', borderRadius:6, fontSize:9,
                                              fontWeight:800, display:'flex', alignItems:'center', gap:3,
                                              transition:'all 0.2s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background='var(--indigo)'; e.currentTarget.style.color='white'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background='rgba(99,102,241,0.1)'; e.currentTarget.style.color='var(--indigo)'; }}
                                          >
                                            <Target size={10}/> Focus
                                          </button>
                                        )}
                                      </div>

                                      {/* Bottom row: assignee + due date */}
                                      <div style={{
                                        display:'flex', alignItems:'center', justifyContent:'space-between',
                                        borderTop:'1px solid var(--border-glass)', paddingTop:9, marginTop:2,
                                      }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                          {task.assignee_name ? (
                                            <>
                                              <div style={{
                                                width:22, height:22, borderRadius:'50%',
                                                background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                                display:'flex', alignItems:'center', justifyContent:'center',
                                                fontSize:9, fontWeight:800, color:'white', flexShrink:0,
                                              }}>
                                                {task.assignee_name[0]}
                                              </div>
                                              <span style={{ fontSize:10, color:'var(--text-secondary)', fontWeight:600 }}>
                                                {task.assignee_name.split(' ')[0]}
                                              </span>
                                            </>
                                          ) : (
                                            <button
                                              onClick={() => quickAssignToMe(col.id, task)}
                                              style={{
                                                background:'rgba(99,102,241,0.1)',
                                                border:'1px solid rgba(99,102,241,0.3)',
                                                color:'var(--indigo)', padding:'2px 8px', borderRadius:6,
                                                fontSize:9, fontWeight:700, cursor:'pointer',
                                                display:'flex', alignItems:'center', gap:3, transition:'0.2s',
                                              }}
                                              onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,0.2)'}
                                              onMouseLeave={e => e.currentTarget.style.background='rgba(99,102,241,0.1)'}
                                            >
                                              <User size={9}/> Claim Task
                                            </button>
                                          )}
                                        </div>
                                        {task.due_date && (
                                          <span style={{ fontSize:9, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:3, fontWeight:600 }}>
                                            <Calendar size={9}/>
                                            {new Date(task.due_date).toLocaleDateString(undefined, {month:'short',day:'numeric'})}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                      </AnimatePresence>
                      {provided.placeholder}

                      {/* Empty state */}
                      {colTasks.length === 0 && (
                        <div style={{
                          textAlign:'center', padding:'32px 12px',
                          border:`1px dashed ${col.color}25`, borderRadius:'var(--r-lg)',
                          color:'var(--text-muted)', fontSize:12, marginTop:4,
                        }}>
                          <div style={{ fontSize:24, marginBottom:8, opacity:0.5, color:col.color }}>{col.emoji}</div>
                          <div style={{ fontWeight:600, color:`${col.color}bb` }}>Drop tasks here</div>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* ── Focus Mode Overlay ── */}
      <AnimatePresence>
        {focusTask && (
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.3 }}
            className="bg-dot-grid"
            style={{
              position:'fixed', inset:0, zIndex:9999,
              background:'rgba(2,4,8,0.97)',
              backdropFilter:'blur(40px)',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              color:'white',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => { setFocusTask(null); setTimerActive(false); }}
              style={{
                position:'absolute', top:32, right:32, background:'rgba(255,255,255,0.06)',
                border:'1px solid rgba(255,255,255,0.12)', color:'var(--text-muted)',
                cursor:'pointer', padding:10, borderRadius:'var(--r-md)',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(244,63,94,0.15)'; e.currentTarget.style.color='#f43f5e'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='var(--text-muted)'; }}
            >
              <X size={24}/>
            </button>

            <motion.div
              initial={{ scale:0.9, y:24 }}
              animate={{ scale:1, y:0 }}
              transition={{ type:'spring', stiffness:280, damping:24 }}
              style={{ textAlign:'center', maxWidth:860, padding:'0 24px', position:'relative', zIndex:1 }}
            >
              {/* Deep Work badge */}
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', color:'#f59e0b', padding:'7px 20px', borderRadius:99, fontWeight:800, letterSpacing:2, textTransform:'uppercase', marginBottom:32, fontSize:12 }}>
                <Target size={15}/> Deep Work Session
              </div>

              {/* Task title */}
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'2.8rem', fontWeight:900, marginBottom:14, lineHeight:1.15 }}>
                {focusTask.title}
              </h2>

              {/* XP + priority meta */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:20, color:'var(--text-muted)', fontSize:16, marginBottom:48, flexWrap:'wrap' }}>
                <span style={{ display:'flex', alignItems:'center', gap:7, color:'#f59e0b' }}>
                  <Zap size={18} fill="#f59e0b" color="#f59e0b"/>
                  {focusTask.xp_reward || 10} XP Reward
                </span>
                <span style={{ color:'rgba(255,255,255,0.15)' }}>•</span>
                <span style={{ display:'flex', alignItems:'center', gap:7, color: PRIORITY_COLORS[focusTask.priority] }}>
                  <Flag size={18} color={PRIORITY_COLORS[focusTask.priority]}/>
                  {focusTask.priority}
                </span>
              </div>

              {/* Pulsing SVG ring + Timer */}
              <div style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:52 }}>
                {/* Outer animated ring */}
                <svg viewBox="0 0 260 260" width={260} height={260} style={{ position:'absolute', inset:0 }}>
                  <defs>
                    <linearGradient id="focusGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop stopColor="#6366f1"/>
                      <stop offset="1" stopColor="#06b6d4"/>
                    </linearGradient>
                  </defs>
                  {/* Subtle track */}
                  <circle cx="130" cy="130" r="120" fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="2"/>
                  {/* Animated progress ring based on timer */}
                  <circle
                    cx="130" cy="130" r="120" fill="none"
                    stroke="url(#focusGrad)"
                    strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    strokeDashoffset={2 * Math.PI * 120 * (1 - timeLeft / (25 * 60))}
                    strokeLinecap="round"
                    transform="rotate(-90 130 130)"
                    style={{ transition: timerActive ? 'stroke-dashoffset 1s linear' : 'none', filter:'drop-shadow(0 0 8px rgba(99,102,241,0.6))' }}
                  />
                  {/* Second decorative ring */}
                  <circle cx="130" cy="130" r="108" fill="none" stroke="rgba(6,182,212,0.06)" strokeWidth="1"/>
                </svg>

                {/* Timer */}
                <div style={{
                  fontFamily:'var(--font-mono)',
                  fontSize:'9rem',
                  fontWeight:800,
                  letterSpacing:-6,
                  lineHeight:1,
                  background:'linear-gradient(135deg,#6366f1,#06b6d4)',
                  WebkitBackgroundClip:'text',
                  WebkitTextFillColor:'transparent',
                  filter:'drop-shadow(0 0 30px rgba(99,102,241,0.4))',
                  userSelect:'none',
                }}>
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* Controls */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:24, flexWrap:'wrap' }}>
                <button
                  onClick={() => setTimerActive(!timerActive)}
                  style={{
                    width:72, height:72, borderRadius:'50%',
                    background:'rgba(99,102,241,0.1)',
                    border:'1px solid rgba(99,102,241,0.3)',
                    color:'white', display:'flex', alignItems:'center', justifyContent:'center',
                    cursor:'pointer', transition:'all 0.2s',
                    boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.25)'; e.currentTarget.style.boxShadow='0 0 24px rgba(99,102,241,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(99,102,241,0.1)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.4)'; }}
                >
                  {timerActive ? <Pause size={30}/> : <Play size={30} style={{ marginLeft:4 }}/>}
                </button>

                <button
                  onClick={completeFocusTask}
                  style={{
                    height:72, padding:'0 44px', borderRadius:36,
                    background:'linear-gradient(135deg,#10b981,#059669)',
                    border:'none', color:'white', fontSize:18, fontWeight:800,
                    cursor:'pointer', display:'flex', alignItems:'center', gap:12,
                    boxShadow:'0 0 40px rgba(16,185,129,0.45)', transition:'all 0.2s',
                    fontFamily:'var(--font-display)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform='scale(1.04)'; e.currentTarget.style.boxShadow='0 0 56px rgba(16,185,129,0.6)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 0 40px rgba(16,185,129,0.45)'; }}
                >
                  <CheckCircle2 size={26}/> Complete &amp; Claim XP
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
