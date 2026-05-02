from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Table, Enum, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"

class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"

# Association table for Team Members
team_members = Table(
    "team_members",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("project_id", Integer, ForeignKey("projects.id"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default=UserRole.MEMBER)

    owned_projects = relationship("Project", back_populates="owner")
    assigned_tasks = relationship("Task", back_populates="assignee")
    projects = relationship("Project", secondary=team_members, back_populates="members")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    status = Column(String, default="in_progress")
    owner_id = Column(Integer, ForeignKey("users.id"), index=True)

    owner = relationship("User", back_populates="owned_projects")
    members = relationship("User", secondary=team_members, back_populates="projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String)
    status = Column(String, default=TaskStatus.TODO, index=True)
    priority = Column(String, default="medium") # low, medium, high
    due_date = Column(DateTime)
    reminder_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    project_id = Column(Integer, ForeignKey("projects.id"), index=True)
    assignee_id = Column(Integer, ForeignKey("users.id"), index=True)

    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_tasks")
    subtasks = relationship("Subtask", back_populates="task", cascade="all, delete-orphan")
    attachments = relationship("TaskAttachment", back_populates="task", cascade="all, delete-orphan")

class Subtask(Base):
    __tablename__ = "subtasks"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), index=True)
    title = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)
    task = relationship("Task", back_populates="subtasks")

class TaskAttachment(Base):
    __tablename__ = "task_attachments"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    task = relationship("Task", back_populates="attachments")
