# api/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Sum, Q, F, Window, IntegerField
from django.db.models.functions import Rank
from .models import (
    Category, Course, Unit, Lesson, 
    Quiz, Question, Choice,
    UserLessonProgress, UserQuizAttempt,
    UserEnrollment, MatchingGame, GamePair,
    LearningGroup, GroupMembership,
    Notice, Promotion 
)

# --- নতুন: মিনি কোর্স সিরিয়ালাইজার (গ্রুপের জন্য) ---
class MiniCourseSerializer(serializers.ModelSerializer):
    """শুধুমাত্র গ্রুপের জন্য কোর্সের আইডি ও টাইটেল দেখানোর জন্য ব্যবহৃত"""
    class Meta:
        model = Course
        fields = ['id', 'title']
# -----------------------------------------------------------

# --- FIX: GamePairSerializer কে উপরে নিয়ে আসা হয়েছে (Dependency Fix) ---
class GamePairSerializer(serializers.ModelSerializer):
    class Meta:
        model = GamePair
        fields = ['id', 'item_one', 'item_two']
# ----------------------------------------------------------------------

# --- ম্যাচিং গেম সিরিয়ালাইজার (অগ্রগতি ট্র্যাকিং যোগ করা হয়েছে) ---
class MatchingGameSerializer(serializers.ModelSerializer):
    pairs = GamePairSerializer(many=True, read_only=True) 
    is_attempted = serializers.SerializerMethodField()
    
    class Meta:
        model = MatchingGame
        fields = ['id', 'title', 'game_type', 'lesson', 'unit', 'order', 'pairs', 'is_attempted']
    
    def get_is_attempted(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return False
        # TODO: গেমের জন্য আলাদা UserGameAttempt মডেল তৈরি করা ভালো
        # আপাতত আমরা ধরে নিচ্ছি একটি গেম সম্পন্ন হলে একটি কুইজ অ্যাটেম্পট তৈরি হয়
        # (যদি তা না হয়, এই লজিকটি কাস্টমাইজ করতে হবে)
        
        # আমরা এই সিরিয়ালাইজারটি CourseList-এ ব্যবহার করছি না, তাই Unit/Lesson ফোকাসড থাকাই ভালো
        if obj.unit:
             return UserQuizAttempt.objects.filter(user=user, quiz__unit=obj.unit).exists()
        if obj.lesson:
             return UserQuizAttempt.objects.filter(user=user, quiz__lesson=obj.lesson).exists()
        return False
# ----------------------------------------------------

# ... (ChoiceSerializer, QuestionSerializer অপরিবর্তিত) ...
class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct'] 

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    class Meta:
        model = Question
        fields = ['id', 'text', 'points', 'choices', 'explanation'] 

# --- QuizSerializer (অগ্রগতি ট্র্যাকিং যোগ করা হয়েছে) ---
class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    is_attempted = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'quiz_type', 'lesson', 'unit', 'questions', 'is_attempted']
        
    def get_is_attempted(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return False
        return UserQuizAttempt.objects.filter(user=user, quiz=obj).exists()


# --- LessonSerializer (is_completed সরানো হয়েছে) ---
class LessonSerializer(serializers.ModelSerializer):
    quizzes = QuizSerializer(many=True, read_only=True) # <-- এখানে শুধু লেসন কুইজ থাকবে
    matching_games = MatchingGameSerializer(many=True, read_only=True) 
    
    # FIX: is_completed (UserLessonProgress ভিত্তিক) সরানো হয়েছে
    
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'order', 'youtube_video_id', 'article_body', 'quizzes', 'matching_games']
        
    # FIX: LessonSerializer থেকে শুধু লেসন-সম্পর্কিত কুইজ/গেম পাঠানো হচ্ছে
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['quizzes'] = QuizSerializer(instance.quizzes.filter(quiz_type='LESSON'), many=True, context=self.context).data
        representation['matching_games'] = MatchingGameSerializer(instance.matching_games.filter(game_type='LESSON'), many=True, context=self.context).data
        return representation


# --- ইউনিট ডিটেইল পেজের জন্য হালকা লেসন সিরিয়ালাইজার (is_completed সরানো হয়েছে) ---
class UnitLessonSerializer(serializers.ModelSerializer):
    # FIX: is_completed (UserLessonProgress ভিত্তিক) সরানো হয়েছে
    
    has_video = serializers.SerializerMethodField()
    has_article = serializers.SerializerMethodField()
    has_quiz = serializers.SerializerMethodField()
    has_game = serializers.SerializerMethodField()
    
    # FIX: লেসনের কুইজ/গেম অ্যাটেম্পট হয়েছে কিনা তা চেক করা
    is_attempted = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'order', 'has_video', 'has_article', 'has_quiz', 'has_game', 'is_attempted']

    # FIX: get_is_completed মেথড সরানো হয়েছে

    # (get_has_video, get_has_article, get_has_quiz, get_has_game remain)
    
    def get_has_video(self, obj):
        return bool(obj.youtube_video_id)

    def get_has_article(self, obj):
        return bool(obj.article_body)

    def get_has_quiz(self, obj):
        return Quiz.objects.filter(lesson=obj, quiz_type='LESSON').exists()

    def get_has_game(self, obj):
        return MatchingGame.objects.filter(lesson=obj, game_type='LESSON').exists()

    # FIX: নতুন মেথড: get_is_attempted
    def get_is_attempted(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return False
            
        # এই লেসনের সাথে যুক্ত কুইজ বা গেম আছে কিনা এবং তা অ্যাটেম্পট করা হয়েছে কিনা
        quiz_attempted = UserQuizAttempt.objects.filter(
            user=user, 
            quiz__lesson=obj, 
            quiz__quiz_type='LESSON'
        ).exists()
        
        # TODO: গেমের অ্যাটেম্পট লজিক (যদি থাকে)
        # game_attempted = UserGameAttempt.objects.filter(user=user, game__lesson=obj).exists()
        
        return quiz_attempted # or game_attempted
# --------------------------------------------------------------


# --- UnitSerializer (নতুন আর্কিটেকচার অনুযায়ী সংশোধিত) ---
class UnitSerializer(serializers.ModelSerializer):
    lessons = UnitLessonSerializer(many=True, read_only=True) 
    quizzes = serializers.SerializerMethodField() 
    matching_games = serializers.SerializerMethodField()
    
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
        
    def get_quizzes(self, obj):
        qs = Quiz.objects.filter(unit=obj, quiz_type='UNIT')
        serializer = QuizSerializer(qs, many=True, context=self.context)
        return serializer.data

    def get_matching_games(self, obj):
        qs = MatchingGame.objects.filter(unit=obj, game_type='UNIT')
        serializer = MatchingGameSerializer(qs, many=True, context=self.context)
        return serializer.data

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
# --------------------------------------------------------------


# --- CourseSerializer (অপরিবর্তিত) ---
class CourseSerializer(serializers.ModelSerializer):
    units = UnitSerializer(many=True, read_only=True) 
    total_possible_points = serializers.SerializerMethodField()
    user_earned_points = serializers.SerializerMethodField()
    is_premium = serializers.BooleanField(read_only=True)
    is_enrolled = serializers.SerializerMethodField() 
    
    total_units = serializers.SerializerMethodField()
    total_lessons = serializers.SerializerMethodField()
    total_quizzes = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'category', 'units',
            'total_possible_points', 'user_earned_points',
            'is_premium', 'is_enrolled',
            'total_units', 'total_lessons', 'total_quizzes'
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
    
    def get_total_units(self, course):
        return Unit.objects.filter(course=course).count()

    def get_total_lessons(self, course):
        return Lesson.objects.filter(unit__course=course).count()

    def get_total_quizzes(self, course):
        return Quiz.objects.filter(Q(lesson__unit__course=course) | Q(unit__course=course)).count()


class CategorySerializer(serializers.ModelSerializer):
    courses = CourseSerializer(many=True, read_only=True)
    class Meta:
        model = Category
        fields = ['id', 'name', 'courses']

# ... (বাকি সিরিয়ালাইজারগুলো অপরিবর্তিত) ...
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
    courses_detail = MiniCourseSerializer(source='courses', many=True, read_only=True)
    courses = serializers.PrimaryKeyRelatedField(many=True, queryset=Course.objects.all(), write_only=True, required=False) 
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = LearningGroup
        fields = ['id', 'title', 'admin', 'courses', 'courses_detail', 'created_at', 'member_count'] 
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


class NoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = ['title', 'body', 'created_at']

class PromotionSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True, allow_null=True)
    
    class Meta:
        model = Promotion
        fields = ['id', 'title', 'subtitle', 'course', 'course_title'] 
        read_only_fields = ['course_title']

class HomeCourseSerializer(serializers.ModelSerializer):
    total_possible_points = serializers.SerializerMethodField()
    user_earned_points = serializers.SerializerMethodField()
    is_100_percent_completed = serializers.SerializerMethodField()
    first_unit_id = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'total_possible_points', 'user_earned_points', 'is_100_percent_completed', 'first_unit_id']
    
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

    def get_is_100_percent_completed(self, course):
        total_points = self.get_total_possible_points(course)
        earned_points = self.get_user_earned_points(course)
        return total_points > 0 and earned_points >= total_points
    
    def get_first_unit_id(self, course):
        first_unit = Unit.objects.filter(course=course).order_by('order').first()
        return first_unit.id if first_unit else None


class DashboardSerializer(serializers.Serializer):
    notice = NoticeSerializer(allow_null=True, required=False)
    promotion = PromotionSerializer(allow_null=True, required=False)
    my_courses = HomeCourseSerializer(many=True)