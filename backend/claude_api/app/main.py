from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
import base64

from .claude import ChatRequest, ChatResponse, Message as ClaudeMessage, get_claude_response

from .database import init_db, get_session
from .models import Project, Chat, Message, File as DBFile

# Pydantic models for request/response
class ProjectCreate(BaseModel):
    name: str
    description: str | None = None

class FileResponse(BaseModel):
    id: int
    name: str
    content_type: str
    size: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatHistoryResponse(BaseModel):
    id: int
    title: str
    preview: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse]

    class Config:
        from_attributes = True

class ClaudeResponse(BaseModel):
    message: ClaudeMessage

    class Config:
        from_attributes = True

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime
    chat_count: int
    files: List[FileResponse]

    class Config:
        from_attributes = True

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.get("/healthz")
async def healthz(db: AsyncSession = Depends(get_session)):
    return {
        "status": "ok",
        "env": {
            "anthropic_key_set": bool(os.getenv("ANTHROPIC_API_KEY")),
            "db_initialized": True
        }
    }

@app.post("/api/chat", response_model=ClaudeResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_session)):
    # Get project files for context
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.files))
        .filter(Project.id == request.project_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Build context from files
    context = ""
    for file in project.files:
        if request.file_ids is None or file.id in request.file_ids:
            # Decode file content from base64
            try:
                if file.content_type.startswith('image/'):
                    context += f"\nFile: {file.name}\nContent: [Image file]\n"
                elif file.content_type == 'application/pdf':
                    from io import BytesIO
                    from PyPDF2 import PdfReader
                    pdf_content = base64.b64decode(file.data)
                    pdf_file = BytesIO(pdf_content)
                    pdf_reader = PdfReader(pdf_file)
                    text_content = ""
                    for page in pdf_reader.pages:
                        text_content += page.extract_text() + "\n"
                    context += f"\nFile: {file.name}\nContent: {text_content}\n"
                elif file.content_type == 'text/plain':
                    text_content = base64.b64decode(file.data).decode('utf-8', errors='replace')
                    context += f"\nFile: {file.name}\nContent: {text_content}\n"
                else:
                    context += f"\nFile: {file.name}\nContent: [Unsupported file type]\n"
            except Exception as e:
                context += f"\nFile: {file.name}\nContent: [Error reading file: {str(e)}]\n"
    
    # Create or get chat
    chat_title = request.messages[0].content[:50] + "..." if request.messages else "New Chat"
    chat = Chat(
        project_id=request.project_id,
        title=chat_title,
        preview=request.messages[0].content if request.messages else ""
    )
    db.add(chat)
    await db.commit()
    await db.refresh(chat)
    
    # Add messages to chat
    for msg in request.messages:
        message = Message(
            chat_id=chat.id,
            role=msg.role,
            content=msg.content
        )
        db.add(message)
    
    # Get response from Claude
    try:
        response_content = await get_claude_response(request.messages, context)
        # Add Claude's response to chat
        message = Message(
            chat_id=chat.id,
            role="assistant",
            content=response_content
        )
        db.add(message)
        await db.commit()
        
        # Create ClaudeMessage object for response
        claude_message = ClaudeMessage(role="assistant", content=response_content)
        return ClaudeResponse(message=claude_message)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/projects/{project_id}/files", response_model=FileResponse)
async def upload_file(
    project_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_session)
):
    # Check if project exists
    result = await db.execute(
        select(Project).filter(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Validate file type
    content_type = file.content_type or ""
    if not content_type.startswith(('image/', 'application/pdf', 'text/plain')):
        raise HTTPException(
            status_code=400,
            detail="Only PDF documents, images (PNG, JPG, JPEG), and text files are allowed"
        )
    
    # Read file content
    content = await file.read()
    
    # Create file record
    db_file = DBFile(
        project_id=project_id,
        name=file.filename,
        content_type=content_type,
        size=len(content),
        data=base64.b64encode(content).decode()
    )
    
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)
    
    return FileResponse(
        id=db_file.id,
        name=db_file.name,
        content_type=db_file.content_type,
        size=db_file.size,
        uploaded_at=db_file.uploaded_at
    )

@app.get("/api/projects/{project_id}/files/{file_id}")
async def get_file(
    project_id: int,
    file_id: int,
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(DBFile)
        .filter(DBFile.project_id == project_id)
        .filter(DBFile.id == file_id)
    )
    file = result.scalar_one_or_none()
    
    if file is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    content = base64.b64decode(file.data)
    
    return JSONResponse({
        "content": base64.b64encode(content).decode(),
        "content_type": file.content_type,
        "filename": file.name
    })

@app.post("/api/projects", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, db: AsyncSession = Depends(get_session)):
    db_project = Project(
        name=project.name,
        description=project.description,
    )
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)
    
    return ProjectResponse(
        id=db_project.id,
        name=db_project.name,
        description=db_project.description,
        created_at=db_project.created_at,
        updated_at=db_project.updated_at,
        chat_count=0,
        files=[]
    )

@app.get("/api/projects", response_model=List[ProjectResponse])
async def list_projects(db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.chats))
        .options(selectinload(Project.files))
        .order_by(Project.updated_at.desc())
    )
    projects = result.scalars().all()
    
    return [
        ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            created_at=project.created_at,
            updated_at=project.updated_at,
            chat_count=len(project.chats),
            files=[
                FileResponse(
                    id=file.id,
                    name=file.name,
                    content_type=file.content_type,
                    size=file.size,
                    uploaded_at=file.uploaded_at
                )
                for file in project.files
            ]
        )
        for project in projects
    ]

@app.get("/api/projects/{project_id}/chats", response_model=List[ChatHistoryResponse])
async def list_project_chats(
    project_id: int,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_session)
):
    # Build query
    query = (
        select(Chat)
        .options(selectinload(Chat.messages))
        .filter(Chat.project_id == project_id)
        .order_by(Chat.updated_at.desc())
    )
    
    # Add search filter if provided
    if search:
        query = query.filter(
            (Chat.title.ilike(f"%{search}%")) |
            (Chat.preview.ilike(f"%{search}%"))
        )
    
    # Execute query
    result = await db.execute(query)
    chats = result.scalars().all()
    
    return [
        ChatHistoryResponse(
            id=chat.id,
            title=chat.title,
            preview=chat.preview,
            created_at=chat.created_at,
            updated_at=chat.updated_at,
            messages=[
                MessageResponse(
                    id=msg.id,
                    role=msg.role,
                    content=msg.content,
                    created_at=msg.created_at
                )
                for msg in chat.messages
            ]
        )
        for chat in chats
    ]

@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.chats))
        .options(selectinload(Project.files))
        .filter(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at,
        chat_count=len(project.chats),
        files=[
            FileResponse(
                id=file.id,
                name=file.name,
                content_type=file.content_type,
                size=file.size,
                uploaded_at=file.uploaded_at
            )
            for file in project.files
        ]
    )
