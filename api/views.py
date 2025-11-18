# api/views.py
from rest_framework import viewsets, status, generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Sum, Q, F, Window
from django.db.models.functions import Rank
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

# Google Login Imports
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

from .models import (
    Category, Course, Unit, Lesson, Quiz, Question, 
    UserQuizAttempt, UserEnrollment,
    MatchingGame,
    LearningGroup, GroupMembership,
    Notice, Promotion
)
from .serializers import (
    CategorySerializer, CourseSerializer, UnitSerializer, LessonSerializer, QuizSerializer,
    RegisterSerializer, UserQuizAttemptSerializer,
    ProfileSerializer, LearningGroupSerializer, GroupMembershipSerializer,
    LeaderboardEntrySerializer, DashboardSerializer, NoticeSerializer, PromotionSerializer,
    MatchingGameSerializer
)

#
# api/views.py

# ... অন্যান্য ইম্পোর্ট ...
from rest_framework.response import Response
from rest_framework import status
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    # client_class = OAuth2Client  <-- এই লাইনটি যেন অবশ্যই মুছে ফেলা বা কমেন্ট করা থাকে
    # callback_url = "..."         <-- এটিও মুছে ফেলুন

    def post(self, request, *args, **kwargs):
        print("--- Google Login Debug Start ---")
        print("Received Data from App:", request.data) # অ্যাপ থেকে কী ডাটা আসছে তা দেখাবে
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation Errors:", serializer.errors) # কেন রিজেক্ট হচ্ছে তা দেখাবে
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        print("Serializer is valid, proceeding...")
        return super().post(request, *args, **kwargs)
# --- অথেন্টিকেশন ভিউ ---
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    if request.method == 'POST':
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({'token': token.key, 'username': user.username}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if not password:
        return Response({'error': 'পাসওয়ার্ড প্রয়োজন'}, status=status.HTTP_400_BAD_REQUEST)

    user = None
    if email:
        try:
            user_by_email = User.objects.get(email=email)
            user = authenticate(username=user_by_email.username, password=password)
        except User.DoesNotExist:
            pass
    elif username:
        user = authenticate(username=username, password=password)

    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'username': user.username}, status=status.HTTP_200_OK)
    
    return Response({'error': 'ভুল ইমেইল বা পাসওয়ার্ড'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    try:
        request.user.auth_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- প্রোফাইল ভিউ ---
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        total_points = UserQuizAttempt.objects.filter(user=user).aggregate(Sum('score'))['score__sum'] or 0
        
        serializer = ProfileSerializer({
            'username': user.username,
            'email': user.email,
            'total_points': total_points
        })
        return Response(serializer.data)

# --- মূল কন্টেন্ট ভিউসেট ---
class CategoryViewSet(ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}

class CourseViewSet(ReadOnlyModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        queryset = Course.objects.all()
        category_id = self.request.query_params.get('category')
        search_term = self.request.query_params.get('search')
        
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        if search_term:
            queryset = queryset.filter(
                Q(title__icontains=search_term) | 
                Q(description__icontains=search_term)
            )
            
        return queryset

class UnitViewSet(ReadOnlyModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}

class LessonViewSet(ReadOnlyModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}

class QuizViewSet(ReadOnlyModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}

class MatchingGameViewSet(ReadOnlyModelViewSet):
    queryset = MatchingGame.objects.all()
    serializer_class = MatchingGameSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}

# --- ইউজার প্রোগ্রেস ভিউ ---
class UserQuizAttemptView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserQuizAttemptSerializer

    def perform_create(self, serializer):
        user = self.request.user
        quiz = serializer.validated_data['quiz']
        score = serializer.validated_data['score']
        total_points = serializer.validated_data['total_points']

        UserQuizAttempt.objects.filter(user=user, quiz=quiz).delete()
        UserQuizAttempt.objects.create(user=user, quiz=quiz, score=score, total_points=total_points)

# --- গ্রুপ ভিউসেট ---
class LearningGroupViewSet(viewsets.ModelViewSet):
    queryset = LearningGroup.objects.all()
    serializer_class = LearningGroupSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        return LearningGroup.objects.filter(memberships__user=self.request.user)

    @action(detail=True, methods=['post'], url_path='join')
    def join_group(self, request, pk=None):
        try:
            group = LearningGroup.objects.get(id=pk)
        except LearningGroup.DoesNotExist:
            return Response({'detail': 'গ্রুপটি খুঁজে পাওয়া যায়নি।'}, status=status.HTTP_404_NOT_FOUND)

        if GroupMembership.objects.filter(group=group, user=request.user).exists():
            return Response({'detail': 'আপনি ஏற்கனவே এই গ্রুপে আছেন।'}, status=status.HTTP_400_BAD_REQUEST)
        
        GroupMembership.objects.create(group=group, user=request.user)
        group_data = self.get_serializer(group).data
        return Response({'message': 'সফলভাবে গ্রুপে যোগ দিয়েছেন!', 'group': group_data}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='leave')
    def leave_group(self, request, pk=None):
        try:
            group = LearningGroup.objects.get(id=pk)
        except LearningGroup.DoesNotExist:
            return Response({'detail': 'গ্রুপটি খুঁজে পাওয়া যায়নি।'}, status=status.HTTP_404_NOT_FOUND)
        
        membership = GroupMembership.objects.filter(group=group, user=request.user).first()
        if not membership:
            return Response({'detail': 'আপনি এই গ্রুপের সদস্য নন।'}, status=status.HTTP_400_BAD_REQUEST)
        
        if membership.is_group_admin:
            if group.memberships.count() > 1:
                return Response({'detail': 'অ্যাডমিন গ্রুপ ত্যাগ করতে পারবেন না। প্রথমে অন্যকে অ্যাডমিন বানান।'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                group.delete()
                return Response({'detail': 'গ্রুপটি ডিলিট করা হয়েছে।'}, status=status.HTTP_200_OK)
        
        membership.delete()
        return Response({'detail': 'সফলভাবে গ্রুপ ত্যাগ করেছেন।'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='members')
    def get_members(self, request, pk=None):
        group = self.get_object()
        members = group.memberships.all()
        serializer = GroupMembershipSerializer(members, many=True)
        return Response(serializer.data)

# --- গ্রুপ লিডারবোর্ড ---
class GroupLeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id, *args, **kwargs):
        try:
            group = LearningGroup.objects.get(id=group_id)
        except LearningGroup.DoesNotExist:
            return Response({'detail': 'গ্রুপটি খুঁজে পাওয়া যায়নি।'}, status=status.HTTP_404_NOT_FOUND)
        
        group_courses = group.courses.all()
        if not group_courses.exists():
            return Response([], status=status.HTTP_200_OK) 

        members = User.objects.filter(learning_groups__group=group)
        
        lesson_quizzes_q = Q(quiz__lesson__unit__course__in=group_courses)
        unit_quizzes_q = Q(quiz__unit__course__in=group_courses)

        leaderboard_data = UserQuizAttempt.objects.filter(
            user__in=members
        ).filter(
            lesson_quizzes_q | unit_quizzes_q
        ).values(
            'user__username' 
        ).annotate(
            total_score=Sum('score'), 
            username=F('user__username') 
        ).filter(
            total_score__gt=0 
        ).annotate(
            rank=Window( 
                expression=Rank(),
                order_by=F('total_score').desc()
            )
        ).order_by('rank') 
        
        serializer = LeaderboardEntrySerializer(leaderboard_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# --- ড্যাশবোর্ড ভিউ ---
class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        
        notice = Notice.objects.filter(is_active=True).first()
        promotion = Promotion.objects.filter(is_active=True).first()
        
        enrolled_courses = Course.objects.filter(enrollments__user=user)
        
        context = {'request': request}
        
        dashboard_data = {
            'notice': notice,
            'promotion': promotion,
            'my_courses': enrolled_courses
        }

        serializer = DashboardSerializer(dashboard_data, context=context)
        return Response(serializer.data)