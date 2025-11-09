# api/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Sum
from .models import (
    Category, Course, Unit, Lesson, 
    Quiz, Question, Choice,
    UserLessonProgress, UserQuizAttempt
)

# --- কুইজ সিস্টেম সিরিয়ালাইজার (অপরিবর্তিত) ---
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

# --- লেসন সিরিয়ালাইজার (অপরিবর্তিত) ---
class LessonSerializer(serializers.ModelSerializer):
    quizzes = QuizSerializer(many=True, read_only=True)
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'order', 'youtube_video_id', 'article_body', 'quizzes']


# --- (সংশোধিত) ইউনিট সিরিয়ালাইজার ---
class UnitSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    quizzes = QuizSerializer(many=True, read_only=True) # (ইউনিট মাস্টারি কুইজ)
    
    # --- (নতুন) প্রোগ্রেস বার-এর জন্য দুটি নতুন ফিল্ড ---
    total_possible_points = serializers.SerializerMethodField()
    user_earned_points = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = [
            'id', 'title', 'order', 
            'lessons', 'quizzes', 
            'total_possible_points', 'user_earned_points' # <-- নতুন ফিল্ড যোগ
        ]

    # --- (নতুন) ফাংশন: মোট সম্ভাব্য পয়েন্ট হিসাব করা ---
    def get_total_possible_points(self, unit):
        total_points = 0
        
        # ১. লেসন কুইজের পয়েন্ট যোগ করা
        lesson_quizzes = Quiz.objects.filter(lesson__unit=unit, quiz_type='LESSON')
        for quiz in lesson_quizzes:
            total_points += quiz.questions.aggregate(Sum('points'))['points__sum'] or 0
            
        # ২. মাস্টারি কুইজের পয়েন্ট যোগ করা
        mastery_quizzes = unit.quizzes.filter(quiz_type='UNIT')
        for quiz in mastery_quizzes:
            total_points += quiz.questions.aggregate(Sum('points'))['points__sum'] or 0
            
        return total_points

    # --- (নতুন) ফাংশন: ব্যবহারকারীর অর্জিত পয়েন্ট হিসাব করা ---
    def get_user_earned_points(self, unit):
        # রিকোয়েস্ট থেকে ইউজারকে নিন
        user = self.context['request'].user
        
        # যদি ইউজার লগইন করা না থাকে
        if not user.is_authenticated:
            return 0
        
        # এই ইউনিটের সাথে সম্পর্কিত সব কুইজ অ্যাটেম্পট থেকে স্কোর যোগ করুন
        earned_points = UserQuizAttempt.objects.filter(
            user=user, 
            quiz__lesson__unit=unit # লেসন কুইজ
        ).aggregate(Sum('score'))['score__sum'] or 0
        
        earned_points += UserQuizAttempt.objects.filter(
            user=user, 
            quiz__unit=unit # মাস্টারি কুইজ
        ).aggregate(Sum('score'))['score__sum'] or 0
        
        return earned_points


# --- কোর্স সিরিয়ালাইজার (অপরিবর্তিত) ---
class CourseSerializer(serializers.ModelSerializer):
    # (এই ইউনিট সিরিয়ালাইজারটি এখন স্বয়ংক্রিয়ভাবে প্রোগ্রেস বার-এর ডেটা অন্তর্ভুক্ত করবে)
    units = UnitSerializer(many=True, read_only=True) 

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'category', 'units']


# --- ক্যাটাগরি সিরিয়ালাইজার (অপরিবর্তিত) ---
class CategorySerializer(serializers.ModelSerializer):
    courses = CourseSerializer(many=True, read_only=True)
    class Meta:
        model = Category
        fields = ['id', 'name', 'courses']

# --- Auth এবং Dashboard সিরিয়ালাইজার (অপরিবর্তিত) ---
class RegisterSerializer(serializers.ModelSerializer):
    # ... (আগের মতোই)
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