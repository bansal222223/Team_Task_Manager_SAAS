import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee_id: '',
    due_date: '',
    reminder_date: '',
    project_id: ''
  });
  
  const [tempSubtasks, setTempSubtasks] = useState([]);
  const [newTempSubtask, setNewTempSubtask] = useState('');
  const [showChecklistInput, setShowChecklistInput] = useState(false);
  const [showReminderInput, setShowReminderInput] = useState(false);
  
  const [tempFiles, setTempFiles] = useState([]);
  const fileInputRef = useRef(null);
  const detailFileInputRef = useRef(null);

  const [isCreating, setIsCreating] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  
  const { user } = useAuth();

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchUsers();
  }, [page]);

  const fetchTasks = async () => {
    const token = localStorage.getItem('token');
    const skip = (page - 1) * limit;
    const res = await fetch(`/tasks/?skip=${skip}&limit=${limit}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setTasks(data.items);
      setTotal(data.total);
      
      // Update selected task if it is currently selected
      if (selectedTask) {
        const updatedSelected = data.items.find(t => t.id === selectedTask.id);
        if (updatedSelected) setSelectedTask(updatedSelected);
      }
    }
  };

  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/projects/?skip=0&limit=100', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setProjects(data.items);
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/users/', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setUsers(await res.json());
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setIsCreating(true);

    const token = localStorage.getItem('token');
    const projectId = newTask.project_id || (projects?.length > 0 ? projects[0].id : 1);
    const assigneeId = newTask.assignee_id || user.id;

    const payload = {
      title: newTask.title,
      description: newTask.description || null,
      project_id: parseInt(projectId),
      assignee_id: parseInt(assigneeId),
      priority: 'medium',
      due_date: (newTask.due_date && !isNaN(new Date(newTask.due_date).getTime())) ? new Date(newTask.due_date).toISOString() : null,
      reminder_date: (newTask.reminder_date && !isNaN(new Date(newTask.reminder_date).getTime())) ? new Date(newTask.reminder_date).toISOString() : null
    };

    try {
      const res = await fetch('/tasks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const createdTask = await res.json();
        
        // Upload temp subtasks
        for (const st of tempSubtasks) {
          await fetch(`/tasks/${createdTask.id}/subtasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title: st.title, is_completed: st.is_completed })
          });
        }

        // Upload temp files
        for (const file of tempFiles) {
          const formData = new FormData();
          formData.append('file', file);
          await fetch(`/tasks/${createdTask.id}/attachments`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
        }

        setNewTask({ title: '', description: '', assignee_id: '', due_date: '', reminder_date: '', project_id: '' });
        setTempSubtasks([]);
        setTempFiles([]);
        setShowAddModal(false);
        setShowChecklistInput(false);
        setShowReminderInput(false);
        fetchTasks();
      } else {
        const errorText = await res.text();
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || JSON.stringify(errorJson);
        } catch (e) {
          // Not JSON
        }
        alert('Server Error (' + res.status + '): ' + errorMessage);
      }
    } catch (err) {
      console.error('Network or App Error:', err);
      alert('Error: Could not connect to server or application crashed. ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const updateTaskDetails = async (taskId, updates) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      fetchTasks();
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/tasks/${taskId}/status?status_update=${newStatus}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) fetchTasks();
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      fetchTasks();
      setSelectedTask(null);
    }
  };

  // Subtask Management (Detail Pane)
  const handleAddSubtaskDetail = async (e, taskId) => {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
      const token = localStorage.getItem('token');
      await fetch(`/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: e.target.value, is_completed: false })
      });
      e.target.value = '';
      fetchTasks();
    }
  };

  const handleToggleSubtaskDetail = async (subtaskId) => {
    const token = localStorage.getItem('token');
    await fetch(`/subtasks/${subtaskId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchTasks();
  };

  const handleDeleteSubtaskDetail = async (subtaskId) => {
    const token = localStorage.getItem('token');
    await fetch(`/subtasks/${subtaskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchTasks();
  };

  // File Upload Management (Detail Pane)
  const handleFileUploadDetail = async (e, taskId) => {
    const files = e.target.files;
    if (!files.length) return;
    
    const token = localStorage.getItem('token');
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);
      await fetch(`/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
    }
    fetchTasks();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="split-pane">
      {/* Left List Pane */}
      <div className="list-pane">
        <div className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>All Tasks</h2>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add Task</button>
        </div>
        
        <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ borderTop: '1px solid var(--border-color)', flex: 1 }}>
            {tasks?.map(task => (
              <div 
                key={task.id} 
                onClick={() => setSelectedTask(task)}
                style={{ 
                  padding: '12px 16px', 
                  borderBottom: '1px solid var(--border-color)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  cursor: 'pointer', 
                  background: selectedTask?.id === task.id ? 'var(--hover-bg)' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '16px', height: '16px', borderRadius: '50%', 
                    border: `1px solid ${task.status === 'completed' ? 'var(--success)' : 'var(--text-muted)'}`,
                    background: task.status === 'completed' ? 'var(--success)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {task.status === 'completed' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ 
                      fontSize: '14px', 
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                      color: task.status === 'completed' ? 'var(--text-muted)' : 'white'
                    }}>
                      {task.title}
                    </span>
                    {(task.attachments?.length > 0 || task.subtasks?.length > 0) && (
                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {task.subtasks?.length > 0 && <span>{task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length} Checklists</span>}
                        {task.attachments?.length > 0 && <span>{task.attachments.length} Files</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`badge ${task.priority === 'high' ? 'badge-red' : task.priority === 'medium' ? 'badge-blue' : 'badge-green'}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
             <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Showing {tasks?.length || 0} of {total}</span>
             <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  className="btn-secondary" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ padding: '4px 8px' }}
                >
                  Prev
                </button>
                <span style={{ fontSize: '12px', margin: '0 4px' }}>Page {page} of {totalPages}</span>
                <button 
                  className="btn-secondary" 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '4px 8px' }}
                >
                  Next
                </button>
             </div>
          </div>
          
        </div>
      </div>

      {/* Right Detail Pane */}
      {selectedTask && (
        <div className="detail-pane fade-in">
          <div className="topbar" style={{ background: 'var(--bg-sidebar)' }}>
            <button 
              className="btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: selectedTask.status === 'completed' ? 'var(--success)' : 'inherit' }}
              onClick={() => updateStatus(selectedTask.id, selectedTask.status === 'completed' ? 'todo' : 'completed')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Mark Complete
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
               {user.role === 'admin' && (
                  <button onClick={() => deleteTask(selectedTask.id)} style={{ color: 'var(--text-muted)' }} title="Delete Task">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
               )}
               <button onClick={() => setSelectedTask(null)} style={{ color: 'var(--text-muted)' }}>
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
               </button>
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            <input 
              className="input-minimal" 
              style={{ fontSize: '22px', fontWeight: 600, paddingLeft: 0, marginBottom: '24px' }} 
              value={selectedTask.title} 
              onChange={(e) => updateTaskDetails(selectedTask.id, { title: e.target.value })}
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                 <span style={{ width: '120px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                   Status
                 </span>
                 <select 
                    className="input-minimal" 
                    value={selectedTask.status}
                    onChange={(e) => updateStatus(selectedTask.id, e.target.value)}
                    style={{ flex: 1, padding: '4px', border: '1px solid var(--border-color)' }}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                 </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                 <span style={{ width: '120px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                   Priority
                 </span>
                 <select 
                    className="input-minimal" 
                    value={selectedTask.priority}
                    onChange={(e) => updateTaskDetails(selectedTask.id, { priority: e.target.value })}
                    style={{ flex: 1, padding: '4px', border: '1px solid var(--border-color)' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                 </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                 <span style={{ width: '120px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                   Project
                 </span>
                 <select 
                    className="input-minimal" 
                    value={selectedTask.project_id}
                    onChange={(e) => updateTaskDetails(selectedTask.id, { project_id: parseInt(e.target.value) })}
                    style={{ flex: 1, padding: '4px', border: '1px solid var(--border-color)' }}
                  >
                    {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                 <span style={{ width: '120px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                   Assignee
                 </span>
                 <select 
                    className="input-minimal" 
                    value={selectedTask.assignee_id || ''}
                    onChange={(e) => updateTaskDetails(selectedTask.id, { assignee_id: parseInt(e.target.value) || null })}
                    style={{ flex: 1, padding: '4px', border: '1px solid var(--border-color)' }}
                  >
                    <option value="">Unassigned</option>
                    {users?.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                 </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                 <span style={{ width: '120px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                   Deadline
                 </span>
                 <input 
                    type="datetime-local" 
                    className="input-minimal" 
                    value={selectedTask.due_date ? selectedTask.due_date.substring(0, 16) : ''}
                    onChange={(e) => updateTaskDetails(selectedTask.id, { due_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    style={{ flex: 1, padding: '4px', border: '1px solid var(--border-color)' }}
                  />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                 <span style={{ width: '120px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                   Reminder
                 </span>
                 <input 
                    type="datetime-local" 
                    className="input-minimal" 
                    value={selectedTask.reminder_date ? selectedTask.reminder_date.substring(0, 16) : ''}
                    onChange={(e) => updateTaskDetails(selectedTask.id, { reminder_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    style={{ flex: 1, padding: '4px', border: '1px solid var(--border-color)' }}
                  />
              </div>

            </div>

            <div style={{ marginTop: '32px' }}>
               <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Description</h4>
               <textarea 
                 className="input-minimal" 
                 style={{ width: '100%', minHeight: '100px', padding: '8px', border: '1px solid var(--border-color)' }}
                 placeholder="Add description..."
                 value={selectedTask.description || ''}
                 onChange={(e) => updateTaskDetails(selectedTask.id, { description: e.target.value })}
                 onBlur={(e) => updateTaskDetails(selectedTask.id, { description: e.target.value })}
               />
            </div>

            {/* Subtasks (Checklist) Section */}
            <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                 <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{selectedTask.subtasks?.length || 0} Subtasks</h4>
               </div>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 {selectedTask.subtasks?.map(st => (
                   <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <input 
                       type="checkbox" 
                       checked={st.is_completed}
                       onChange={() => handleToggleSubtaskDetail(st.id)}
                       style={{ cursor: 'pointer' }}
                     />
                     <span style={{ fontSize: '13px', flex: 1, textDecoration: st.is_completed ? 'line-through' : 'none', color: st.is_completed ? 'var(--text-muted)' : 'inherit' }}>
                       {st.title}
                     </span>
                     <button onClick={() => handleDeleteSubtaskDetail(st.id)} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                     </button>
                   </div>
                 ))}
                 
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                   <span style={{ color: 'var(--text-muted)' }}>+</span>
                   <input 
                     type="text" 
                     className="input-minimal" 
                     placeholder="Add a subtask (Press Enter to save)" 
                     style={{ flex: 1, fontSize: '13px', padding: '4px' }}
                     onKeyDown={(e) => handleAddSubtaskDetail(e, selectedTask.id)}
                   />
                 </div>
               </div>
            </div>

            {/* Attachments Section */}
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
               <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 500 }}>Attachments</h4>
               
               {/* Display Existing Files */}
               {selectedTask.attachments?.length > 0 && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                   {selectedTask.attachments.map(att => (
                     <a key={att.id} href={`http://127.0.0.1:8000/${att.file_path}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--bg-sidebar)', borderRadius: '4px', textDecoration: 'none', color: 'var(--text-main)' }}>
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                       <span style={{ fontSize: '13px' }}>{att.filename}</span>
                     </a>
                   ))}
                 </div>
               )}

               <div 
                 style={{ 
                   border: '1px dashed var(--border-color)', 
                   padding: '32px', 
                   textAlign: 'center', 
                   borderRadius: '8px',
                   color: 'var(--text-muted)',
                   fontSize: '13px',
                   cursor: 'pointer'
                 }}
                 onClick={() => detailFileInputRef.current.click()}
               >
                  Drag & Drop or <span style={{ color: 'var(--primary)' }}>Select files</span>
                  <input 
                    type="file" 
                    multiple 
                    ref={detailFileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={(e) => handleFileUploadDetail(e, selectedTask.id)} 
                  />
               </div>
            </div>

          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="fade-in" style={{ 
            background: 'var(--bg-panel)', 
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            width: '100%', 
            maxWidth: '650px',
            boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <input 
                type="text"
                placeholder="Task name"
                className="input-minimal"
                autoFocus
                style={{ fontSize: '24px', fontWeight: 600, padding: 0, width: '100%' }}
                value={newTask.title}
                onChange={e => setNewTask({...newTask, title: e.target.value})}
              />
              <button onClick={() => setShowAddModal(false)} style={{ color: 'var(--text-muted)', marginLeft: '16px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <textarea 
                className="input-minimal" 
                style={{ width: '100%', minHeight: '60px', padding: 0, border: 'none', resize: 'vertical' }}
                placeholder="Description"
                value={newTask.description}
                onChange={e => setNewTask({...newTask, description: e.target.value})}
              />

              {/* Temporary Files Display */}
              {tempFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Files to upload:</span>
                  {tempFiles.map((f, i) => (
                     <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', background: 'var(--bg-sidebar)', padding: '6px 12px', borderRadius: '4px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                        {f.name}
                        <button onClick={() => setTempFiles(tempFiles.filter((_, idx) => idx !== i))} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                     </div>
                  ))}
                </div>
              )}

              {/* Temporary Checklists Display */}
              {(tempSubtasks.length > 0 || showChecklistInput) && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-sidebar)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                   <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '4px' }}>Checklist</span>
                   
                   {tempSubtasks.map((st, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <input type="checkbox" checked={st.is_completed} onChange={() => {
                            const newSt = [...tempSubtasks];
                            newSt[i].is_completed = !newSt[i].is_completed;
                            setTempSubtasks(newSt);
                         }} />
                         <span style={{ fontSize: '13px', flex: 1, textDecoration: st.is_completed ? 'line-through' : 'none' }}>{st.title}</span>
                         <button onClick={() => setTempSubtasks(tempSubtasks.filter((_, idx) => idx !== i))} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                         </button>
                      </div>
                   ))}

                   <input 
                      type="text"
                      className="input-minimal"
                      placeholder="Add an item (Press Enter)"
                      value={newTempSubtask}
                      onChange={e => setNewTempSubtask(e.target.value)}
                      onKeyDown={(e) => {
                         if (e.key === 'Enter' && newTempSubtask.trim()) {
                            setTempSubtasks([...tempSubtasks, { title: newTempSubtask, is_completed: false }]);
                            setNewTempSubtask('');
                         }
                      }}
                      style={{ fontSize: '13px', padding: '4px', marginTop: '8px' }}
                      autoFocus={showChecklistInput}
                   />
                 </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                {/* Assignee */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '120px', color: 'var(--text-muted)', fontSize: '13px' }}>Assignee:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-sidebar)', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <select 
                      className="input-minimal" 
                      style={{ padding: 0, fontSize: '13px' }}
                      value={newTask.assignee_id || user.id}
                      onChange={e => setNewTask({...newTask, assignee_id: e.target.value})}
                    >
                      <option value={user.id}>{user.full_name} (You)</option>
                      {users?.filter(u => u.id !== user.id).map(u => (
                        <option key={u.id} value={u.id}>{u.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Deadline */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '120px', color: 'var(--text-muted)', fontSize: '13px' }}>Deadline:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-sidebar)', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <input 
                      type="datetime-local" 
                      className="input-minimal" 
                      style={{ padding: 0, fontSize: '13px', color: 'var(--primary)' }}
                      value={newTask.due_date}
                      onChange={e => setNewTask({...newTask, due_date: e.target.value})}
                    />
                  </div>
                </div>

                {/* Reminder */}
                {showReminderInput && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ width: '120px', color: 'var(--text-muted)', fontSize: '13px' }}>Reminder:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-sidebar)', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                      <input 
                        type="datetime-local" 
                        className="input-minimal" 
                        style={{ padding: 0, fontSize: '13px', color: 'var(--primary)' }}
                        value={newTask.reminder_date}
                        onChange={e => setNewTask({...newTask, reminder_date: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                
                <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={e => setTempFiles([...tempFiles, ...Array.from(e.target.files)])} />
                
                <button className="btn-secondary" onClick={() => fileInputRef.current.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                  Files
                </button>
                <button className="btn-secondary" onClick={() => setShowChecklistInput(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                  Checklists
                </button>
                <button className="btn-secondary" onClick={() => setShowReminderInput(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  Reminder
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-sidebar)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                  <select 
                    className="input-minimal" 
                    style={{ padding: 0, fontSize: '12px', width: 'auto' }}
                    value={newTask.project_id || (projects?.length > 0 ? projects[0].id : '')}
                    onChange={e => setNewTask({...newTask, project_id: e.target.value})}
                  >
                    {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <button 
                className="btn-primary" 
                style={{ padding: '8px 24px', opacity: isCreating ? 0.7 : 1, cursor: isCreating ? 'not-allowed' : 'pointer' }} 
                onClick={handleCreateTask}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
              <button className="btn-secondary" style={{ padding: '8px 24px', border: 'none', background: 'transparent' }} onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>Detailed form</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Tasks;
