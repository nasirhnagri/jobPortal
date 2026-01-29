from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'jobnexus-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="JobNexus API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ======================== MODELS ========================

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: str = "candidate"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    role: str
    permissions: List[str] = []
    status: str = "active"
    created_at: str

class SubAdminCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    permissions: List[str] = []

class SubAdminUpdate(BaseModel):
    name: Optional[str] = None
    permissions: Optional[List[str]] = None
    status: Optional[str] = None

class CompanyProfile(BaseModel):
    company_name: str
    company_description: Optional[str] = None
    company_website: Optional[str] = None
    company_location: Optional[str] = None
    company_size: Optional[str] = None
    company_logo: Optional[str] = None

class JobCreate(BaseModel):
    title: str
    description: str
    company: str
    location: str
    salary: Optional[str] = None
    job_type: str = "full-time"
    experience_level: Optional[str] = None
    skills: List[str] = []
    
class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    skills: Optional[List[str]] = None

class JobResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    company: str
    location: str
    salary: Optional[str] = None
    job_type: str
    experience_level: Optional[str] = None
    skills: List[str] = []
    status: str
    employer_id: str
    employer_name: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: str

class CandidateProfile(BaseModel):
    headline: Optional[str] = None
    summary: Optional[str] = None
    skills: List[str] = []
    experience: Optional[str] = None
    education: Optional[str] = None
    resume_url: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None

class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter: Optional[str] = None

class ApplicationUpdate(BaseModel):
    status: str

class ApplicationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    job_id: str
    job_title: Optional[str] = None
    company: Optional[str] = None
    candidate_id: str
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    cover_letter: Optional[str] = None
    status: str
    created_at: str

# ======================== UTILS ========================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str, permissions: List[str] = []) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "permissions": permissions,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ======================== DEPENDENCIES ========================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.get("status") == "blocked":
        raise HTTPException(status_code=403, detail="Account is blocked")
    return user

def require_roles(*roles):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Access denied")
        return user
    return role_checker

def require_permission(permission: str):
    async def permission_checker(user: dict = Depends(get_current_user)):
        if user["role"] == "superadmin":
            return user
        if user["role"] == "subadmin" and permission not in user.get("permissions", []):
            raise HTTPException(status_code=403, detail="Permission denied")
        return user
    return permission_checker

# ======================== AUTH ROUTES ========================

@api_router.post("/auth/register")
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if data.role not in ["candidate", "employer"]:
        raise HTTPException(status_code=400, detail="Invalid role. Choose 'candidate' or 'employer'")
    
    user_id = str(uuid.uuid4())
    user_status = "pending" if data.role == "employer" else "active"
    
    user_doc = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "role": data.role,
        "permissions": [],
        "status": user_status,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": None
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, data.role)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": data.name,
            "email": data.email,
            "role": data.role,
            "status": user_status
        }
    }

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.get("status") == "blocked":
        raise HTTPException(status_code=403, detail="Account is blocked")
    
    token = create_token(user["id"], user["role"], user.get("permissions", []))
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "status": user.get("status", "active"),
            "permissions": user.get("permissions", [])
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    profile = None
    if user["role"] == "employer":
        profile = await db.employer_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    elif user["role"] == "candidate":
        profile = await db.candidate_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "status": user.get("status", "active"),
        "permissions": user.get("permissions", []),
        "profile": profile
    }

# ======================== ADMIN ROUTES ========================

@api_router.post("/admin/create-subadmin")
async def create_subadmin(data: SubAdminCreate, user: dict = Depends(require_roles("superadmin"))):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    valid_permissions = ["MANAGE_JOBS", "MANAGE_USERS", "APPROVE_EMPLOYERS", "VIEW_REPORTS"]
    for perm in data.permissions:
        if perm not in valid_permissions:
            raise HTTPException(status_code=400, detail=f"Invalid permission: {perm}")
    
    subadmin_id = str(uuid.uuid4())
    subadmin_doc = {
        "id": subadmin_id,
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "role": "subadmin",
        "permissions": data.permissions,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["id"]
    }
    
    await db.users.insert_one(subadmin_doc)
    
    return {
        "id": subadmin_id,
        "name": data.name,
        "email": data.email,
        "role": "subadmin",
        "permissions": data.permissions,
        "status": "active"
    }

@api_router.get("/admin/subadmins")
async def get_subadmins(user: dict = Depends(require_roles("superadmin"))):
    subadmins = await db.users.find({"role": "subadmin"}, {"_id": 0, "password": 0}).to_list(1000)
    return subadmins

@api_router.put("/admin/subadmin/{subadmin_id}")
async def update_subadmin(subadmin_id: str, data: SubAdminUpdate, user: dict = Depends(require_roles("superadmin"))):
    subadmin = await db.users.find_one({"id": subadmin_id, "role": "subadmin"})
    if not subadmin:
        raise HTTPException(status_code=404, detail="Sub-admin not found")
    
    update_data = {}
    if data.name:
        update_data["name"] = data.name
    if data.permissions is not None:
        valid_permissions = ["MANAGE_JOBS", "MANAGE_USERS", "APPROVE_EMPLOYERS", "VIEW_REPORTS"]
        for perm in data.permissions:
            if perm not in valid_permissions:
                raise HTTPException(status_code=400, detail=f"Invalid permission: {perm}")
        update_data["permissions"] = data.permissions
    if data.status:
        update_data["status"] = data.status
    
    if update_data:
        await db.users.update_one({"id": subadmin_id}, {"$set": update_data})
    
    updated = await db.users.find_one({"id": subadmin_id}, {"_id": 0, "password": 0})
    return updated

@api_router.delete("/admin/subadmin/{subadmin_id}")
async def delete_subadmin(subadmin_id: str, user: dict = Depends(require_roles("superadmin"))):
    result = await db.users.delete_one({"id": subadmin_id, "role": "subadmin"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sub-admin not found")
    return {"message": "Sub-admin deleted successfully"}

@api_router.get("/admin/users")
async def get_all_users(
    role: Optional[str] = None,
    status: Optional[str] = None,
    user: dict = Depends(require_roles("superadmin", "subadmin"))
):
    if user["role"] == "subadmin" and "MANAGE_USERS" not in user.get("permissions", []):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {"role": {"$ne": "superadmin"}}
    if role:
        query["role"] = role
    if status:
        query["status"] = status
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.put("/admin/user/{user_id}/block")
async def block_user(user_id: str, admin: dict = Depends(require_roles("superadmin", "subadmin"))):
    if admin["role"] == "subadmin" and "MANAGE_USERS" not in admin.get("permissions", []):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user["role"] == "superadmin":
        raise HTTPException(status_code=403, detail="Cannot block super admin")
    
    await db.users.update_one({"id": user_id}, {"$set": {"status": "blocked"}})
    return {"message": "User blocked successfully"}

@api_router.put("/admin/user/{user_id}/activate")
async def activate_user(user_id: str, admin: dict = Depends(require_roles("superadmin", "subadmin"))):
    if admin["role"] == "subadmin" and "MANAGE_USERS" not in admin.get("permissions", []):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one({"id": user_id}, {"$set": {"status": "active"}})
    return {"message": "User activated successfully"}

@api_router.get("/admin/employers/pending")
async def get_pending_employers(user: dict = Depends(require_roles("superadmin", "subadmin"))):
    if user["role"] == "subadmin" and "APPROVE_EMPLOYERS" not in user.get("permissions", []):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    employers = await db.users.find(
        {"role": "employer", "status": "pending"},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    for employer in employers:
        profile = await db.employer_profiles.find_one({"user_id": employer["id"]}, {"_id": 0})
        employer["profile"] = profile
    
    return employers

@api_router.put("/admin/employer/{employer_id}/approve")
async def approve_employer(employer_id: str, user: dict = Depends(require_roles("superadmin", "subadmin"))):
    if user["role"] == "subadmin" and "APPROVE_EMPLOYERS" not in user.get("permissions", []):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    employer = await db.users.find_one({"id": employer_id, "role": "employer"})
    if not employer:
        raise HTTPException(status_code=404, detail="Employer not found")
    
    await db.users.update_one({"id": employer_id}, {"$set": {"status": "active", "approved_by": user["id"]}})
    return {"message": "Employer approved successfully"}

@api_router.put("/admin/employer/{employer_id}/reject")
async def reject_employer(employer_id: str, user: dict = Depends(require_roles("superadmin", "subadmin"))):
    if user["role"] == "subadmin" and "APPROVE_EMPLOYERS" not in user.get("permissions", []):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    employer = await db.users.find_one({"id": employer_id, "role": "employer"})
    if not employer:
        raise HTTPException(status_code=404, detail="Employer not found")
    
    await db.users.update_one({"id": employer_id}, {"$set": {"status": "blocked"}})
    return {"message": "Employer rejected"}

# ======================== JOB MODERATION ROUTES ========================

@api_router.get("/admin/jobs/pending")
async def get_pending_jobs(user: dict = Depends(require_roles("superadmin", "subadmin"))):
    if user["role"] == "subadmin" and "MANAGE_JOBS" not in user.get("permissions", []):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    jobs = await db.jobs.find({"status": "pending"}, {"_id": 0}).to_list(1000)
    
    for job in jobs:
        employer = await db.users.find_one({"id": job["employer_id"]}, {"_id": 0, "name": 1})
        job["employer_name"] = employer["name"] if employer else None
    
    return jobs

@api_router.get("/admin/jobs/all")
async def get_all_jobs_admin(
    status: Optional[str] = None,
    user: dict = Depends(require_roles("superadmin", "subadmin"))
):
    if user["role"] == "subadmin" and "MANAGE_JOBS" not in user.get("permissions", []):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {}
    if status:
        query["status"] = status
    
    jobs = await db.jobs.find(query, {"_id": 0}).to_list(1000)
    
    for job in jobs:
        employer = await db.users.find_one({"id": job["employer_id"]}, {"_id": 0, "name": 1})
        job["employer_name"] = employer["name"] if employer else None
    
    return jobs

@api_router.put("/admin/jobs/{job_id}/approve")
async def approve_job(job_id: str, user: dict = Depends(require_roles("superadmin", "subadmin"))):
    if user["role"] == "subadmin" and "MANAGE_JOBS" not in user.get("permissions", []):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    await db.jobs.update_one(
        {"id": job_id},
        {"$set": {"status": "approved", "approved_by": user["id"]}}
    )
    return {"message": "Job approved successfully"}

@api_router.put("/admin/jobs/{job_id}/reject")
async def reject_job(job_id: str, user: dict = Depends(require_roles("superadmin", "subadmin"))):
    if user["role"] == "subadmin" and "MANAGE_JOBS" not in user.get("permissions", []):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    await db.jobs.update_one({"id": job_id}, {"$set": {"status": "rejected"}})
    return {"message": "Job rejected"}

@api_router.delete("/admin/jobs/{job_id}")
async def delete_job_admin(job_id: str, user: dict = Depends(require_roles("superadmin", "subadmin"))):
    if user["role"] == "subadmin" and "MANAGE_JOBS" not in user.get("permissions", []):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    result = await db.jobs.delete_one({"id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job deleted successfully"}

# ======================== ANALYTICS ROUTES ========================

@api_router.get("/admin/analytics")
async def get_analytics(user: dict = Depends(require_roles("superadmin", "subadmin"))):
    if user["role"] == "subadmin" and "VIEW_REPORTS" not in user.get("permissions", []):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    total_users = await db.users.count_documents({"role": {"$ne": "superadmin"}})
    total_candidates = await db.users.count_documents({"role": "candidate"})
    total_employers = await db.users.count_documents({"role": "employer"})
    active_employers = await db.users.count_documents({"role": "employer", "status": "active"})
    pending_employers = await db.users.count_documents({"role": "employer", "status": "pending"})
    
    total_jobs = await db.jobs.count_documents({})
    pending_jobs = await db.jobs.count_documents({"status": "pending"})
    approved_jobs = await db.jobs.count_documents({"status": "approved"})
    rejected_jobs = await db.jobs.count_documents({"status": "rejected"})
    
    total_applications = await db.applications.count_documents({})
    
    subadmin_count = await db.users.count_documents({"role": "subadmin"})
    
    return {
        "users": {
            "total": total_users,
            "candidates": total_candidates,
            "employers": total_employers,
            "active_employers": active_employers,
            "pending_employers": pending_employers,
            "subadmins": subadmin_count
        },
        "jobs": {
            "total": total_jobs,
            "pending": pending_jobs,
            "approved": approved_jobs,
            "rejected": rejected_jobs
        },
        "applications": {
            "total": total_applications
        }
    }

# ======================== EMPLOYER ROUTES ========================

@api_router.get("/employer/profile")
async def get_employer_profile(user: dict = Depends(require_roles("employer"))):
    profile = await db.employer_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    return profile or {}

@api_router.put("/employer/profile")
async def update_employer_profile(data: CompanyProfile, user: dict = Depends(require_roles("employer"))):
    profile_doc = {
        "user_id": user["id"],
        **data.model_dump()
    }
    
    await db.employer_profiles.update_one(
        {"user_id": user["id"]},
        {"$set": profile_doc},
        upsert=True
    )
    
    return {"message": "Profile updated successfully", "profile": profile_doc}

@api_router.post("/employer/jobs")
async def create_job(data: JobCreate, user: dict = Depends(require_roles("employer"))):
    if user.get("status") != "active":
        raise HTTPException(status_code=403, detail="Your account is pending approval. You cannot post jobs yet.")
    
    job_id = str(uuid.uuid4())
    job_doc = {
        "id": job_id,
        "title": data.title,
        "description": data.description,
        "company": data.company,
        "location": data.location,
        "salary": data.salary,
        "job_type": data.job_type,
        "experience_level": data.experience_level,
        "skills": data.skills,
        "status": "pending",
        "employer_id": user["id"],
        "approved_by": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.jobs.insert_one(job_doc)
    
    return {
        "id": job_id,
        "title": data.title,
        "status": "pending",
        "message": "Job posted successfully. Pending admin approval."
    }

@api_router.get("/employer/jobs")
async def get_employer_jobs(user: dict = Depends(require_roles("employer"))):
    jobs = await db.jobs.find({"employer_id": user["id"]}, {"_id": 0}).to_list(1000)
    return jobs

@api_router.put("/employer/jobs/{job_id}")
async def update_employer_job(job_id: str, data: JobUpdate, user: dict = Depends(require_roles("employer"))):
    job = await db.jobs.find_one({"id": job_id, "employer_id": user["id"]})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        update_data["status"] = "pending"  # Reset to pending after edit
        await db.jobs.update_one({"id": job_id}, {"$set": update_data})
    
    updated = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    return updated

@api_router.delete("/employer/jobs/{job_id}")
async def delete_employer_job(job_id: str, user: dict = Depends(require_roles("employer"))):
    result = await db.jobs.delete_one({"id": job_id, "employer_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job deleted successfully"}

@api_router.get("/employer/jobs/{job_id}/applicants")
async def get_job_applicants(job_id: str, user: dict = Depends(require_roles("employer"))):
    job = await db.jobs.find_one({"id": job_id, "employer_id": user["id"]})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    applications = await db.applications.find({"job_id": job_id}, {"_id": 0}).to_list(1000)
    
    for app in applications:
        candidate = await db.users.find_one({"id": app["candidate_id"]}, {"_id": 0, "name": 1, "email": 1})
        if candidate:
            app["candidate_name"] = candidate["name"]
            app["candidate_email"] = candidate["email"]
        profile = await db.candidate_profiles.find_one({"user_id": app["candidate_id"]}, {"_id": 0})
        app["candidate_profile"] = profile
    
    return applications

@api_router.put("/employer/applications/{application_id}/status")
async def update_application_status(application_id: str, data: ApplicationUpdate, user: dict = Depends(require_roles("employer"))):
    application = await db.applications.find_one({"id": application_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    job = await db.jobs.find_one({"id": application["job_id"], "employer_id": user["id"]})
    if not job:
        raise HTTPException(status_code=403, detail="You don't have permission to update this application")
    
    valid_statuses = ["pending", "reviewed", "shortlisted", "rejected", "hired"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Valid: {valid_statuses}")
    
    await db.applications.update_one({"id": application_id}, {"$set": {"status": data.status}})
    return {"message": "Application status updated"}

# ======================== CANDIDATE ROUTES ========================

@api_router.get("/candidate/profile")
async def get_candidate_profile(user: dict = Depends(require_roles("candidate"))):
    profile = await db.candidate_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    return profile or {}

@api_router.put("/candidate/profile")
async def update_candidate_profile(data: CandidateProfile, user: dict = Depends(require_roles("candidate"))):
    profile_doc = {
        "user_id": user["id"],
        **data.model_dump()
    }
    
    await db.candidate_profiles.update_one(
        {"user_id": user["id"]},
        {"$set": profile_doc},
        upsert=True
    )
    
    return {"message": "Profile updated successfully", "profile": profile_doc}

@api_router.post("/candidate/applications")
async def apply_for_job(data: ApplicationCreate, user: dict = Depends(require_roles("candidate"))):
    job = await db.jobs.find_one({"id": data.job_id, "status": "approved"})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or not available")
    
    existing = await db.applications.find_one({"job_id": data.job_id, "candidate_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied for this job")
    
    application_id = str(uuid.uuid4())
    application_doc = {
        "id": application_id,
        "job_id": data.job_id,
        "candidate_id": user["id"],
        "cover_letter": data.cover_letter,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.applications.insert_one(application_doc)
    
    return {"id": application_id, "message": "Application submitted successfully"}

@api_router.get("/candidate/applications")
async def get_candidate_applications(user: dict = Depends(require_roles("candidate"))):
    applications = await db.applications.find({"candidate_id": user["id"]}, {"_id": 0}).to_list(1000)
    
    for app in applications:
        job = await db.jobs.find_one({"id": app["job_id"]}, {"_id": 0, "title": 1, "company": 1})
        if job:
            app["job_title"] = job["title"]
            app["company"] = job["company"]
    
    return applications

@api_router.delete("/candidate/applications/{application_id}")
async def withdraw_application(application_id: str, user: dict = Depends(require_roles("candidate"))):
    result = await db.applications.delete_one({"id": application_id, "candidate_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application withdrawn"}

# ======================== PUBLIC ROUTES ========================

@api_router.get("/jobs")
async def get_public_jobs(
    search: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    limit: int = 50
):
    query = {"status": "approved"}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if job_type:
        query["job_type"] = job_type
    
    jobs = await db.jobs.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    for job in jobs:
        employer = await db.users.find_one({"id": job["employer_id"]}, {"_id": 0, "name": 1})
        job["employer_name"] = employer["name"] if employer else None
    
    return jobs

@api_router.get("/jobs/{job_id}")
async def get_job_details(job_id: str):
    job = await db.jobs.find_one({"id": job_id, "status": "approved"}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    employer = await db.users.find_one({"id": job["employer_id"]}, {"_id": 0, "name": 1})
    job["employer_name"] = employer["name"] if employer else None
    
    profile = await db.employer_profiles.find_one({"user_id": job["employer_id"]}, {"_id": 0})
    job["company_profile"] = profile
    
    return job

@api_router.get("/")
async def root():
    return {"message": "JobNexus API", "version": "1.0.0"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event - Seed Super Admin
@app.on_event("startup")
async def startup_event():
    logger.info("Starting JobNexus API...")
    
    # Check if super admin exists
    super_admin = await db.users.find_one({"role": "superadmin"})
    if not super_admin:
        logger.info("Creating default super admin...")
        super_admin_doc = {
            "id": str(uuid.uuid4()),
            "name": "Super Admin",
            "email": "admin@jobconnect.com",
            "password": hash_password("Admin@123"),
            "role": "superadmin",
            "permissions": [],
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": None
        }
        await db.users.insert_one(super_admin_doc)
        logger.info("Super admin created: admin@jobconnect.com / Admin@123")
    else:
        logger.info("Super admin already exists")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
