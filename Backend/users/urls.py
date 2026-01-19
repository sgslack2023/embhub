from rest_framework import routers,urlpatterns
from .views import(CreateUserView,LoginView,UpdatePasswordView,MeView,UserActivitiesView,UsersView)

from .views import(ForgotPasswordView,ResetPasswordView)
from .views import(CreateGoogleDriveSettingsView,GoogleDriveSettingsView)

from rest_framework.routers import DefaultRouter
from django.urls import path
from django.urls.conf import include

router=DefaultRouter(trailing_slash=False)

router.register("create-user",CreateUserView,'create-user')
router.register("login",LoginView,'login')
router.register("update-password",UpdatePasswordView,'update-password')

router.register("users",UsersView,'users')
router.register("activities-log",UserActivitiesView,'activities-log')
router.register("Me",MeView,'Me')

router.register("ForgotPasswordView",ForgotPasswordView,'ForgotPasswordView')
router.register("ResetPasswordView",ResetPasswordView,'ResetPasswordView')

router.register("create-googledrive-settings",CreateGoogleDriveSettingsView,'create-googledrive-settings')
router.register("googledrive-settings",GoogleDriveSettingsView,'googledrive-settings')



urlpatterns = [
    path("",include(router.urls))
]
