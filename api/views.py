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
    LearningGroup, GroupMembership,
    Notice, Promotion 
)
from .serializers import (
    CategorySerializer, CourseSerializer, UnitSerializer, 
    LessonSerializer, QuizSerializer, QuestionSerializer,
    RegisterSerializer, UserLessonProgressSerializer, UserQuizAttemptSerializer,
    DashboardSerializer, ProfileSerializer, MatchingGameSerializer,
    LearningGroupSerializer, LeaderboardEntrySerializer,
    NoticeSerializer, PromotionSerializer, HomeCourseSerializer 
)
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import PermissionDenied, NotFound

# ... (IsGroupMember এবং অন্যান্য ViewSet অপরিবর্তিত) ...
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

        leaderboard_data = GroupMembership.objects.filter(
            group=group
        ).annotate(
            total_score=Sum(
                F('user__userquizattempt__score'),
                filter=Q(user__userquizattempt__quiz__id__in=quiz_ids)
            )
        ).order_by(
            F('total_score').desc(nulls_last=True)
        ).values('user__username', 'total_score')
        
        
        ranked_data = []
        last_score = -1
        current_rank = 1 
        
        for index, entry in enumerate(leaderboard_data):
            score = entry['total_score'] or 0
            
            if score < last_score:
                current_rank = index + 1 
            
            last_score = score
            
            if index > 0 and score == leaderboard_data[index-1]['total_score']:
                final_rank = ranked_data[index-1]['rank']
            else:
                 final_rank = current_rank

            ranked_data.append({
                'rank': final_rank,
                'username': entry['user__username'], 
                'total_score': score,
            })
        
        serializer = self.get_serializer(ranked_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DashboardView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DashboardSerializer 
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def get(self, request, *args, **kwargs):
        user = request.user
        
        completed_lesson_courses = Course.objects.filter(units__lessons__userlessonprogress__user=user).distinct()
        attempted_quiz_courses = Course.objects.filter(units__lessons__quizzes__userquizattempt__user=user).distinct()
        attempted_mastery_quiz_courses = Course.objects.filter(units__quizzes__userquizattempt__user=user).distinct()
        
        # FIX: আমরা এখন UserEnrollment-এর উপর ভিত্তি করে কোর্স দেখাব
        enrolled_courses = Course.objects.filter(userenrollment__user=user).distinct()
        
        # সব কোর্স একত্রিত করা
        my_courses = (completed_lesson_courses | attempted_quiz_courses | attempted_mastery_quiz_courses | enrolled_courses).distinct()

        latest_notice = Notice.objects.filter(is_active=True).order_by('-created_at').first()
        latest_promotion = Promotion.objects.filter(is_active=True).order_by('-created_at').first()

        data = {
            'my_courses': my_courses,
            'notice': latest_notice,
            'promotion': latest_promotion,
        }
        
        serializer = self.get_serializer(data) 
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


# --- নতুন: ফ্রি কোর্সে এনরোল করার ভিউ ---
class EnrollCourseView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        course_id = kwargs.get('course_id')
        user = request.user
        
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            raise NotFound(detail="এই কোর্সটি খুঁজে পাওয়া যায়নি।")

        # ১. কোর্সটি প্রিমিয়াম কিনা চেক করুন
        if course.is_premium:
            raise PermissionDenied(detail="এটি একটি প্রিমিয়াম কোর্স। আপনি এভাবে এনরোল করতে পারবেন না।")

        # ২. ইউজার কি ইতিমধ্যেই এনরোল করা আছে?
        if UserEnrollment.objects.filter(user=user, course=course).exists():
            return Response({"detail": "আপনি ইতিমধ্যেই এই কোর্সে এনরোল করেছেন।"}, status=status.HTTP_200_OK)

        # ৩. এনরোলমেন্ট তৈরি করুন
        UserEnrollment.objects.create(user=user, course=course)
        
        return Response({"detail": f"আপনি সফলভাবে '{course.title}' কোর্সে এনরোল করেছেন।"}, status=status.HTTP_201_CREATED)
# ----------------------------------------