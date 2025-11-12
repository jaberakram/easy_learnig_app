# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
# নতুন ভিউগুলো ইম্পোর্ট করুন
from .views import (
    RegisterView, UserLessonProgressView, UserQuizAttemptView, DashboardView,
    GoogleLoginView,
    ProfileView # <-- (গুরুত্বপূর্ণ) ProfileView ইম্পোর্ট করুন
)

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'courses', views.CourseViewSet, basename='course')
router.register(r'units', views.UnitViewSet, basename='unit')
router.register(r'lessons', views.LessonViewSet, basename='lesson')
router.register(r'quizzes', views.QuizViewSet, basename='quiz')
router.register(r'questions', views.QuestionViewSet, basename='question')
router.register(r'matching-games', views.MatchingGameViewSet, basename='matchinggame') # <-- গেমের URL

urlpatterns = [
    path('', include(router.urls)),
    
    path('auth/google/', GoogleLoginView.as_view(), name='google_login'),
    
    path('register/', RegisterView.as_view(), name='custom_register'),
    path('progress/lesson/', UserLessonProgressView.as_view(), name='progress_lesson'),
    path('progress/quiz/', UserQuizAttemptView.as_view(), name='progress_quiz'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    
    # --- (গুরুত্বপূর্ণ) প্রোফাইল URL যোগ করুন ---
    path('profile/', ProfileView.as_view(), name='profile'),
    # ---------------------------------------
]