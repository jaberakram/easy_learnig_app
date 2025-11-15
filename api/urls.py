# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    RegisterView, UserLessonProgressView, UserQuizAttemptView, DashboardView,
    ProfileView,
    LearningGroupViewSet, GroupJoinView, GroupLeaderboardView,
    # --- নতুন ভিউ ইম্পোর্ট ---
    EnrollCourseView 
)

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'courses', views.CourseViewSet, basename='course')
router.register(r'units', views.UnitViewSet, basename='unit')
router.register(r'lessons', views.LessonViewSet, basename='lesson')
router.register(r'quizzes', views.QuizViewSet, basename='quiz')
router.register(r'questions', views.QuestionViewSet, basename='question')
router.register(r'matching-games', views.MatchingGameViewSet, basename='matchinggame')
router.register(r'groups', LearningGroupViewSet, basename='group')

urlpatterns = [
    path('', include(router.urls)),
    
    path('register/', RegisterView.as_view(), name='custom_register'),
    path('progress/lesson/', UserLessonProgressView.as_view(), name='progress_lesson'),
    path('progress/quiz/', UserQuizAttemptView.as_view(), name='progress_quiz'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('profile/', ProfileView.as_view(), name='profile'),
    
    path('groups/<int:group_id>/join/', GroupJoinView.as_view(), name='group_join'),
    path('groups/<int:group_id>/leaderboard/', GroupLeaderboardView.as_view(), name='group_leaderboard'),
    
    # --- নতুন: ফ্রি কোর্সে এনরোল করার জন্য URL ---
    path('courses/<int:course_id>/enroll/', EnrollCourseView.as_view(), name='enroll_course'),
]