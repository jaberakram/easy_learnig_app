# api/views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response 
from django.db.models import Sum, Q # <-- Q এবং Sum ইম্পোর্ট করুন
from .models import (
    Category, Course, Unit, Lesson, 
    Quiz, Question, UserLessonProgress, UserQuizAttempt
)
# --- (এই ইম্পোর্ট লাইনটি ঠিক করা হয়েছে) ---
from .serializers import (
    CategorySerializer, CourseSerializer, UnitSerializer, 
    LessonSerializer, QuizSerializer, QuestionSerializer,
    RegisterSerializer, UserLessonProgressSerializer, UserQuizAttemptSerializer,
    DashboardSerializer  # <-- এই সিরিয়ালাইজারটি যোগ করা হয়েছে
)
# ---------------------------------------------
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.authtoken.models import Token


# --- কন্টেন্ট ভিউসেট (অপরিবর্তিত) ---
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


 # api/views.py - (শুধুমাত্র CourseViewSet পরিবর্তন করুন)

# ... (অন্যান্য সব ইম্পোর্ট এবং ভিউ অপরিবর্তিত থাকবে) ...

class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    সমস্ত কোর্স এবং তাদের ভেতরের ইউনিটগুলো দেখানোর জন্য API ভিউ।
    (প্রোগ্রেস বারের জন্য রিকোয়েস্ট কনটেক্সট পাস করা হয়েছে)
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category']
    
    # --- (নতুন) এই ফাংশনটি যোগ করা হয়েছে ---
    # এটি সিরিয়ালাইজারকে 'request' অবজেক্টটি পাস করতে সাহায্য করে
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

# ... (বাকি সব ভিউ অপরিবর্তিত থাকবে) ...   

class UnitViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer

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
        serializer.save(user=self.request.user)


# --- (নতুন) ড্যাশবোর্ড ভিউ (অপরিবর্তিত) ---

class DashboardView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DashboardSerializer # <-- এটি এখন ইম্পোর্ট করা হয়েছে

    def get(self, request, *args, **kwargs):
        user = request.user

        # ১. ব্যবহারকারীর মোট পয়েন্ট গণনা করুন
        total_points = UserQuizAttempt.objects.filter(user=user).aggregate(Sum('score'))['score__sum'] or 0

        # ২. ব্যবহারকারী যে কোর্সগুলোতে অংশ নিয়েছে সেগুলো খুঁজুন
        completed_lesson_courses = Course.objects.filter(units__lessons__userlessonprogress__user=user).distinct()
        attempted_quiz_courses = Course.objects.filter(units__lessons__quizzes__userquizattempt__user=user).distinct()
        attempted_mastery_quiz_courses = Course.objects.filter(units__quizzes__userquizattempt__user=user).distinct()

        my_courses = (completed_lesson_courses | attempted_quiz_courses | attempted_mastery_quiz_courses).distinct()

        # ৩. ডেটা প্রস্তুত করুন
        data = {
            'total_points': total_points,
            'my_courses': my_courses
        }
        
        serializer = self.get_serializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)