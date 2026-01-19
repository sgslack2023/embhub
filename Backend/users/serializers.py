from rest_framework import serializers
from .models import CustomUser,UserActivities, Roles, GoogleDriveSettings
import json

class CreateUserSerializer(serializers.Serializer):
    email=serializers.EmailField()
    fullname=serializers.CharField()
    
    role=serializers.ChoiceField(Roles)

class LoginSerializer(serializers.Serializer):
        email=serializers.EmailField()
        password=serializers.CharField(required=False)
        is_new_user=serializers.BooleanField(default=False,required=False)


class UpdatePasswordSerializer(serializers.Serializer):
    user_id=serializers.CharField()
    password=serializers.CharField()

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model=CustomUser
        exclude=("password",)


class UserActivitiesSerializer(serializers.ModelSerializer):
    class Meta:
        model=UserActivities
        fields=("__all__")



class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return value
    

class ResetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(max_length=128)
    token = serializers.CharField(max_length=256)


class CreateGoogleDriveSettingsSerializer(serializers.Serializer):
    email = serializers.EmailField()
    service_account_json = serializers.FileField()
    shared_drive_name = serializers.CharField(max_length=255, required=False, default='EMB Test')
    root_folder_name = serializers.CharField(max_length=255, required=False, default='EMB')
    track123_api_key = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')

    def validate_service_account_json(self, value):
        # Check file extension
        if not value.name.endswith('.json'):
            raise serializers.ValidationError("File must be a JSON file (.json)")
        
        # Check file size (max 5MB)
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File size must be less than 5MB")
        
        try:
            # Read and validate JSON content
            content = value.read()
            value.seek(0)  # Reset file pointer
            json_data = json.loads(content.decode('utf-8'))
            
            # Basic validation for Google service account JSON structure
            required_fields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id']
            for field in required_fields:
                if field not in json_data:
                    raise serializers.ValidationError(f"Missing required field '{field}' in service account JSON")
            
            if json_data.get('type') != 'service_account':
                raise serializers.ValidationError("Invalid service account JSON: type must be 'service_account'")
                
            return value
        except json.JSONDecodeError:
            raise serializers.ValidationError("Invalid JSON format in uploaded file")
        except UnicodeDecodeError:
            raise serializers.ValidationError("File must be UTF-8 encoded")

    def validate_email(self, value):
        if GoogleDriveSettings.objects.filter(email=value).exists():
            raise serializers.ValidationError("Google Drive settings for this email already exist.")
        return value
    
    def validate_track123_api_key(self, value):
        # Allow empty string, but if provided, it should not be just whitespace
        if value and not value.strip():
            raise serializers.ValidationError("Track123 API key cannot be only whitespace.")
        return value.strip() if value else ''


class GoogleDriveSettingsSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.fullname', read_only=True)
    service_account_filename = serializers.SerializerMethodField()
    
    class Meta:
        model = GoogleDriveSettings
        fields = '__all__'

    def get_service_account_filename(self, obj):
        if obj.service_account_json:
            return obj.service_account_json.name.split('/')[-1]
        return None

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # For security, only show filename in list views
        if self.context.get('hide_file_path', False):
            if instance.service_account_json:
                representation['service_account_json'] = instance.service_account_json.name.split('/')[-1]
        return representation


class UpdateGoogleDriveSettingsSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    service_account_json = serializers.FileField(required=False)
    shared_drive_name = serializers.CharField(max_length=255, required=False)
    root_folder_name = serializers.CharField(max_length=255, required=False)
    track123_api_key = serializers.CharField(max_length=255, required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)

    def validate_service_account_json(self, value):
        if value is None:
            return value
            
        # Check file extension
        if not value.name.endswith('.json'):
            raise serializers.ValidationError("File must be a JSON file (.json)")
        
        # Check file size (max 5MB)
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File size must be less than 5MB")
        
        try:
            # Read and validate JSON content
            content = value.read()
            value.seek(0)  # Reset file pointer
            json_data = json.loads(content.decode('utf-8'))
            
            # Basic validation for Google service account JSON structure
            required_fields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id']
            for field in required_fields:
                if field not in json_data:
                    raise serializers.ValidationError(f"Missing required field '{field}' in service account JSON")
            
            if json_data.get('type') != 'service_account':
                raise serializers.ValidationError("Invalid service account JSON: type must be 'service_account'")
                
            return value
        except json.JSONDecodeError:
            raise serializers.ValidationError("Invalid JSON format in uploaded file")
        except UnicodeDecodeError:
            raise serializers.ValidationError("File must be UTF-8 encoded")

    def validate_email(self, value):
        # Check if email exists for other records (excluding current instance)
        instance = getattr(self, 'instance', None)
        if instance:
            if GoogleDriveSettings.objects.filter(email=value).exclude(id=instance.id).exists():
                raise serializers.ValidationError("Google Drive settings for this email already exist.")
        return value
    
    def validate_track123_api_key(self, value):
        # Allow empty string, but if provided, it should not be just whitespace
        if value and not value.strip():
            raise serializers.ValidationError("Track123 API key cannot be only whitespace.")
        return value.strip() if value else ''