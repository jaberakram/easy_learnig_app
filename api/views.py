# api/views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework import filters
from rest_framework.response import Response 
from django.db.models import Sum, Q, F 
from django.db.models.functions import Rank
from django.db.models import Window, IntegerField
from .models import (
    Category, Course, Unit, Lesson, 
    Quiz, Question, UserLessonProgress, UserQuizAttempt,
    UserEnrollment, MatchingGame,
    LearningGroup, GroupMembership 
)
from .serializers import (
    CategorySerializer, CourseSerializer, UnitSerializer, 
    LessonSerializer, QuizSerializer, QuestionSerializer,
    RegisterSerializer, UserLessonProgressSerializer, UserQuizAttemptSerializer,
    DashboardSerializer, ProfileSerializer, MatchingGameSerializer,
    LearningGroupSerializer, LeaderboardEntrySerializer 
)
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import PermissionDenied, NotFound

# --- নতুন: পারমিশন ক্লাস (গ্রুপের মেম্বারশিপ চেক) ---
class IsGroupMember(permissions.BasePermission):
    """শুধুমাত্র গ্রুপের মেম্বারদের দেখার এবং অ্যাডমিনদের সম্পাদনার অনুমতি দেয়।"""
    def has_permission(self, request, view):
        if view.action in ['list', 'create']:
            return request.user.is_authenticated
        
        return True 
        
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS: 
            return GroupMembership.objects.filter(group=obj, user=request.user).exists()
        
        return GroupMembership.objects.filter(group=obj, user=request.user, is_group_admin=True).exists()
# ------------------------------------------------------------------

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
    
class LearningGroupViewSet(viewsets.ModelViewSet):
    queryset = LearningGroup.objects.all() 
    serializer_class = LearningGroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return LearningGroup.objects.filter(memberships__user=user).distinct()
        return LearningGroup.objects.none()

    def perform_create(self, serializer):
        serializer.save(admin=self.request.user) 
        
class GroupJoinView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        group_id = kwargs.get('group_id')
        try:
            group = LearningGroup.objects.get(pk=group_id)
        except LearningGroup.DoesNotExist:
            raise NotFound(detail="এই গ্রুপটি খুঁজে পাওয়া যায়নি।")

        if GroupMembership.objects.filter(group=group, user=request.user).exists():
            return Response({"detail": "আপনি ইতিমধ্যেই এই গ্রুপের মেম্বার।"}, status=status.HTTP_200_OK)

        is_group_admin = (request.user == group.admin)
        GroupMembership.objects.create(group=group, user=request.user, is_group_admin=is_group_admin)
        
        return Response({"detail": f"আপনি সফলভাবে '{group.title}' গ্রুপে যুক্ত হয়েছেন।"}, status=status.HTTP_201_CREATED)

# --- নতুন: লিডারবোর্ড ভিউ (কোর লজিক) ---
class GroupLeaderboardView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LeaderboardEntrySerializer

    def get(self, request, *args, **kwargs):
        group_id = kwargs.get('group_id')
        try:
            group = LearningGroup.objects.get(pk=group_id)
        except LearningGroup.DoesNotExist:
            raise NotFound(detail="এই গ্রুপটি খুঁজে পাওয়া যায়নি।")

        if not GroupMembership.objects.filter(group=group, user=request.user).exists():
            raise PermissionDenied(detail="লিডারবোর্ড দেখার জন্য আপনাকে অবশ্যই গ্রুপের মেম্বার হতে হবে।")

        course_ids = group.courses.values_list('id', flat=True)

        quiz_ids = Quiz.objects.filter(
            Q(lesson__unit__course__id__in=course_ids) | Q(unit__course__id__in=course_ids)
        ).values_list('id', flat=True).distinct()

        # ৪. স্কোর ক্যালকুলেশন এবং র‍্যাঙ্কিং (ORM Error ফিক্সড)
        leaderboard_data = GroupMembership.objects.filter(
            group=group
        ).annotate(
            total_score=Sum(
                # FIX: 'user__userquizattempt' ব্যবহার করা হয়েছে (Traceback অনুযায়ী)
                F('user__userquizattempt__score'),
                filter=Q(user__userquizattempt__quiz__id__in=quiz_ids)
            )
        ).order_by(
            F('total_score').desc(nulls_last=True)
        ).values('user__username', 'total_score')
        
        
        # ৫. র‍্যাঙ্ক তৈরি করুন
        ranked_data = []
        last_score = -1
        current_rank = 1 
        
        for index, entry in enumerate(leaderboard_data):
            score = entry['total_score'] or 0
            
            if score < last_score:
                current_rank = index + 1 
            
            last_score = score
            
            # Tie-breaking logic: একই স্কোর হলে একই র‍্যাঙ্ক
            if index > 0 and score == leaderboard_data[index-1]['total_score']:
                final_rank = ranked_data[index-1]['rank']
            else:
                 final_rank = current_rank

            ranked_data.append({
                'rank': final_rank,
                # Key Error ফিক্সড: সিরিয়ালাইজার অনুযায়ী 'username' কী ব্যবহার করা হয়েছে
                'username': entry['user__username'], 
                'total_score': score,
            })
        
        # ৬. সিরিয়ালাইজ করে রেসপন্স
        serializer = self.get_serializer(ranked_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


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