# Create your models here.
from django.db import models
from datetime import timedelta
from django.utils import timezone

# Create your models here.
from django.contrib.auth.models import (
    AbstractBaseUser, PermissionsMixin, BaseUserManager
)

Roles=(("admin","admin"),("salesperson","salesperson"),("manager","manager"))

def default_expiry():
    return timezone.now() + timedelta(hours=1)


class CustomUserManager(BaseUserManager):
    def create_superuser(self,email,password,**extra_fields):
        extra_fields.setdefault('is_staff',True)
        extra_fields.setdefault('is_superuser',True)
        extra_fields.setdefault('is_active',True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True")
        
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")
        
        if not email:
            raise ValueError("Email field is required")

        user =self.model(email=email,**extra_fields)
        user.set_password(password)
        user.save()
        return user 

class CustomUser(AbstractBaseUser,PermissionsMixin):
    fullname=models.CharField(max_length = 150)
    role = models.CharField(max_length = 150,choices= Roles)
    email = models.EmailField(unique = True)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    is_staff=models.BooleanField(default=False)
    is_superuser=models.BooleanField(default=False)
    is_active=models.BooleanField(default=True)
    last_login=models.DateTimeField(null=True)

    USERNAME_FIELD="email"
    objects=CustomUserManager()

    def __str__(self):
        return self.email
    
    class Meta:
        ordering=("created_at",)


class UserActivities(models.Model):
    user=models.ForeignKey(CustomUser,related_name="user_activities",null=True, on_delete=models.SET_NULL)
    email = models.EmailField()
    fullname=models.CharField(max_length = 255)
    action = models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering=("-created_at",)

    def __str__(self):
        return f"{self.fullname} {self.action} on {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    


class ResetPasswordToken(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    token = models.CharField(max_length=256)
    expiry = models.DateTimeField(default=default_expiry) 

    def is_valid(self):
        return self.expiry >= timezone.now()


class GoogleDriveSettings(models.Model):
    email = models.EmailField(unique=True)
    service_account_json = models.FileField(upload_to='service_accounts/')
    shared_drive_name = models.CharField(max_length=255, default='EMB Test', help_text='Name of the shared Google Drive')
    root_folder_name = models.CharField(max_length=255, default='EMB', help_text='Name of the root folder within the shared drive')
    track123_api_key = models.CharField(max_length=255, blank=True, default='', help_text='Track123 API key for package tracking')
    created_by = models.ForeignKey(CustomUser, related_name="gdrive_settings", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "Google Drive Setting"
        verbose_name_plural = "Google Drive Settings"

    def __str__(self):
        return f"{self.email} - Google Drive Config"

