# config/settings.py

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-...' # আপনার আসল কী এখানে থাকবে

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['192.168.0.200', 'localhost', '127.0.0.1']


# Application definition

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
    'allauth.socialaccount',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'rest_framework.authtoken',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware', # <-- (allauth-এর মিডলওয়্যার)
]

ROOT_URLCONF = 'config.urls'


# --- (নতুন) TEMPLATES কনফিগারেশন (Error E403 সমাধান) ---
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
# ----------------------------------------------------

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
# ... (পাসওয়ার্ড ভ্যালিডেশন যেমন ছিল তেমনই থাকবে) ...
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


# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# --- কাস্টম কনফিগারেশন (সবশেষে) ---

# মিডিয়া ফাইল (ছবি/মাইন্ড ম্যাপ) আপলোডের জন্য
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# CKEditor 5 কনফিগারেশন
CKEDITOR_5_CONFIGS = {
    'default': {
        'toolbar': ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|', 'outdent', 'indent', '|', 'imageUpload', 'blockQuote', 'insertTable', 'undo', 'redo'],
        'image': { 'toolbar': ['imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|', 'toggleImageCaption', 'imageTextAlternative'] },
        'table': { 'contentToolbar': ['tableColumn', 'tableRow', 'mergeTableCells'] },
    },
}

# config/settings.py (ফাইলটির একদম শেষে)

# config/settings.py (ফাইলটির একদম শেষে)

# --- (চূড়ান্ত এবং সঠিক) Authentication কনফিগারেশন ---

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
}
SITE_ID = 1

# --- allauth নতুন এবং পরিষ্কার সেটিংস ---

ACCOUNT_AUTHENTICATION_METHOD = 'username' 
ACCOUNT_EMAIL_VERIFICATION = 'none'
ACCOUNT_EMAIL_REQUIRED = False
ACCOUNT_USERNAME_REQUIRED = True

# --- (গুরুত্বপূর্ণ) ---
# আমরা এই লাইনটি ফিরিয়ে আনছি এবং নিশ্চিত করছি যে এটি 'password1' ও 'password2' ব্যবহার করে
ACCOUNT_SIGNUP_FIELDS = ['username', 'password1', 'password2'] 
# ---------------------------------