# api/views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response 
from django.db.models import Sum, Q 
from .models import (
    Category, Course, Unit, Lesson, 
    Quiz, Question, UserLessonProgress, UserQuizAttempt,
    UserEnrollment
)
from .serializers import (
    CategorySerializer, CourseSerializer, UnitSerializer, 
    LessonSerializer, QuizSerializer, QuestionSerializer,
    RegisterSerializer, UserLessonProgressSerializer, UserQuizAttemptSerializer,
    DashboardSerializer  
)
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import PermissionDenied

# --- (নতুন) গুগল লগইনের জন্য ইম্পোর্ট ---
# (এই লাইনটি ঠিক করা হয়েছে)
from dj_rest_auth.registration.serializers import SocialLoginSerializer 
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
# -----------------------------------------


# --- (নতুন) গুগল লগইন ভিউ ---
class GoogleLoginView(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    serializer_class = SocialLoginSerializer # ডিফল্ট সিরিয়ালাইজার ব্যবহার করবে

    def get_serializer(self, *args, **kwargs):
        kwargs['context'] = self.get_renderer_context()
        return self.serializer_class(*args, **kwargs)
# ---------------------------


# --- কন্টেন্ট ভিউসেট (অপরিবর্তিত) ---
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category']
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

class UnitViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        unit = super().get_object()
        course = unit.course
        user = self.request.user
        if course.is_premium:
            is_enrolled = UserEnrollment.objects.filter(user=user, course=course).exists()
            if not is_enrolled:
                raise PermissionDenied(detail="আপনি এই প্রিমিয়াম কোর্সে এনরোল করেননি।")
        return unit

class LessonViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer

class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer

class QuestionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer


# --- Auth ভিউ (অপরিবর্তিত) ---
class RegisterView(generics.GenericAPIView):
    serializer_class = RegisterSerializer
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({"key": token.key}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- ইউজার প্রোগ্রেস ভিউ (অপরিবর্তিত) ---
class UserLessonProgressView(generics.CreateAPIView):
    serializer_class = UserLessonProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        progress, created = UserLessonProgress.objects.get_or_create(
            user=request.user,
            lesson=serializer.validated_data['lesson']
        )
        if created:
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        else:
            return Response(serializer.data, status=status.HTTP_200_OK)

class UserQuizAttemptView(generics.CreateAPIView):
    serializer_class = UserQuizAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        quiz = serializer.validated_data['quiz']
        UserQuizAttempt.objects.filter(user=user, quiz=quiz).delete()
        serializer.save(user=user)

# --- ড্যাশবোর্ড ভিউ (অপরিবর্ত-
class DashboardView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DashboardSerializer 

    def get(self, request, *args, **kwargs):
        user = request.user
        total_points = UserQuizAttempt.objects.filter(user=user).aggregate(Sum('score'))['score__sum'] or 0
        completed_lesson_courses = Course.objects.filter(units__lessons__userlessonprogress__user=user).distinct()
        attempted_quiz_courses = Course.objects.filter(units__lessons__quizzes__userquizattempt__user=user).distinct()
        attempted_mastery_quiz_courses = Course.objects.filter(units__quizzes__userquizattempt__user=user).distinct()
        my_courses = (completed_lesson_courses | attempted_quiz_courses | attempted_mastery_quiz_courses).distinct()
        data = {
            'total_points': total_points,
            'my_courses': my_courses
        }
        serializer = self.get_serializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)