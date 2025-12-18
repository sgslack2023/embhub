from rest_framework.viewsets import ModelViewSet
from .serializers import (CreateUserSerializer,CustomUser,LoginSerializer,
                          UpdatePasswordSerializer,CustomUserSerializer,
                          UserActivities, UserActivitiesSerializer,
                          ForgotPasswordSerializer,ResetPasswordSerializer,
                          CreateGoogleDriveSettingsSerializer,GoogleDriveSettingsSerializer,
                          UpdateGoogleDriveSettingsSerializer,GoogleDriveSettings)
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from .models import ResetPasswordToken
from django.utils import timezone
import secrets
import string
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from django.db import transaction
from django.contrib.auth import authenticate
from datetime import datetime
from back_sinan.utils import get_access_token
from back_sinan.custom_methods import isAuthenticatedCustom

from django.core.mail import send_mail

import io

def add_user_activity(user,action):
    UserActivities.objects.create(
        user_id=user.id,
        email=user.email,
        fullname=user.fullname,
        action=action
    )


class CreateUserView(ModelViewSet):
    http_method_names=["post"]
    queryset=CustomUser.objects.all()
    serializer_class=CreateUserSerializer
    permission_classes=(isAuthenticatedCustom,)

    def create(self,request):
        valid_request=self.serializer_class(data=request.data)
        valid_request.is_valid(raise_exception=True)
        user = CustomUser(**valid_request.validated_data)
        user.save()

            # Send welcome email
        send_mail(
                'Welcome to our platform',
                'Hello {},\n\nWelcome to our platform. We are excited to have you on board. Please set up your password at the following link: https://govfleet.online/check-user'.format(user.fullname),
                settings.EMAIL_HOST_USER,
                [user.email],
                fail_silently=False,
                )        
        add_user_activity(request.user,"added new user")
        return Response({"succes":"user created succesfully"},status=status.HTTP_201_CREATED)  
    

class LoginView(ModelViewSet):
    http_method_names=["post"]
    queryset=CustomUser.objects.all()
    serializer_class=LoginSerializer

    def create(self,request):
        valid_request=self.serializer_class(data=request.data)
        valid_request.is_valid(raise_exception=True)

        new_user=valid_request.validated_data["is_new_user"]

        if new_user:
            user=CustomUser.objects.filter(email=valid_request.validated_data["email"])

            if user:
                user=user[0]
                if not user.password:
                    return Response ({"user_id":user.id})
                else:
                    raise Exception("User has password already")
            else:
                raise Exception("User with email not found")
        
        user=authenticate(
            username=valid_request.validated_data["email"],
            password=valid_request.validated_data.get("password",None)
            )
        if not user:
            return Response({"error":"Invalid email or password"},status=status.HTTP_400_BAD_REQUEST)
        access=get_access_token({"user_id":user.id},1)
        user.last_login=datetime.now()
        user.save()
        add_user_activity(user,"logged in")
        
        return Response ({"access":access,"role":user.role,"id":user.id,"fullname":user.fullname})


class UpdatePasswordView(ModelViewSet):
    serializer_class=UpdatePasswordSerializer
    http_method_names=["post"]
    queryset=CustomUser.objects.all()
    
    def create(self,request):
        valid_request=self.serializer_class(data=request.data)
        valid_request.is_valid(raise_exception=True)

        user=CustomUser.objects.filter(id=valid_request.validated_data["user_id"])

        if not user:
            raise Exception("User with Id not found")
        
        user=user[0]

        user.set_password(valid_request.validated_data["password"])
        user.save()
        add_user_activity(user,"updated password")
        return Response ({"success":"user password updated"})
    

class MeView(ModelViewSet):
    serializer_class=CustomUserSerializer
    http_method_names=["get"]
    queryset=CustomUser.objects.all()
    permission_classes=(isAuthenticatedCustom,)

    def list(self,request):
        data=self.serializer_class(request.user).data    
        return  Response(data)


class UserActivitiesView(ModelViewSet):
    serializer_class=UserActivitiesSerializer
    http_method_names=["get"]
    queryset=UserActivities.objects.select_related("user")
    permission_classes=(isAuthenticatedCustom,)


class UsersView(ModelViewSet):
    serializer_class=CustomUserSerializer
    queryset=CustomUser.objects.all()
    permission_classes=(isAuthenticatedCustom,)

    def list(self,request):
        users=self.queryset.filter(is_superuser=False)
        data=self.serializer_class(users,many=True).data
        return  Response(data)


class CreateGoogleDriveSettingsView(ModelViewSet):
    http_method_names=["post"]
    queryset=GoogleDriveSettings.objects.all()
    serializer_class=CreateGoogleDriveSettingsSerializer
    permission_classes=(isAuthenticatedCustom,)

    def create(self, request):
        valid_request = self.serializer_class(data=request.data)
        valid_request.is_valid(raise_exception=True)
        
        # Create the Google Drive settings with the authenticated user
        gdrive_settings = GoogleDriveSettings(
            email=valid_request.validated_data["email"],
            service_account_json=valid_request.validated_data["service_account_json"],
            created_by=request.user
        )
        # Set optional fields if provided
        if 'shared_drive_name' in valid_request.validated_data:
            gdrive_settings.shared_drive_name = valid_request.validated_data["shared_drive_name"]
        if 'root_folder_name' in valid_request.validated_data:
            gdrive_settings.root_folder_name = valid_request.validated_data["root_folder_name"]
        if 'track123_api_key' in valid_request.validated_data:
            gdrive_settings.track123_api_key = valid_request.validated_data["track123_api_key"]
        gdrive_settings.save()
        
        add_user_activity(request.user, "added new Google Drive settings")
        return Response({"success": "Google Drive settings created successfully"}, status=status.HTTP_201_CREATED)


class GoogleDriveSettingsView(ModelViewSet):
    serializer_class=GoogleDriveSettingsSerializer
    queryset=GoogleDriveSettings.objects.select_related("created_by")
    permission_classes=(isAuthenticatedCustom,)
    http_method_names=["get", "put", "delete"]

    def list(self, request):
        settings = self.queryset.all()
        # Hide file paths in list view for security
        serializer = self.serializer_class(settings, many=True, context={'hide_file_path': True})
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        try:
            setting = self.queryset.get(pk=pk)
            serializer = self.serializer_class(setting)
            return Response(serializer.data)
        except GoogleDriveSettings.DoesNotExist:
            return Response({"error": "Google Drive settings not found"}, status=status.HTTP_404_NOT_FOUND)

    def update(self, request, pk=None):
        try:
            setting = self.queryset.get(pk=pk)
            serializer = UpdateGoogleDriveSettingsSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Update fields if provided
            for field, value in serializer.validated_data.items():
                setattr(setting, field, value)
            
            setting.save()
            add_user_activity(request.user, f"updated Google Drive settings for {setting.email}")
            
            response_serializer = self.serializer_class(setting)
            return Response(response_serializer.data)
        except GoogleDriveSettings.DoesNotExist:
            return Response({"error": "Google Drive settings not found"}, status=status.HTTP_404_NOT_FOUND)

    def destroy(self, request, pk=None):
        try:
            setting = self.queryset.get(pk=pk)
            email = setting.email
            setting.delete()
            add_user_activity(request.user, f"deleted Google Drive settings for {email}")
            return Response({"success": "Google Drive settings deleted successfully"}, status=status.HTTP_200_OK)
        except GoogleDriveSettings.DoesNotExist:
            return Response({"error": "Google Drive settings not found"}, status=status.HTTP_404_NOT_FOUND)


class ForgotPasswordView(ModelViewSet):
    serializer_class = ForgotPasswordSerializer
    queryset = ResetPasswordToken.objects.all()

    def create(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        user = CustomUser.objects.get(email=email)
        
        token = self.generate_token()
        
        # Create ResetPasswordToken object with the generated token
        reset_password_token = ResetPasswordToken.objects.create(user=user, token=token)
        
        reset_password_link = f"{settings.RESET_URL}"
        email_message = f"Use the following link to reset your password: {reset_password_link}\n"
        email_message += f"Use the following token: {token}"

        # Send email
        send_mail(
            'Password Reset',
            email_message,
            settings.EMAIL_HOST_USER,
            [user.email],
            fail_silently=False,
        )
        return Response({'message': 'Reset password link sent successfully'}, status=status.HTTP_200_OK)

    def generate_token(self):
            # Generate a random token using a combination of letters and digits
        characters = string.ascii_letters + string.digits
        token_length = 32  # You can adjust the length of the token as needed
        return ''.join(secrets.choice(characters) for i in range(token_length))

class ResetPasswordView(ModelViewSet):
    serializer_class = ForgotPasswordSerializer
    queryset = ResetPasswordToken.objects.all()

    def create(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        password = serializer.validated_data['password']
        
        try:
            reset_password_token = ResetPasswordToken.objects.get(token=token)
        except ResetPasswordToken.DoesNotExist:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        
        if reset_password_token.expiry < timezone.now():
            return Response({'error': 'Token expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = reset_password_token.user
        user.set_password(password)
        user.save()
        
        reset_password_token.delete()
        
        return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)
