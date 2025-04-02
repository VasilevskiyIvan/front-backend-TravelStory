from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func, text
from sqlalchemy import event, ForeignKeyConstraint, PrimaryKeyConstraint
from sqlalchemy import Column, UUID, String, DateTime, Text, Date, Integer, ForeignKey, Table, CheckConstraint
from sqlalchemy import Float, Index, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
import uuid
from enum import Enum

Base = declarative_base()

# region Enums
class ReportStatusEnum(str, Enum):
    PRIVATE = 'private'
    PUBLIC = 'public'
    FRIENDS_ONLY = 'friends_only'

class VisibilityOptionEnum(str, Enum):
    PUBLIC = 'public'
    PRIVATE = 'private'
    FRIENDS_ONLY = 'friends_only'

class MediaFileTypeEnum(str, Enum):
    IMAGE = 'image'
    VIDEO = 'video'
    AUDIO = 'audio'
    DOCUMENT = 'document'

class AdditionalFileTypeEnum(str, Enum):
    IMAGE = 'image'
    DOCUMENT = 'document'
    OTHER = 'other'

class CollaboratorRoleEnum(str, Enum):
    EDITOR = 'editor'
    VIEWER = 'viewer'

class ProfileVisibilityEnum(str, Enum):
    PUBLIC = 'public'
    PRIVATE = 'private'
    FRIENDS_ONLY = 'friends_only'

class RoleEnum(str, Enum):
    USER = 'user'
    ADMIN = 'admin'
    MODERATOR = 'moderator'

class AccountStatusEnum(str, Enum):
    ACTIVE = 'active'
    SUSPENDED = 'suspended'
    DELETED = 'deleted'
# endregion

# region Ассоциативные таблицы
user_report_card = Table(
    "user_report_card",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.user_id")),
    Column("report_id", Integer, ForeignKey("reports.id")),
    ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
    ForeignKeyConstraint(['report_id'], ['reports.id'], ondelete='CASCADE'),
    Index('idx_user_report_card', "user_id", "report_id")
)

subscriptions = Table(
    "subscriptions",
    Base.metadata,
    Column("follower_id", UUID(as_uuid=True), ForeignKey("users.user_id")),
    Column("following_id", UUID(as_uuid=True), ForeignKey("users.user_id")),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    PrimaryKeyConstraint('follower_id', 'following_id'),
    Index('idx_subscriptions_follower', "follower_id"),
    Index('idx_subscriptions_following', "following_id")
)
# endregion

# region Основные модели
class Report(Base):
    __tablename__ = 'reports'

    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=False, index=True)

    # Общие поля
    title = Column(String(255), nullable=False)
    main_image = Column(String(512))

    # Поля из ReportCardContent
    description = Column(String(1000), nullable=False)
    side_image = Column(String(512))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    duration = Column(Integer, nullable=False)
    likes = Column(Integer, default=0, nullable=False)
    comments_count = Column(Integer, default=0, nullable=False)

    # Технические поля из Report
    html_path = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    status = Column(SQLEnum(ReportStatusEnum, name='report_status'), default=ReportStatusEnum.PRIVATE)

    likes_status = Column(
        SQLEnum(VisibilityOptionEnum, name='visibility_option'),
        default=VisibilityOptionEnum.PUBLIC,
        nullable=False
    )
    comment_status = Column(
        SQLEnum(VisibilityOptionEnum, name='visibility_option'),
        default=VisibilityOptionEnum.PUBLIC,
        nullable=False
    )
    addit_file_status = Column(
        SQLEnum(VisibilityOptionEnum, name='visibility_option'),
        default=VisibilityOptionEnum.PUBLIC,
        nullable=False
    )

    text_content = Column(Text, nullable=False)

    media_files = relationship('MediaFile', back_populates='report', cascade='all, delete-orphan')
    additional_files = relationship('AdditionalFile', back_populates='report', cascade='all, delete-orphan')
    collaborators = relationship('Collaborator', back_populates='report', cascade='all, delete-orphan')
    author = relationship('User', back_populates='authored_reports', foreign_keys=[user_id])
    users = relationship("User", secondary=user_report_card, back_populates="reports")

    __table_args__ = (
        CheckConstraint('end_date >= start_date', name='check_dates'),
        Index('ix_report_text_content', text("to_tsvector('english', text_content)"), postgresql_using='gin'),
        Index('idx_report_status', 'status'),
        Index('idx_report_user', 'user_id')
    )

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    registration_date = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))
    avatar_url = Column(String(512))
    first_name = Column(String(100))
    last_name = Column(String(100))
    bio = Column(Text)
    role = Column(SQLEnum(RoleEnum, name='user_role'), default=RoleEnum.USER)
    account_status = Column(SQLEnum(AccountStatusEnum, name='account_status'), default=AccountStatusEnum.ACTIVE)
    profile_visibility = Column(SQLEnum(ProfileVisibilityEnum, name='profile_visibility'), default=ProfileVisibilityEnum.PUBLIC)
    travel_stats = Column(JSONB, default=lambda: {"countries": [], "kilometers": 0})
    preferences = Column(JSONB, default=lambda: {"theme": "light", "notifications": True})

    # Связи
    authored_reports = relationship('Report', back_populates='author')
    reports = relationship("Report", secondary=user_report_card, back_populates="users")
    achievements = relationship('Achievement', back_populates='user', cascade='all, delete-orphan')
    travel_records = relationship('TravelMap', back_populates='user', cascade='all, delete-orphan')

    __table_args__ = (
        Index('ix_user_travel_stats', travel_stats, postgresql_using='gin'),
        Index('idx_user_email', 'email'),
        Index('idx_user_username', 'username')
    )
# endregion

# region Вспомогательные модели
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    email = Column(String(255), primary_key=True)
    reset_code = Column(String(8), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    attempts = Column(Integer, default=0)

class MediaFile(Base):
    __tablename__ = 'media_files'

    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey('reports.id', ondelete='CASCADE'), nullable=False, index=True)
    file_path = Column(Text, nullable=False)
    file_type = Column(SQLEnum(MediaFileTypeEnum, name='media_file_type'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    file_metadata = Column(JSONB)
    file_hash = Column(String(64))
    report = relationship('Report', back_populates='media_files')

class AdditionalFile(Base):
    __tablename__ = 'additional_files'

    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey('reports.id', ondelete='CASCADE'), nullable=False, index=True)
    file_path = Column(Text, nullable=False)
    file_type = Column(SQLEnum(AdditionalFileTypeEnum, name='additional_file_type'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    report = relationship('Report', back_populates='additional_files')

class Collaborator(Base):
    __tablename__ = 'collaborators'

    report_id = Column(Integer, ForeignKey('reports.id', ondelete='CASCADE'), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id'), primary_key=True)
    role = Column(SQLEnum(CollaboratorRoleEnum, name='collaborator_role'), nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    report = relationship('Report', back_populates='collaborators')

class Achievement(Base):
    __tablename__ = 'achievements'

    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(Text, nullable=False)
    description = Column(Text)
    icon_path = Column(Text)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship('User', back_populates='achievements')

class TravelMap(Base):
    __tablename__ = 'travel_map'

    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)
    location = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    visited_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship('User', back_populates='travel_records')

    __table_args__ = (
        CheckConstraint('latitude >= -90 AND latitude <= 90', name='check_latitude'),
        CheckConstraint('longitude >= -180 AND longitude <= 180', name='check_longitude'),
        Index('idx_coordinates', 'latitude', 'longitude')
    )
# endregion

# Триггеры
def update_duration(mapper, connection, target):
    if target.start_date and target.end_date:
        target.duration = (target.end_date - target.start_date).days

event.listen(Report, 'before_insert', update_duration)
event.listen(Report, 'before_update', update_duration)