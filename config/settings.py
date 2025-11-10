# config/settings.py

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'django-insecure-...' # আপনার আসল কী এখানে থাকবে
DEBUG = True
ALLOWED_HOSTS = ['192.168.0.200', 'localhost', '127.0.0.1']

# --- (পরিবর্তিত) Application definition ---

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # আমাদের অ্যাপ
    'rest_framework',
    'django_ckeditor_5',
    'django_filters',
    'api',
    
    # Auth অ্যাপস (সম্পূর্ণ)
    'django.contrib.sites', 
    'allauth',
    'allauth.account',
    'allauth.socialaccount', # <-- সোশ্যাল লগইনের জন্য
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'rest_framework.authtoken',

    # --- (নতুন) গুগল প্রোভাইডার ---
    'allauth.socialaccount.providers.google',
]
# ------------------------------------

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware', 
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'easy_learning_db',
        'USER': 'easy_learning_user',
        'PASSWORD': 'akram22883', # আপনার পাসওয়ার্ড
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# মিডিয়া এবং CKEditor (অপরিবর্তিত)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
CKEDITOR_5_CONFIGS = {
    'default': {
        'toolbar': ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|', 'outdent', 'indent', '|', 'imageUpload', 'blockQuote', 'insertTable', 'undo', 'redo'],
        'image': { 'toolbar': ['imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|', 'toggleImageCaption', 'imageTextAlternative'] },
        'table': { 'contentToolbar': ['tableColumn', 'tableRow', 'mergeTableCells'] },
    },
}

# --- (পরিবর্তিত) Authentication কনফিগারেশন ---

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
}
SITE_ID = 1

# --- (গুরুত্বপূর্ণ) allauth নতুন এবং পরিষ্কার সেটিংস ---

# (পরিবর্তন) আমরা এখন ইউজারনেমের বদলে ইমেইল দিয়ে লগইন করাবো
ACCOUNT_AUTHENTICATION_METHOD = 'email' 
ACCOUNT_EMAIL_VERIFICATION = 'none' # (চাইলে 'mandatory' করতে পারেন)
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False # <-- গুগল লগইনের জন্য এটি False করা ভালো
ACCOUNT_SIGNUP_PASSWORD_ENTER_TWICE = False # (এটি dj_rest_auth এর জন্য)

# --- (নতুন) গুগল সেটিংস ---
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        },
        'OAUTH_PKCE_ENABLED': True,
    }
}

# --- (নতুন) dj-rest-auth অ্যাডাপ্টার ---
# এটি React Native থেকে পাঠানো টোকেন গ্রহণ করার জন্য
REST_AUTH = {
    'SOCIAL_LOGIN_AAPTER': 'allauth.socialaccount.adapter.DefaultSocialAccountAdapter'
}