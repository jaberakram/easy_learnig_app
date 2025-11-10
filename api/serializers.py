# api/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Sum
from .models import (
    Category, Course, Unit, Lesson, 
    Quiz, Question, Choice,
    UserLessonProgress, UserQuizAttempt,
    UserEnrollment  # <-- (নতুন) UserEnrollment ইম্পোর্ট করুন
)

# ... (ChoiceSerializer, QuestionSerializer, QuizSerializer, LessonSerializer অপরিবর্তিত থাকবে) ...
# ... (UnitSerializer অপরিবর্তিত থাকবে) ...

# (নিচের সিরিয়ালাইজারগুলো কপি করে LessonSerializer-এর নিচে পেস্ট করুন)

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct'] 

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    class Meta:
        model = Question
        fields = ['id', 'text', 'points', 'choices']

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'quiz_type', 'lesson', 'unit', 'questions']

class LessonSerializer(serializers.ModelSerializer):
    quizzes = QuizSerializer(many=True, read_only=True)
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'order', 'youtube_video_id', 'article_body', 'quizzes']

class UnitSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    quizzes = QuizSerializer(many=True, read_only=True) 
    total_possible_points = serializers.SerializerMethodField()
    user_earned_points = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = [
            'id', 'title', 'order', 
            'lessons', 'quizzes', 
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


# --- (এই সিরিয়ালাইজারটি পরিবর্তন করা হয়েছে) ---
class CourseSerializer(serializers.ModelSerializer):
    units = UnitSerializer(many=True, read_only=True) 
    total_possible_points = serializers.SerializerMethodField()
    user_earned_points = serializers.SerializerMethodField()
    
    # --- (নতুন) এই দুটি ফিল্ড যোগ করা হয়েছে ---
    is_premium = serializers.BooleanField(read_only=True)
    is_enrolled = serializers.SerializerMethodField() # ইউজার কি এনরোলড?

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'category', 'units',
            'total_possible_points', 'user_earned_points',
            'is_premium', 'is_enrolled' # <-- নতুন ফিল্ড যোগ
        ]
    
    # --- (নতুন) এই ফাংশনটি যোগ করা হয়েছে ---
    # ইউজার এই কোর্সে এনরোল করেছে কিনা তা চেক করে
    def get_is_enrolled(self, course):
        user = self.context.get('request').user
        if not user or not user.is_authenticated:
            return False
        return UserEnrollment.objects.filter(user=user, course=course).exists()

    # --- (এই ফাংশনগুলো অপরিবর্তিত) ---
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
# --------------------------------------------------


# --- ক্যাটাগরি সিরিয়ালাইজার (অপরিবর্তিত) ---
class CategorySerializer(serializers.ModelSerializer):
    courses = CourseSerializer(many=True, read_only=True)
    class Meta:
        model = Category
        fields = ['id', 'name', 'courses']

# ... (বাকি সব সিরিয়ালাইজার অপরিবর্তিত থাকবে) ...
# (নিচের সিরিয়ালাইজারগুলো কপি করে CategorySerializer-এর নিচে পেস্ট করুন)

class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)
    class Meta:
        model = User
        fields = ['username', 'password', 'password2']
        extra_kwargs = {'password': {'write_only': True}}
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("দুটি পাসওয়ার্ড মেলেনি।")
        return data
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
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