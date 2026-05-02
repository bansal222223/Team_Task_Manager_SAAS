from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from models import UserRole, TaskStatus

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.MEMBER

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: str = "medium"
    due_date: Optional[datetime] = None
    reminder_date: Optional[datetime] = None
    assignee_id: Optional[int] = None

class TaskCreate(TaskBase):
    project_id: int

class SubtaskBase(BaseModel):
    title: str
    is_completed: bool = False

class SubtaskCreate(SubtaskBase):
    pass

class Subtask(SubtaskBase):
    id: int
    task_id: int
    class Config:
        from_attributes = True

class TaskAttachmentBase(BaseModel):
    filename: str
    file_path: str

class TaskAttachment(TaskAttachmentBase):
    id: int
    task_id: int
    uploaded_at: datetime
    class Config:
        from_attributes = True

class Task(TaskBase):
    id: int
    project_id: int
    created_at: datetime
    subtasks: List[Subtask] = []
    attachments: List[TaskAttachment] = []
    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "in_progress"

class ProjectCreate(ProjectBase):
    member_ids: Optional[List[int]] = []

class Project(ProjectBase):
    id: int
    owner_id: int
    members: List[User] = []
    tasks: List[Task] = []
    class Config:
        from_attributes = True

class PaginatedProjects(BaseModel):
    items: List[Project]
    total: int

class PaginatedTasks(BaseModel):
    items: List[Task]
    total: int
