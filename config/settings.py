# config/settings.py
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'django-insecure-$%w)b1s!!q*i7e8t(4o06p=f13@x)2*5!9t)3@*v$!_g&g8@#c'
DEBUG = True
ALLOWED_HOSTS = ['192.168.0.200', '127.0.0.1', 'localhost']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    'nested_admin', # <-- নেস্টেড অ্যাডমিন
    
    # থার্ড পার্টি অ্যাপস
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders', # <-- CORS (ইন্সটল করা হয়েছে)
    'django_filters',
    'django_ckeditor_5',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google', 
    'dj_rest_auth',
    'dj_rest_auth.registration',

    # লোকাল অ্যাপস
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    "allauth.account.middleware.AccountMiddleware", 
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

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'easy_learning_db',
        'USER': 'jaberakram', 
        'PASSWORD': '', 
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / "static"

# জাভাস্ক্রিপ্ট ফাইল পরিবেশন করার জন্য
STATICFILES_DIRS = [
    BASE_DIR / "api" / "static", # <-- এই ফোল্ডারটি আমরা পরের ধাপে তৈরি করবো
]

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CKEditor 5 সেটিংস (অপরিবর্তিত)
customColorPalette = [
    {"color": "hsl(4, 90%, 58%)", "label": "Red"},
    {"color": "hsl(340, 82%, 52%)", "label": "Pink"},
]
CKEDITOR_5_CONFIGS = {
    'default': {
        'toolbar': [
            'heading', '|', 'bold', 'italic', 'link',
            'bulletedList', 'numberedList', 'blockQuote', 'codeBlock'
        ],
    },
    'article': {
        'toolbar': [
            'heading', '|', 'bold', 'italic', 'link', 'underline', 'strikethrough',
            'code', 'codeBlock', 'subscript', 'superscript', 'highlight', '|',
            'bulletedList', 'numberedList', 'todoList', '|',
            'outdent', 'indent', '|', 'alignment', '|',
            'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
            'insertImage', 'insertTable', 'blockQuote',
        ],
    }
}

CORS_ALLOW_ALL_ORIGINS = True 

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend'
    ],
}

# 'allauth' এবং 'dj-rest-auth' সেটিংস
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

SITE_ID = 1 

# --- পরিবর্তন: 'password' কে 'password1' করা হয়েছে ---
ACCOUNT_LOGIN_METHODS = ['email'] 
ACCOUNT_SIGNUP_FIELDS = ['email', 'password1'] # <-- (CRITICAL) এই লাইনটি ঠিক করা হয়েছে
ACCOUNT_EMAIL_VERIFICATION = 'none' 
# -----------------------------------------------

REST_AUTH = {
    'SOCIAL_LOGIN_ADAPTER': 'allauth.socialaccount.adapter.DefaultSocialAccountAdapter'
}