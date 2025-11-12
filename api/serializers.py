# api/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Sum, F, Window, IntegerField
from django.db.models.functions import Rank
from .models import (
    Category, Course, Unit, Lesson, 
    Quiz, Question, Choice,
    UserLessonProgress, UserQuizAttempt,
    UserEnrollment, MatchingGame, GamePair,
    LearningGroup, GroupMembership 
)

# --- নতুন: মিনি কোর্স সিরিয়ালাইজার যোগ করা হয়েছে (ধাপ ১-এর ক) ---
class MiniCourseSerializer(serializers.ModelSerializer):
    """শুধুমাত্র গ্রুপের জন্য কোর্সের আইডি ও টাইটেল দেখানোর জন্য ব্যবহৃত"""
    class Meta:
        model = Course
        fields = ['id', 'title']
# -----------------------------------------------------------

# ... (GamePairSerializer, MatchingGameSerializer, ChoiceSerializer, QuestionSerializer, QuizSerializer, LessonSerializer, UnitSerializer, CourseSerializer, CategorySerializer অপরিবর্তিত) ...
class GamePairSerializer(serializers.ModelSerializer):
    class Meta:
        model = GamePair
        fields = ['id', 'item_one', 'item_two']

class MatchingGameSerializer(serializers.ModelSerializer):
    pairs = GamePairSerializer(many=True, read_only=True)
    class Meta:
        model = MatchingGame
        fields = ['id', 'title', 'game_type', 'lesson', 'unit', 'order', 'pairs']

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct'] 

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    class Meta:
        model = Question
        fields = ['id', 'text', 'points', 'choices', 'explanation'] 

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'quiz_type', 'lesson', 'unit', 'questions']

class LessonSerializer(serializers.ModelSerializer):
    quizzes = QuizSerializer(many=True, read_only=True)
    matching_games = MatchingGameSerializer(many=True, read_only=True) 
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'order', 'youtube_video_id', 'article_body', 'quizzes', 'matching_games']

class UnitSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    quizzes = QuizSerializer(many=True, read_only=True) 
    matching_games = MatchingGameSerializer(many=True, read_only=True) 
    
    total_possible_points = serializers.SerializerMethodField()
    user_earned_points = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = [
            'id', 'title', 'order', 
            'lessons', 'quizzes', 
            'matching_games', 
            'total_possible_points', 'user_earned_points' 
        ]

    def get_total_possible_points(self, unit):
        total_points = 0
        lesson_quizzes = Quiz.objects.filter(lesson__unit=unit, quiz_type='LESSON')
        for quiz in lesson_quizzes:
            total_points += quiz.questions.aggregate(Sum('points'))['points__sum'] or 0
        mastery_quizzes = unit.quizzes.filter(quiz_type='UNIT')
        for quiz in mastery_quizzes:
            total_points += quiz.questions.aggregate(Sum('points'))['points__sum'] or 0
        return total_points

    def get_user_earned_points(self, unit):
        user = self.context['request'].user
        if not user.is_authenticated:
            return 0
        earned_points = UserQuizAttempt.objects.filter(
            user=user, 
            quiz__lesson__unit=unit 
        ).aggregate(Sum('score'))['score__sum'] or 0
        earned_points += UserQuizAttempt.objects.filter(
            user=user, 
            quiz__unit=unit 
        ).aggregate(Sum('score'))['score__sum'] or 0
        return earned_points

class CourseSerializer(serializers.ModelSerializer):
    units = UnitSerializer(many=True, read_only=True) 
    total_possible_points = serializers.SerializerMethodField()
    user_earned_points = serializers.SerializerMethodField()
    is_premium = serializers.BooleanField(read_only=True)
    is_enrolled = serializers.SerializerMethodField() 

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'category', 'units',
            'total_possible_points', 'user_earned_points',
            'is_premium', 'is_enrolled' 
        ]
    
    def get_is_enrolled(self, course):
        user = self.context.get('request').user
        if not user or not user.is_authenticated:
            return False
        return UserEnrollment.objects.filter(user=user, course=course).exists()

    def get_total_possible_points(self, course):
        lesson_quiz_points = Question.objects.filter(
            quiz__lesson__unit__course=course
        ).aggregate(Sum('points'))['points__sum'] or 0
        mastery_quiz_points = Question.objects.filter(
            quiz__unit__course=course
        ).aggregate(Sum('points'))['points__sum'] or 0
        return lesson_quiz_points + mastery_quiz_points

    def get_user_earned_points(self, course):
        user = self.context['request'].user
        if not user.is_authenticated:
            return 0
        earned_points = UserQuizAttempt.objects.filter(
            user=user, 
            quiz__lesson__unit__course=course
        ).aggregate(Sum('score'))['score__sum'] or 0
        earned_points += UserQuizAttempt.objects.filter(
            user=user, 
            quiz__unit__course=course
        ).aggregate(Sum('score'))['score__sum'] or 0
        return earned_points

class CategorySerializer(serializers.ModelSerializer):
    courses = CourseSerializer(many=True, read_only=True)
    class Meta:
        model = Category
        fields = ['id', 'name', 'courses']

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True) 
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2'] 
        extra_kwargs = {
            'password': {'write_only': True},
            'username': {'read_only': True} 
        }

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "দুটি পাসওয়ার্ড মেলেনি।"})
        
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "এই ইমেইলটি আগেই ব্যবহৃত হয়েছে।"})
            
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        email = validated_data['email']
        username = email.split('@')[0]
        original_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{original_username}_{counter}"
            counter += 1
            
        user = User.objects.create_user(
            username=username, 
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class UserLessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserLessonProgress
        fields = ['lesson']

class UserQuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserQuizAttempt
        fields = ['quiz', 'score', 'total_points']

class DashboardCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'title', 'description']

class DashboardSerializer(serializers.Serializer):
    my_courses = DashboardCourseSerializer(many=True)
    total_points = serializers.IntegerField()

class ProfileSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    total_points = serializers.IntegerField()


class GroupMemberUserSerializer(serializers.ModelSerializer):
    """গ্রুপ মেম্বারশিপের জন্য ইউজারের বেসিক তথ্য (ইউজারনেম, আইডি)"""
    class Meta:
        model = User
        fields = ['id', 'username']

class GroupMembershipSerializer(serializers.ModelSerializer):
    user = GroupMemberUserSerializer(read_only=True)
    class Meta:
        model = GroupMembership
        fields = ['user', 'is_group_admin', 'joined_at']

class LearningGroupSerializer(serializers.ModelSerializer):
    admin = GroupMemberUserSerializer(read_only=True)
    
    # FIX: কোর্সের নাম দেখানোর জন্য নতুন রিড-অনলি ফিল্ড যোগ করা হয়েছে
    courses_detail = MiniCourseSerializer(source='courses', many=True, read_only=True)
    
    # গ্রুপ তৈরি বা আপডেটের জন্য আইডি গ্রহণ করার ফিল্ড (write_only)
    courses = serializers.PrimaryKeyRelatedField(many=True, queryset=Course.objects.all(), write_only=True, required=False) 
    
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = LearningGroup
        # FIX: 'courses_detail' আউটপুট ফিল্ড হিসেবে যুক্ত
        fields = ['id', 'title', 'admin', 'courses', 'courses_detail', 'created_at', 'member_count']
        # FIX: 'courses' এখন ইনপুট হিসেবে Write Only
        read_only_fields = ['admin', 'member_count', 'courses_detail'] 

    def get_member_count(self, obj):
        return obj.memberships.count()
        
    def create(self, validated_data):
        validated_data['admin'] = self.context['request'].user
        courses = validated_data.pop('courses', [])
        group = LearningGroup.objects.create(**validated_data)
        group.courses.set(courses)
        
        GroupMembership.objects.create(
            group=group, 
            user=group.admin, 
            is_group_admin=True
        )
        return group
        
class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField(help_text="গ্রুপের মধ্যে ইউজারের র‍্যাঙ্ক")
    username = serializers.CharField(help_text="ব্যবহারকারীর ইউজারনেম") 
    total_score = serializers.IntegerField(help_text="গ্রুপে অন্তর্ভুক্ত কোর্স থেকে অর্জিত মোট পয়েন্ট")