import json
import tempfile
import os
from typing import List, Dict, Optional, Any
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
from users.models import GoogleDriveSettings
import io

class GoogleDriveService:
    """Google Drive service for managing folders and files using service account credentials"""
    
    def __init__(self, email: str):
        """Initialize the service with a specific Google Drive settings email"""
        self.email = email
        self.service = None
        self.credentials = None
        self.settings = None
        self._initialize_service()
    
    def _initialize_service(self):
        """Initialize the Google Drive service with credentials from database"""
        try:
            print(f"Looking for GoogleDriveSettings for email: {self.email}")
            # Get the Google Drive settings for this email
            self.settings = GoogleDriveSettings.objects.get(email=self.email, is_active=True)
            print(f"Found settings: {self.settings}")
            
            # Read the service account JSON file
            service_account_path = self.settings.service_account_json.path
            print(f"Service account path: {service_account_path}")
            
            # Check if file exists
            if not os.path.exists(service_account_path):
                raise Exception(f"Service account file not found at: {service_account_path}")
            
            print(f"Service account file exists, loading credentials...")
            # Load credentials from the JSON file
            self.credentials = service_account.Credentials.from_service_account_file(
                service_account_path,
                scopes=['https://www.googleapis.com/auth/drive']
            )
            print("Credentials loaded successfully")
            
            # Build the Drive service
            self.service = build('drive', 'v3', credentials=self.credentials)
            print("Google Drive service built successfully")
            
        except GoogleDriveSettings.DoesNotExist:
            print(f"No active Google Drive settings found for email: {self.email}")
            raise Exception(f"No active Google Drive settings found for email: {self.email}")
        except Exception as e:
            print(f"Error initializing Google Drive service: {str(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Failed to initialize Google Drive service: {str(e)}")
    
    def get_shared_drive_id(self) -> Optional[str]:
        """Get the configured shared drive ID"""
        try:
            shared_drive_name = self.settings.shared_drive_name
            print(f"Searching for '{shared_drive_name}' shared drive...")
            results = self.service.drives().list().execute()
            drives = results.get('drives', [])
            
            print(f"Found {len(drives)} shared drives:")
            for drive in drives:
                print(f"  - {drive['name']} (ID: {drive['id']})")
                if drive['name'] == shared_drive_name:
                    print(f"Found {shared_drive_name} shared drive: {drive['id']}")
                    return drive['id']
            
            print(f"{shared_drive_name} shared drive not found in available drives")
            if not drives:
                print("No shared drives found - service account may not have access to any shared drives")
            return None
            
        except HttpError as e:
            print(f"HttpError getting shared drives: {str(e)}")
            return None

    def get_root_folder(self) -> Optional[Dict]:
        """Get or create the main root folder in shared drive"""
        try:
            # Get the shared drive ID
            shared_drive_id = self.get_shared_drive_id()
            shared_drive_name = self.settings.shared_drive_name
            root_folder_name = self.settings.root_folder_name
            
            if not shared_drive_id:
                raise Exception(f"{shared_drive_name} shared drive not found. Please make sure it exists and the service account has access.")
            
            print(f"Searching for existing {root_folder_name} folder in shared drive...")
            # Search for existing root folder in the shared drive
            query = f"name='{root_folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '{shared_drive_id}' in parents"
            print(f"Query: {query}")
            results = self.service.files().list(
                q=query, 
                fields="files(id, name, parents)",
                driveId=shared_drive_id,
                includeItemsFromAllDrives=True,
                supportsAllDrives=True,
                corpora='drive'
            ).execute()
            
            items = results.get('files', [])
            print(f"Found {len(items)} {root_folder_name} folders in shared drive")
            
            if items:
                print(f"Using existing {root_folder_name} folder: {items[0]}")
                return items[0]
            else:
                print(f"No {root_folder_name} folder found in shared drive, creating new one...")
                # Create root folder in shared drive root
                file_metadata = {
                    'name': root_folder_name,
                    'mimeType': 'application/vnd.google-apps.folder',
                    'parents': [shared_drive_id]
                }
                
                folder = self.service.files().create(
                    body=file_metadata,
                    fields='id, name, createdTime, modifiedTime, parents',
                    supportsAllDrives=True
                ).execute()
                
                print(f"Created new {root_folder_name} folder in shared drive: {folder}")
                return folder
                
        except HttpError as e:
            print(f"HttpError in get_root_folder: {str(e)}")
            raise Exception(f"Error accessing root folder: {str(e)}")
        except Exception as e:
            print(f"Unexpected error in get_root_folder: {str(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Error accessing root folder: {str(e)}")
    
    def list_folders(self, parent_id: Optional[str] = None) -> List[Dict]:
        """List all folders in the specified parent folder"""
        try:
            if parent_id is None:
                # Get root folder first
                root_folder = self.get_root_folder()
                parent_id = root_folder['id']
            
            query = f"'{parent_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
            results = self.service.files().list(
                q=query,
                fields="files(id, name, createdTime, modifiedTime, parents)",
                orderBy="name",
                includeItemsFromAllDrives=True,
                supportsAllDrives=True
            ).execute()
            
            return results.get('files', [])
            
        except HttpError as e:
            raise Exception(f"Error listing folders: {str(e)}")
    
    def list_files(self, folder_id: str) -> List[Dict]:
        """List all files in the specified folder"""
        try:
            query = f"'{folder_id}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false"
            results = self.service.files().list(
                q=query,
                fields="files(id, name, size, mimeType, createdTime, modifiedTime, webViewLink)",
                orderBy="name",
                includeItemsFromAllDrives=True,
                supportsAllDrives=True
            ).execute()
            
            return results.get('files', [])
            
        except HttpError as e:
            raise Exception(f"Error listing files: {str(e)}")
    
    def create_folder(self, name: str, parent_id: Optional[str] = None) -> Dict:
        """Create a new folder in shared drive"""
        try:
            print(f"Creating folder '{name}' with parent_id: {parent_id}")
            
            if parent_id is None:
                # Get the EMB folder as parent
                print("Getting EMB folder as parent...")
                root_folder = self.get_root_folder()
                parent_id = root_folder['id']
                print(f"Using EMB folder as parent: {parent_id}")
            
            file_metadata = {
                'name': name,
                'mimeType': 'application/vnd.google-apps.folder',
                'parents': [parent_id]
            }
            
            print(f"File metadata: {file_metadata}")
            folder = self.service.files().create(
                body=file_metadata,
                fields='id, name, createdTime, modifiedTime, parents',
                supportsAllDrives=True
            ).execute()
            
            print(f"Successfully created folder: {folder}")
            return folder
            
        except HttpError as e:
            print(f"HttpError creating folder: {str(e)}")
            raise Exception(f"Error creating folder: {str(e)}")
        except Exception as e:
            print(f"Unexpected error creating folder: {str(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Error creating folder: {str(e)}")
    
    def delete_folder(self, folder_id: str) -> bool:
        """Delete a folder from shared drive"""
        try:
            print(f"Deleting folder with ID: {folder_id}")
            self.service.files().delete(
                fileId=folder_id,
                supportsAllDrives=True
            ).execute()
            print(f"Folder deleted successfully")
            return True
            
        except HttpError as e:
            print(f"HttpError deleting folder: {str(e)}")
            raise Exception(f"Error deleting folder: {str(e)}")
    
    def upload_file(self, file_path: str, file_name: str, folder_id: str, mime_type: str = None) -> Dict:
        """Upload a file to the specified folder"""
        try:
            file_metadata = {
                'name': file_name,
                'parents': [folder_id]
            }
            
            media = MediaFileUpload(file_path, mimetype=mime_type, resumable=True)
            
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, size, mimeType, createdTime, modifiedTime, webViewLink',
                supportsAllDrives=True
            ).execute()
            
            return file
            
        except HttpError as e:
            raise Exception(f"Error uploading file: {str(e)}")
    
    def delete_file(self, file_id: str) -> bool:
        """Delete a file (move to trash)"""
        try:
            self.service.files().delete(
                fileId=file_id,
                supportsAllDrives=True
            ).execute()
            return True
            
        except HttpError as e:
            raise Exception(f"Error deleting file: {str(e)}")
    
    def share_with_account_owner(self, file_id: str, role: str = 'writer') -> bool:
        """Share a file/folder with the account owner (personal Google account)"""
        try:
            print(f"Sharing file {file_id} with account owner: {self.email}")
            
            permission = {
                'type': 'user',
                'role': role,  # 'reader', 'writer', or 'owner'
                'emailAddress': self.email
            }
            
            self.service.permissions().create(
                fileId=file_id,
                body=permission,
                sendNotificationEmail=False  # Don't send email notification
            ).execute()
            
            print(f"Successfully shared with {self.email}")
            return True
            
        except HttpError as e:
            print(f"Error sharing file: {str(e)}")
            # Don't fail the creation if sharing fails
            return False

    def get_folder_tree(self, parent_id: Optional[str] = None) -> Dict:
        """Get the complete folder tree structure"""
        try:
            if parent_id is None:
                # Start from root folder
                root_folder = self.get_root_folder()
                parent_id = root_folder['id']
                folder_info = root_folder
            else:
                # Get folder info
                folder_info = self.service.files().get(
                    fileId=parent_id,
                    fields="id, name, createdTime, modifiedTime, parents"
                ).execute()
            
            # Get subfolders
            subfolders = self.list_folders(parent_id)
            
            # Get files
            files = self.list_files(parent_id)
            
            # Recursively build tree for subfolders
            folder_tree = {
                'id': folder_info['id'],
                'name': folder_info['name'],
                'type': 'folder',
                'createdTime': folder_info.get('createdTime'),
                'modifiedTime': folder_info.get('modifiedTime'),
                'children': [],
                'files': files
            }
            
            for subfolder in subfolders:
                subfolder_tree = self.get_folder_tree(subfolder['id'])
                folder_tree['children'].append(subfolder_tree)
            
            return folder_tree
            
        except HttpError as e:
            raise Exception(f"Error building folder tree: {str(e)}")
    
    def get_folder_path(self, folder_id: str) -> List[Dict]:
        """Get the full path from root to the specified folder"""
        try:
            path = []
            current_id = folder_id
            shared_drive_id = self.get_shared_drive_id()
            
            while current_id:
                folder = self.service.files().get(
                    fileId=current_id,
                    fields="id, name, parents",
                    supportsAllDrives=True
                ).execute()
                
                path.insert(0, {
                    'id': folder['id'],
                    'name': folder['name']
                })
                
                # Move to parent
                parents = folder.get('parents', [])
                if parents:
                    parent_id = parents[0]
                    # Stop if we reach the shared drive root or EMB folder
                    if parent_id == shared_drive_id or folder['name'] == 'EMB':
                        break
                    current_id = parent_id
                else:
                    break
            
            return path
            
        except HttpError as e:
            raise Exception(f"Error getting folder path: {str(e)}")
    
    def search_files(self, query: str, folder_id: Optional[str] = None) -> List[Dict]:
        """Search for files by name"""
        try:
            search_query = f"name contains '{query}' and trashed=false"
            
            if folder_id:
                search_query += f" and '{folder_id}' in parents"
            
            results = self.service.files().list(
                q=search_query,
                fields="files(id, name, size, mimeType, createdTime, modifiedTime, webViewLink, parents)",
                orderBy="name"
            ).execute()
            
            return results.get('files', [])
            
        except HttpError as e:
            raise Exception(f"Error searching files: {str(e)}")

    def format_file_size(self, size_bytes: int) -> str:
        """Format file size in human readable format"""
        if not size_bytes:
            return "0 B"
        
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} PB"

    def download_file(self, file_id: str, destination_path: str) -> bool:
        """Download a file from Google Drive to local path"""
        try:
            request = self.service.files().get_media(fileId=file_id)
            
            with open(destination_path, 'wb') as f:
                downloader = MediaIoBaseDownload(f, request)
                done = False
                while done is False:
                    status, done = downloader.next_chunk()
            
            return True
            
        except HttpError as e:
            raise Exception(f"Error downloading file: {str(e)}")
        except Exception as e:
            raise Exception(f"Error downloading file: {str(e)}")
    
    def get_file_content(self, file_id: str) -> bytes:
        """Get file content as bytes for serving through API"""
        try:
            request = self.service.files().get_media(fileId=file_id)
            
            file_content = io.BytesIO()
            downloader = MediaIoBaseDownload(file_content, request)
            done = False
            while done is False:
                status, done = downloader.next_chunk()
            
            file_content.seek(0)  # Reset to beginning
            return file_content.read()
            
        except HttpError as e:
            raise Exception(f"Error getting file content: {str(e)}")
        except Exception as e:
            raise Exception(f"Error getting file content: {str(e)}")
    
    def get_file_info(self, file_id: str) -> Dict:
        """Get file metadata"""
        try:
            file_info = self.service.files().get(
                fileId=file_id,
                fields='id, name, size, mimeType, createdTime, modifiedTime, webViewLink',
                supportsAllDrives=True
            ).execute()
            
            return file_info
            
        except HttpError as e:
            raise Exception(f"Error getting file info: {str(e)}")
        except Exception as e:
            raise Exception(f"Error getting file info: {str(e)}")
    
    def get_folder_name(self, folder_id: str) -> str:
        """Get the name of a folder by its ID"""
        try:
            folder = self.service.files().get(
                fileId=folder_id,
                fields="name",
                supportsAllDrives=True
            ).execute()
            return folder.get('name', '')
        except HttpError as e:
            raise Exception(f"Error getting folder name: {str(e)}")

    @classmethod
    def get_available_drive_accounts(cls) -> List[Dict]:
        """Get all available Google Drive accounts from settings"""
        try:
            settings = GoogleDriveSettings.objects.filter(is_active=True).values(
                'id', 'email', 'created_by__fullname', 'created_at'
            )
            return list(settings)
        except Exception as e:
            return [] 