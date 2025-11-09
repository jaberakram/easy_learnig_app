"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""


# config/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # CKEditor 5-এর URL
    path("ckeditor5/", include('django_ckeditor_5.urls'), name="ck_editor_5_upload_file"),

    # --- আমাদের অ্যাপের API ---
    path('api/', include('api.urls')),

    # --- নতুন: ইউজার Auth API (ধাপ ৫৫) ---
    # /api/auth/login/ , /api/auth/logout/ ইত্যাদি URL এখানে থাকবে
    path('api/auth/', include('dj_rest_auth.urls')),
    
    # /api/auth/registration/ URL এখানে থাকবে
    #path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
]


