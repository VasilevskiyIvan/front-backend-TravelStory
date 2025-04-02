from pydantic import BaseModel, EmailStr, Field, UUID4, field_validator
from datetime import datetime, date
from typing import Optional
import re
from enum import Enum
from uuid import UUID


class ReportStatusEnum(str, Enum):
    PRIVATE = 'private'
    PUBLIC = 'public'
    FRIENDS_ONLY = 'friends_only'

class VisibilityOptionEnum(str, Enum):
    PUBLIC = 'public'
    PRIVATE = 'private'
    FRIENDS_ONLY = 'friends_only'

class ReportBase(BaseModel):
    title: str
    description: str
    start_date: date
    end_date: date
    main_image: Optional[str] = None
    side_image: Optional[str] = None
    status: ReportStatusEnum
    likes_status: VisibilityOptionEnum
    comment_status: VisibilityOptionEnum
    addit_file_status: VisibilityOptionEnum
    html_path: str
    text_content: str

class ReportResponse(ReportBase):
    id: int
    user_id: UUID4
    created_at: datetime
    updated_at: Optional[datetime] = None
    duration: int
    likes: int = 0
    comments_count: int = 0

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

    @field_validator('password')
    def validate_password(cls, v):
        if not re.match(r'^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(-)|/=]).{8,}$', v):
            raise ValueError("Password must contain at least 1 uppercase letter, 1 digit and 1 special character")
        return v

class UserProfileResponse(BaseModel):
    user_id: UUID
    username: str
    avatar_url: str | None
    bio: str | None
    registration_date: datetime | None = None
    travel_stats: dict | None = None
    profile_visibility: str
    first_name: str | None = None
    last_name: str | None = None

class UserResponse(UserBase):
    user_id: UUID4
    avatar_url: Optional[str] = None
    registration_date: datetime
    last_login: Optional[datetime] = None
    bio: Optional[str] = None
    role: str
    account_status: str
    profile_visibility: str
    travel_stats: dict
    preferences: dict

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str

class PasswordResetCodeVerify(BaseModel):
    email: EmailStr
    code: str

class PasswordResetNewPassword(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=8)

    @field_validator('new_password')
    def validate_password(cls, v):
        if not re.match(r'^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(-)|/=]).{8,}$', v):
            raise ValueError("Password must contain at least 1 uppercase letter, 1 digit and 1 special character")
        return v

class UserFollowResponse(BaseModel):
    follower_id: UUID
    following_id: UUID
    created_at: datetime

class ChechSubscribersResponse(BaseModel):
    follower_id: UUID
    following_id: UUID
    created_at: datetime
    username: str