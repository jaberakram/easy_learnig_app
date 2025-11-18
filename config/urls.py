# config/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # CKEditor 5-এর URL
    path("ckeditor5/", include('django_ckeditor_5.urls'), name="ck_editor_5_upload_file"),

    # --- আমাদের অ্যাপের API ---
    path('api/', include('api.urls')),

    # --- Auth API ---
    path('api/auth/', include('dj_rest_auth.urls')),
    
    # (Optional) রেজিস্ট্রেশন এনপয়েন্ট যদি লাগে, তবে আনকমেন্ট করতে পারেন
    # path('api/auth/registration/', include('dj_rest_auth.registration.urls')),

    # --- FIX: এই লাইনটি যোগ করুন ---
    # allauth এর ইন্টারনাল URL (যেমন: socialaccount_signup) চেনার জন্য এটি জরুরি
    path('accounts/', include('allauth.urls')),
]