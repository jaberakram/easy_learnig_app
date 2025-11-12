# api/views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework import filters
from rest_framework.response import Response 
from django.db.models import Sum, Q 
from .models import (
    Category, Course, Unit, Lesson, 
    Quiz, Question, UserLessonProgress, UserQuizAttempt,
    UserEnrollment,
    MatchingGame
)
from .serializers import (
    CategorySerializer, CourseSerializer, UnitSerializer, 
    LessonSerializer, QuizSerializer, QuestionSerializer,
    RegisterSerializer, UserLessonProgressSerializer, UserQuizAttemptSerializer,
    DashboardSerializer,
    ProfileSerializer,
    MatchingGameSerializer
)
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import PermissionDenied

# --- পরিবর্তন: গুগল লগইনের সব ইম্পোর্ট এবং ক্লাস মুছে ফেলা হয়েছে ---

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    filter_backends = [
        DjangoFilterBackend, 
        filters.SearchFilter
    ]
    filterset_fields = ['category'] 
    search_fields = ['title', 'description'] 
    
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

class MatchingGameViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MatchingGame.objects.all()
    serializer_class = MatchingGameSerializer
    permission_classes = [permissions.IsAuthenticated]

class RegisterView(generics.GenericAPIView):
    serializer_class = RegisterSerializer
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({"key": token.key}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

class ProfileView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProfileSerializer

    def get(self, request, *args, **kwargs):
        user = request.user
        total_points = UserQuizAttempt.objects.filter(user=user).aggregate(Sum('score'))['score__sum'] or 0
        data = {
            'username': user.username,
            'email': user.email,
            'total_points': total_points
        }
        serializer = self.get_serializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)