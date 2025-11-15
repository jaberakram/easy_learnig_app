# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, CourseViewSet, UnitViewSet, LessonViewSet, QuizViewSet,
    register_user, login_user, logout_user, 
    UserQuizAttemptView, # <-- UserLessonProgressView ইম্পোর্ট সরানো হয়েছে
    ProfileView, LearningGroupViewSet, GroupLeaderboardView,
    DashboardView,
    MatchingGameViewSet
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'units', UnitViewSet, basename='unit')
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'groups', LearningGroupViewSet, basename='group')
router.register(r'games', MatchingGameViewSet, basename='game')

urlpatterns = [
    # API রাউটার
    path('', include(router.urls)),
    
    # Auth
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login'),
    path('logout/', logout_user, name='logout'),
    
    # Profile
    path('profile/', ProfileView.as_view(), name='profile'),
    
    # Dashboard
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    
    # User Progress
    # --- path('progress/lesson/...) লাইনটি মুছে ফেলা হয়েছে ---
    path('progress/quiz/', UserQuizAttemptView.as_view(), name='progress-quiz'),
    
    # Group extras
    path('groups/<int:group_id>/leaderboard/', GroupLeaderboardView.as_view(), name='group-leaderboard'),
]