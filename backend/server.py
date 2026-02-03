from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import logging
import hashlib
import smtplib
from email.message import EmailMessage
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

try:
    from google.oauth2 import id_token as google_id_token  # type: ignore
    from google.auth.transport import requests as google_requests  # type: ignore
except Exception:  # pragma: no cover
    google_id_token = None
    google_requests = None

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

class GoogleLoginRequest(BaseModel):
    credential: str
    role: str = "candidate"  # candidate, employer

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

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

# ======================== BLOG MODELS ========================

class BlogCategoryCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None

class BlogCategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None

class BlogTagCreate(BaseModel):
    name: str
    slug: Optional[str] = None

class BlogTagUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None

class BlogPostCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: str
    featured_image: Optional[str] = None
    category_id: Optional[str] = None
    tag_ids: List[str] = []
    status: str = "draft"  # draft, pending_review, published
    published_at: Optional[str] = None  # ISO datetime for scheduling
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    allow_comments: bool = True

class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    featured_image: Optional[str] = None
    category_id: Optional[str] = None
    tag_ids: Optional[List[str]] = None
    status: Optional[str] = None
    published_at: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    allow_comments: Optional[bool] = None

class BlogCommentCreate(BaseModel):
    post_id: str
    author_name: str
    author_email: EmailStr
    content: str
    parent_id: Optional[str] = None

# ======================== HERO VIDEO MODELS ========================

class HeroVideoUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None  # active, inactive
    order: Optional[int] = None

# ======================== PASSWORD RESET HELPERS ========================

def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

def can_send_email() -> bool:
    return bool(os.environ.get("SMTP_HOST") and os.environ.get("SMTP_FROM"))

def send_reset_email(to_email: str, reset_link: str):
    """
    Best-effort SMTP send. Controlled by SMTP_* env vars.
    """
    host = os.environ.get("SMTP_HOST")
    port = int(os.environ.get("SMTP_PORT", "587"))
    user = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASSWORD")
    from_email = os.environ.get("SMTP_FROM")

    if not host or not from_email:
        raise RuntimeError("SMTP_HOST/SMTP_FROM not configured")

    msg = EmailMessage()
    msg["Subject"] = "Reset your JobNexus password"
    msg["From"] = from_email
    msg["To"] = to_email
    msg.set_content(
        f"Use this link to reset your password:\n\n{reset_link}\n\n"
        f"If you didn't request this, you can ignore this email."
    )

    with smtplib.SMTP(host, port, timeout=20) as smtp:
        smtp.ehlo()
        if os.environ.get("SMTP_TLS", "1") == "1":
            smtp.starttls()
            smtp.ehlo()
        if user and password:
            smtp.login(user, password)
        smtp.send_message(msg)

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

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-') or str(uuid.uuid4())[:8]

# Blog uploads
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB

# Hero video uploads
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm"}
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50MB

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
        "auth_provider": "password",
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

    if not user.get("password"):
        raise HTTPException(status_code=400, detail="This account has no password set. Use Google sign-in or reset your password.")
    
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
            "auth_provider": user.get("auth_provider", "password"),
            "status": user.get("status", "active"),
            "permissions": user.get("permissions", [])
        }
    }

@api_router.post("/auth/google")
async def login_with_google(data: GoogleLoginRequest):
    if google_id_token is None or google_requests is None:
        raise HTTPException(status_code=500, detail="Google auth is not installed on the backend.")

    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID is not configured on the backend.")

    try:
        idinfo = google_id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            audience=client_id,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google credential")

    email = idinfo.get("email")
    name = idinfo.get("name") or (email.split("@")[0] if email else "User")
    if not email:
        raise HTTPException(status_code=400, detail="Google account did not return an email")

    # Role safety: default to candidate, allow employer if requested
    role = data.role if data.role in ("candidate", "employer") else "candidate"
    user_status = "pending" if role == "employer" else "active"

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "name": name,
            "email": email,
            "password": None,
            "auth_provider": "google",
            "google_sub": idinfo.get("sub"),
            "role": role,
            "permissions": [],
            "status": user_status,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": None,
        }
        await db.users.insert_one(user_doc)
        user = user_doc
    else:
        if user.get("status") == "blocked":
            raise HTTPException(status_code=403, detail="Account is blocked")
        # Keep existing role/status; just update name/sub if missing
        upd = {}
        if not user.get("google_sub") and idinfo.get("sub"):
            upd["google_sub"] = idinfo.get("sub")
        if user.get("auth_provider") != "google":
            upd["auth_provider"] = user.get("auth_provider", "password")
        if upd:
            await db.users.update_one({"id": user["id"]}, {"$set": upd})

    token = create_token(user["id"], user["role"], user.get("permissions", []))
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user.get("name") or name,
            "email": user["email"],
            "role": user["role"],
            "auth_provider": user.get("auth_provider", "google"),
            "status": user.get("status", "active"),
            "permissions": user.get("permissions", []),
        },
    }

@api_router.post("/auth/password-reset/request")
async def request_password_reset(data: PasswordResetRequest):
    """
    Always returns success message (prevents email enumeration).
    If SMTP is configured, emails a reset link. In dev, can optionally return the token.
    """
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    # Always respond the same
    response = {"message": "If an account exists for that email, a reset link has been sent."}

    if not user:
        return response

    raw_token = uuid.uuid4().hex + uuid.uuid4().hex
    token_hash = sha256_hex(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

    await db.password_resets.insert_one(
        {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "token_hash": token_hash,
            "used": False,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )

    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    reset_link = f"{frontend_url.rstrip('/')}/reset-password?token={raw_token}"

    if can_send_email():
        try:
            send_reset_email(user["email"], reset_link)
        except Exception as e:
            logger.warning(f"Failed to send reset email: {e}")
    else:
        logger.info(f"Password reset link (SMTP not configured): {reset_link}")

    if os.environ.get("DEV_RETURN_RESET_TOKEN", "0") == "1":
        response["token"] = raw_token
        response["reset_link"] = reset_link

    return response

@api_router.post("/auth/password-reset/confirm")
async def confirm_password_reset(data: PasswordResetConfirm):
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    token_hash = sha256_hex(data.token)
    rec = await db.password_resets.find_one({"token_hash": token_hash, "used": False}, {"_id": 0})
    if not rec:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    try:
        expires_at = datetime.fromisoformat(rec["expires_at"])
    except Exception:
        expires_at = datetime.now(timezone.utc) - timedelta(days=1)

    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = await db.users.find_one({"id": rec["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password": hash_password(data.new_password), "auth_provider": user.get("auth_provider") or "password"}},
    )
    await db.password_resets.update_one(
        {"token_hash": token_hash},
        {"$set": {"used": True, "used_at": datetime.now(timezone.utc).isoformat()}},
    )

    return {"message": "Password reset successful. You can now log in."}

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
    
    valid_permissions = ["MANAGE_JOBS", "MANAGE_USERS", "APPROVE_EMPLOYERS", "VIEW_REPORTS", "MANAGE_BLOG"]
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
        valid_permissions = ["MANAGE_JOBS", "MANAGE_USERS", "APPROVE_EMPLOYERS", "VIEW_REPORTS", "MANAGE_BLOG"]
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

# ======================== BLOG HELPERS ========================

def require_blog_admin():
    async def checker(user: dict = Depends(get_current_user)):
        if user["role"] not in ("superadmin", "subadmin"):
            raise HTTPException(status_code=403, detail="Access denied")
        if user["role"] == "subadmin" and "MANAGE_BLOG" not in user.get("permissions", []):
            raise HTTPException(status_code=403, detail="Permission denied")
        return user
    return checker

# ======================== BLOG UPLOAD ========================

@api_router.post("/blog/upload")
async def blog_upload_image(
    file: UploadFile = File(...),
    user: dict = Depends(require_blog_admin())
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Use JPEG, PNG, GIF, or WebP.")
    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB.")
    ext = Path(file.filename or "image").suffix or ".jpg"
    if ext.lower() not in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
        ext = ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        f.write(contents)
    url = f"/uploads/{filename}"
    return {"url": url}

# ======================== HERO VIDEOS (SUPERADMIN) ========================

@api_router.post("/hero/admin/videos/upload")
async def hero_upload_video(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    status: str = Form("active"),
    order: int = Form(0),
    user: dict = Depends(require_roles("superadmin")),
):
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Use MP4 or WebM.")
    contents = await file.read()
    if len(contents) > MAX_VIDEO_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 50MB.")
    ext = Path(file.filename or "video").suffix or ".mp4"
    if ext.lower() not in (".mp4", ".webm"):
        ext = ".mp4"
    filename = f"hero-{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        f.write(contents)

    video_id = str(uuid.uuid4())
    doc = {
        "id": video_id,
        "title": title or (Path(file.filename).stem if file.filename else "Hero Video"),
        "url": f"/uploads/{filename}",
        "status": status if status in ("active", "inactive") else "active",
        "order": int(order or 0),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["id"],
    }
    await db.hero_videos.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.get("/hero/admin/videos")
async def hero_list_videos_admin(user: dict = Depends(require_roles("superadmin"))):
    vids = await db.hero_videos.find({}, {"_id": 0}).sort([("order", 1), ("created_at", -1)]).to_list(200)
    return vids

@api_router.put("/hero/admin/videos/{video_id}")
async def hero_update_video(video_id: str, data: HeroVideoUpdate, user: dict = Depends(require_roles("superadmin"))):
    upd = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if "status" in upd and upd["status"] not in ("active", "inactive"):
        raise HTTPException(status_code=400, detail="Status must be active or inactive")
    if upd:
        await db.hero_videos.update_one({"id": video_id}, {"$set": upd})
    doc = await db.hero_videos.find_one({"id": video_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Video not found")
    return doc

@api_router.delete("/hero/admin/videos/{video_id}")
async def hero_delete_video(video_id: str, user: dict = Depends(require_roles("superadmin"))):
    doc = await db.hero_videos.find_one({"id": video_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Video not found")
    # best-effort delete file
    try:
        url = doc.get("url") or ""
        if url.startswith("/uploads/"):
            (UPLOAD_DIR / Path(url).name).unlink(missing_ok=True)
    except Exception:
        pass
    r = await db.hero_videos.delete_one({"id": video_id})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Video not found")
    return {"message": "Video deleted"}

# ======================== HERO VIDEOS (PUBLIC) ========================

@api_router.get("/hero/videos")
async def hero_list_videos_public():
    vids = await db.hero_videos.find({"status": "active"}, {"_id": 0}).sort([("order", 1), ("created_at", -1)]).to_list(50)
    return vids

# ======================== BLOG ADMIN - CATEGORIES ========================

@api_router.post("/blog/admin/categories")
async def create_blog_category(data: BlogCategoryCreate, user: dict = Depends(require_blog_admin())):
    slug = data.slug or slugify(data.name)
    existing = await db.blog_categories.find_one({"slug": slug})
    if existing:
        raise HTTPException(status_code=400, detail="Category slug already exists")
    cat_id = str(uuid.uuid4())
    doc = {
        "id": cat_id, "name": data.name, "slug": slug,
        "description": data.description or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.blog_categories.insert_one(doc)
    return {"id": cat_id, **{k: v for k, v in doc.items() if k != "_id"}}

@api_router.get("/blog/admin/categories")
async def list_blog_categories_admin(user: dict = Depends(require_blog_admin())):
    cats = await db.blog_categories.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    return cats

@api_router.put("/blog/admin/categories/{category_id}")
async def update_blog_category(category_id: str, data: BlogCategoryUpdate, user: dict = Depends(require_blog_admin())):
    upd = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if "name" in upd and "slug" not in upd:
        upd["slug"] = slugify(upd["name"])
    if upd:
        await db.blog_categories.update_one({"id": category_id}, {"$set": upd})
    cat = await db.blog_categories.find_one({"id": category_id}, {"_id": 0})
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat

@api_router.delete("/blog/admin/categories/{category_id}")
async def delete_blog_category(category_id: str, user: dict = Depends(require_blog_admin())):
    r = await db.blog_categories.delete_one({"id": category_id})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}

# ======================== BLOG ADMIN - TAGS ========================

@api_router.post("/blog/admin/tags")
async def create_blog_tag(data: BlogTagCreate, user: dict = Depends(require_blog_admin())):
    slug = data.slug or slugify(data.name)
    existing = await db.blog_tags.find_one({"slug": slug})
    if existing:
        raise HTTPException(status_code=400, detail="Tag slug already exists")
    tag_id = str(uuid.uuid4())
    doc = {"id": tag_id, "name": data.name, "slug": slug, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.blog_tags.insert_one(doc)
    return {"id": tag_id, **{k: v for k, v in doc.items() if k != "_id"}}

@api_router.get("/blog/admin/tags")
async def list_blog_tags_admin(user: dict = Depends(require_blog_admin())):
    tags = await db.blog_tags.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    return tags

@api_router.put("/blog/admin/tags/{tag_id}")
async def update_blog_tag(tag_id: str, data: BlogTagUpdate, user: dict = Depends(require_blog_admin())):
    upd = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if "name" in upd and "slug" not in upd:
        upd["slug"] = slugify(upd["name"])
    if upd:
        await db.blog_tags.update_one({"id": tag_id}, {"$set": upd})
    tag = await db.blog_tags.find_one({"id": tag_id}, {"_id": 0})
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag

@api_router.delete("/blog/admin/tags/{tag_id}")
async def delete_blog_tag(tag_id: str, user: dict = Depends(require_blog_admin())):
    r = await db.blog_tags.delete_one({"id": tag_id})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tag not found")
    return {"message": "Tag deleted"}

# ======================== BLOG ADMIN - POSTS ========================

@api_router.post("/blog/admin/posts")
async def create_blog_post(data: BlogPostCreate, user: dict = Depends(require_blog_admin())):
    slug = data.slug or slugify(data.title)
    existing = await db.blog_posts.find_one({"slug": slug})
    if existing:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"
    now = datetime.now(timezone.utc).isoformat()
    post_id = str(uuid.uuid4())
    published_at = None
    if data.status == "published":
        published_at = data.published_at or now
    elif data.published_at:
        published_at = data.published_at
    doc = {
        "id": post_id, "title": data.title, "slug": slug, "excerpt": data.excerpt or "",
        "content": data.content, "featured_image": data.featured_image,
        "category_id": data.category_id, "tag_ids": data.tag_ids or [],
        "status": data.status, "published_at": published_at,
        "meta_title": data.meta_title, "meta_description": data.meta_description, "meta_keywords": data.meta_keywords,
        "allow_comments": data.allow_comments,
        "author_id": user["id"], "author_name": user.get("name", "Admin"),
        "created_at": now, "updated_at": now,
    }
    await db.blog_posts.insert_one(doc)
    return {"id": post_id, "slug": slug, **{k: v for k, v in doc.items() if k != "_id"}}

@api_router.get("/blog/admin/posts")
async def list_blog_posts_admin(
    status: Optional[str] = None,
    user: dict = Depends(require_blog_admin())
):
    q = {}
    if status:
        q["status"] = status
    posts = await db.blog_posts.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    for p in posts:
        if p.get("category_id"):
            cat = await db.blog_categories.find_one({"id": p["category_id"]}, {"_id": 0, "name": 1, "slug": 1})
            p["category"] = cat
    return posts

@api_router.get("/blog/admin/posts/{post_id}")
async def get_blog_post_admin(post_id: str, user: dict = Depends(require_blog_admin())):
    post = await db.blog_posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.get("category_id"):
        post["category"] = await db.blog_categories.find_one({"id": post["category_id"]}, {"_id": 0})
    if post.get("tag_ids"):
        post["tags"] = await db.blog_tags.find({"id": {"$in": post["tag_ids"]}}, {"_id": 0}).to_list(100)
    return post

@api_router.put("/blog/admin/posts/{post_id}")
async def update_blog_post(post_id: str, data: BlogPostUpdate, user: dict = Depends(require_blog_admin())):
    post = await db.blog_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    upd = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if "title" in upd and "slug" not in upd:
        upd["slug"] = slugify(upd["title"])
    upd["updated_at"] = datetime.now(timezone.utc).isoformat()
    if data.status == "published" and not post.get("published_at"):
        upd["published_at"] = datetime.now(timezone.utc).isoformat()
    await db.blog_posts.update_one({"id": post_id}, {"$set": upd})
    return await db.blog_posts.find_one({"id": post_id}, {"_id": 0})

@api_router.delete("/blog/admin/posts/{post_id}")
async def delete_blog_post(post_id: str, user: dict = Depends(require_blog_admin())):
    r = await db.blog_posts.delete_one({"id": post_id})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.blog_comments.delete_many({"post_id": post_id})
    return {"message": "Post deleted"}

@api_router.put("/blog/admin/posts/{post_id}/approve")
async def approve_blog_post(post_id: str, user: dict = Depends(require_roles("superadmin"))):
    post = await db.blog_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.blog_posts.update_one(
        {"id": post_id},
        {"$set": {"status": "published", "published_at": post.get("published_at") or datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Post approved"}

# ======================== BLOG PUBLIC ========================

@api_router.get("/blog/posts")
async def list_blog_posts_public(
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    page: int = 1,
    limit: int = 12,
):
    now = datetime.now(timezone.utc).isoformat()
    q = {"status": "published", "$or": [{"published_at": {"$lte": now}}, {"published_at": None}]}
    if category:
        cat = await db.blog_categories.find_one({"slug": category}, {"_id": 0, "id": 1})
        if cat:
            q["category_id"] = cat["id"]
    if tag:
        t = await db.blog_tags.find_one({"slug": tag}, {"_id": 0, "id": 1})
        if t:
            q["tag_ids"] = t["id"]
    if search:
        search_or = [
            {"title": {"$regex": search, "$options": "i"}},
            {"excerpt": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
        ]
        q = {"$and": [q, {"$or": search_or}]}
    if featured:
        q["featured"] = True
    skip = (page - 1) * limit
    cursor = db.blog_posts.find(q, {"_id": 0}).sort("published_at", -1).skip(skip).limit(limit)
    posts = await cursor.to_list(limit)
    total = await db.blog_posts.count_documents(q)
    for p in posts:
        if p.get("category_id"):
            p["category"] = await db.blog_categories.find_one({"id": p["category_id"]}, {"_id": 0})
        if p.get("tag_ids"):
            p["tags"] = await db.blog_tags.find({"id": {"$in": p["tag_ids"]}}, {"_id": 0}).to_list(100)
    return {"posts": posts, "total": total, "page": page, "limit": limit}

@api_router.get("/blog/posts/featured")
async def list_featured_posts(limit: int = 6):
    now = datetime.now(timezone.utc).isoformat()
    q = {"status": "published", "$or": [{"published_at": {"$lte": now}}, {"published_at": None}]}
    posts = await db.blog_posts.find(q, {"_id": 0}).sort("published_at", -1).limit(limit).to_list(limit)
    for p in posts:
        if p.get("category_id"):
            p["category"] = await db.blog_categories.find_one({"id": p["category_id"]}, {"_id": 0})
    return posts

@api_router.get("/blog/posts/{slug}")
async def get_blog_post_public(slug: str):
    now = datetime.now(timezone.utc).isoformat()
    post = await db.blog_posts.find_one(
        {"slug": slug, "status": "published", "$or": [{"published_at": {"$lte": now}}, {"published_at": None}]},
        {"_id": 0}
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.get("category_id"):
        post["category"] = await db.blog_categories.find_one({"id": post["category_id"]}, {"_id": 0})
    if post.get("tag_ids"):
        post["tags"] = await db.blog_tags.find({"id": {"$in": post["tag_ids"]}}, {"_id": 0}).to_list(100)
    # Related posts (same category or shared tags)
    base_q = {"id": {"$ne": post["id"]}, "status": "published", "$or": [{"published_at": {"$lte": now}}, {"published_at": None}]}
    if post.get("category_id") or post.get("tag_ids"):
        or_clauses = []
        if post.get("category_id"):
            or_clauses.append({"category_id": post["category_id"]})
        if post.get("tag_ids"):
            or_clauses.append({"tag_ids": {"$in": post["tag_ids"]}})
        related_q = {"$and": [base_q, {"$or": or_clauses}]}
    else:
        related_q = base_q
    related = await db.blog_posts.find(related_q, {"_id": 0}).limit(4).to_list(4)
    for r in related:
        if r.get("category_id"):
            r["category"] = await db.blog_categories.find_one({"id": r["category_id"]}, {"_id": 0})
    post["related_posts"] = related
    return post

@api_router.get("/blog/categories")
async def list_blog_categories_public():
    cats = await db.blog_categories.find({}, {"_id": 0}).sort("name", 1).to_list(100)
    return cats

@api_router.get("/blog/tags")
async def list_blog_tags_public():
    tags = await db.blog_tags.find({}, {"_id": 0}).sort("name", 1).to_list(200)
    return tags

@api_router.get("/blog/rss")
async def blog_rss_feed():
    now = datetime.now(timezone.utc).isoformat()
    q = {"status": "published", "$or": [{"published_at": {"$lte": now}}, {"published_at": None}]}
    posts = await db.blog_posts.find(q, {"_id": 0}).sort("published_at", -1).limit(50).to_list(50)
    base_url = os.environ.get("SITE_URL", "https://jobnexus.example.com")
    items = []
    for p in posts:
        items.append({
            "title": p["title"],
            "link": f"{base_url}/blog/{p['slug']}",
            "description": p.get("excerpt") or p.get("content", "")[:500],
            "pubDate": p.get("published_at") or p.get("created_at"),
        })
    return {"title": "JobNexus Blog", "link": f"{base_url}/blog", "items": items}

# ======================== BLOG COMMENTS (optional) ========================

@api_router.post("/blog/posts/{post_id}/comments")
async def create_blog_comment(post_id: str, data: BlogCommentCreate):
    post = await db.blog_posts.find_one({"id": post_id, "status": "published"}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if not post.get("allow_comments", True):
        raise HTTPException(status_code=400, detail="Comments disabled")
    comment_id = str(uuid.uuid4())
    doc = {
        "id": comment_id, "post_id": post_id, "author_name": data.author_name, "author_email": data.author_email,
        "content": data.content, "parent_id": data.parent_id, "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.blog_comments.insert_one(doc)
    return {"id": comment_id, "message": "Comment submitted for moderation"}

@api_router.get("/blog/posts/{post_id}/comments")
async def list_blog_comments_public(post_id: str):
    comments = await db.blog_comments.find({"post_id": post_id, "status": "approved"}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return comments

@api_router.put("/blog/admin/comments/{comment_id}/moderate")
async def moderate_blog_comment(comment_id: str, status: str, user: dict = Depends(require_blog_admin())):
    if status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be approved or rejected")
    r = await db.blog_comments.update_one({"id": comment_id}, {"$set": {"status": status}})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": f"Comment {status}"}

@api_router.get("/")
async def root():
    return {"message": "JobNexus API", "version": "1.0.0"}

# Include router
app.include_router(api_router)

# Serve uploaded blog images
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

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
    
    # Ensure uploads directory exists
    UPLOAD_DIR.mkdir(exist_ok=True)
    logger.info(f"Uploads directory ready: {UPLOAD_DIR}")
    
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=os.environ.get("DEV", "0") == "1",
    )
