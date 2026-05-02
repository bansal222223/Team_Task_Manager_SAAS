from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import models, schemas, auth, database
from database import engine, get_db
import os
import datetime

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Task Manager API")

import os
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Endpoints
@app.post("/signup", response_model=schemas.User)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/token", response_model=schemas.Token)
def login(form_data: schemas.UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.email).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# Project Endpoints
@app.get("/projects/{project_id}", response_model=schemas.Project)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if user has access
    if current_user.role != models.UserRole.ADMIN and current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return project

@app.put("/projects/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: int,
    project_update: schemas.ProjectBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if current_user.role != models.UserRole.ADMIN and db_project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner or admin can update the project")

    for key, value in project_update.dict().items():
        setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project

@app.delete("/projects/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if current_user.role != models.UserRole.ADMIN and db_project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner or admin can delete the project")

    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted successfully"}

@app.post("/projects/", response_model=schemas.Project)
def create_project(
    project: schemas.ProjectCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.RoleChecker([models.UserRole.ADMIN]))
):
    
    db_project = models.Project(
        name=project.name,
        description=project.description,
        owner_id=current_user.id
    )
    
    # Add members if provided
    if project.member_ids:
        members = db.query(models.User).filter(models.User.id.in_(project.member_ids)).all()
        db_project.members = members
    
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.get("/projects/", response_model=schemas.PaginatedProjects)
def list_projects(
    skip: int = 0, limit: int = 10,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role == models.UserRole.ADMIN:
        query = db.query(models.Project)
    else:
        query = db.query(models.Project).join(models.Project.members).filter(models.User.id == current_user.id)
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"items": items, "total": total}

# Task Endpoints
@app.post("/tasks/", response_model=schemas.Task)
def create_task(
    task: schemas.TaskCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if user is member/owner of the project
    project = db.query(models.Project).filter(models.Project.id == task.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if current_user.role != models.UserRole.ADMIN and current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db_task = models.Task(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.get("/tasks/", response_model=schemas.PaginatedTasks)
def list_tasks(
    skip: int = 0, limit: int = 10,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role == models.UserRole.ADMIN:
        query = db.query(models.Task)
    else:
        query = db.query(models.Task).filter(models.Task.assignee_id == current_user.id)
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"items": items, "total": total}

@app.put("/tasks/{task_id}", response_model=schemas.Task)
def update_task(
    task_id: int, 
    task_update: schemas.TaskBase,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Admin or the project owner or the assignee can update
    # But usually, only Admin/Owner should update details, Assignee updates status
    project = db.query(models.Project).filter(models.Project.id == db_task.project_id).first()
    
    if current_user.role != models.UserRole.ADMIN and \
       current_user.id != project.owner_id and \
       current_user.id != db_task.assignee_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    for key, value in task_update.dict().items():
        setattr(db_task, key, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    project = db.query(models.Project).filter(models.Project.id == db_task.project_id).first()
    
    if current_user.role != models.UserRole.ADMIN and current_user.id != project.owner_id:
        raise HTTPException(status_code=403, detail="Only admins or project owners can delete tasks")

    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully"}

@app.put("/tasks/{task_id}/status", response_model=schemas.Task)
def update_task_status(
    task_id: int, 
    status_update: schemas.TaskStatus,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Member can update status if they are the assignee
    if current_user.role != models.UserRole.ADMIN and db_task.assignee_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update tasks assigned to you")
    
    db_task.status = status_update
    db.commit()
    db.refresh(db_task)
    return db_task

# User Endpoints
@app.get("/users/", response_model=List[schemas.User])
def list_users(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.User).all()

# Subtask & Attachment Endpoints
import shutil

@app.post("/tasks/{task_id}/subtasks", response_model=schemas.Subtask)
def create_subtask(
    task_id: int, 
    subtask: schemas.SubtaskCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db_subtask = models.Subtask(title=subtask.title, is_completed=subtask.is_completed, task_id=task_id)
    db.add(db_subtask)
    db.commit()
    db.refresh(db_subtask)
    return db_subtask

@app.put("/subtasks/{subtask_id}")
def toggle_subtask(
    subtask_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    db_subtask = db.query(models.Subtask).filter(models.Subtask.id == subtask_id).first()
    if not db_subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    
    db_subtask.is_completed = not db_subtask.is_completed
    db.commit()
    db.refresh(db_subtask)
    return db_subtask

@app.delete("/subtasks/{subtask_id}")
def delete_subtask(
    subtask_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    db_subtask = db.query(models.Subtask).filter(models.Subtask.id == subtask_id).first()
    if not db_subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    
    db.delete(db_subtask)
    db.commit()
    return {"message": "Subtask deleted successfully"}

@app.post("/tasks/{task_id}/attachments", response_model=schemas.TaskAttachment)
def upload_attachment(
    task_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Save the file to the uploads directory
    file_path = f"uploads/{int(datetime.datetime.utcnow().timestamp())}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_attachment = models.TaskAttachment(task_id=task_id, filename=file.filename, file_path=file_path)
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return db_attachment

# Dashboard Stats
@app.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role == models.UserRole.ADMIN:
        tasks = db.query(models.Task).all()
    else:
        tasks = db.query(models.Task).filter(models.Task.assignee_id == current_user.id).all()
    
    stats = {
        "total": len(tasks),
        "todo": len([t for t in tasks if t.status == "todo"]),
        "in_progress": len([t for t in tasks if t.status == "in_progress"]),
        "completed": len([t for t in tasks if t.status == "completed"]),
        "overdue": len([t for t in tasks if t.due_date and t.due_date < datetime.utcnow() and t.status != "completed"])
    }
    return stats

# Serve Static Files (React) - Only if directory exists (for Docker/Production)
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        return FileResponse("static/index.html")
else:
    @app.get("/")
    def read_root():
        return {"message": "API is running. Frontend build not found in /static."}
