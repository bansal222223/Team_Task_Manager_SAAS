import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('in_progress');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, [page]);

  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    const skip = (page - 1) * limit;
    const res = await fetch(`/projects/?skip=${skip}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setProjects(data.items);
      setTotal(data.total);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (editMode && currentProjectId) {
      // Update Project
      const res = await fetch(`/projects/${currentProjectId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ name, description, status })
      });
      if (res.ok) {
        closeModal();
        fetchProjects();
      } else {
        alert('Failed to update project');
      }
    } else {
      // Create Project
      const res = await fetch('/projects/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ name, description, status })
      });
      if (res.ok) {
        closeModal();
        fetchProjects();
      } else {
        alert('Failed to create project');
      }
    }
  };

  const openEditModal = (project) => {
    setName(project.name);
    setDescription(project.description || '');
    setStatus(project.status || 'in_progress');
    setCurrentProjectId(project.id);
    setEditMode(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentProjectId(null);
    setName('');
    setDescription('');
    setStatus('in_progress');
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks will be removed.')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) fetchProjects();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Projects</h2>
        {user.role === 'admin' && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', flex: 1 }}>
        {projects?.map(project => (
          <div key={project.id} style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{project.name}</h3>
              {user.role === 'admin' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEditModal(project)} style={{ color: 'var(--text-muted)' }} title="Edit Project">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  </button>
                  <button onClick={() => deleteProject(project.id)} style={{ color: 'var(--text-muted)' }} title="Delete Project">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              )}
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px', flexGrow: 1, lineHeight: '1.5' }}>
              {project.description || 'No description provided.'}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <span className={`badge ${project.status === 'completed' ? 'badge-green' : project.status === 'overdue' ? 'badge-red' : 'badge-blue'}`}>
                {project.status === 'in_progress' ? 'In Progress' : project.status === 'todo' ? 'To Do' : project.status === 'completed' ? 'Completed' : project.status === 'overdue' ? 'Overdue' : 'Unknown'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Members: {project.members?.length || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
         <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Showing {projects?.length || 0} of {total} projects</span>
         <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className="btn-secondary" 
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span style={{ fontSize: '13px', margin: '0 8px' }}>Page {page} of {totalPages}</span>
            <button 
              className="btn-secondary" 
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
         </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ 
            background: 'var(--bg-panel)', 
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            width: '100%', 
            maxWidth: '500px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{editMode ? 'Edit Project' : 'Create New Project'}</h3>
              <button onClick={closeModal} style={{ color: 'var(--text-muted)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateOrUpdate} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-main)' }}>Project Name</label>
                <input 
                  type="text" 
                  className="input-minimal"
                  style={{ border: '1px solid var(--border-color)', width: '100%', padding: '10px' }}
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-main)' }}>Description</label>
                <textarea 
                  className="input-minimal"
                  style={{ border: '1px solid var(--border-color)', width: '100%', padding: '10px', minHeight: '80px', resize: 'vertical' }}
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-main)' }}>Status</label>
                <select 
                  className="input-minimal"
                  style={{ border: '1px solid var(--border-color)', width: '100%', padding: '10px' }}
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)} 
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary">{editMode ? 'Save Changes' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
