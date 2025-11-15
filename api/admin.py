# api/admin.py
from django.contrib import admin
import nested_admin # <-- নতুন: nested_admin ইম্পোর্ট করুন

from .models import (
    Category, Course, Unit, Lesson, 
    Quiz, Question, Choice,
    UserQuizAttempt, UserEnrollment, 
    MatchingGame, GamePair,
    LearningGroup, GroupMembership,
    Notice, Promotion
)

# === নতুন: নেস্টেড ইনলাইন ===

class ChoiceNestedInline(nested_admin.NestedTabularInline):
    model = Choice
    extra = 3
    
class QuestionNestedInline(nested_admin.NestedStackedInline):
    model = Question
    extra = 1
    inlines = [ChoiceNestedInline] # <-- প্রশ্নের ভেতরে চয়েস

class QuizNestedInline(nested_admin.NestedStackedInline):
    model = Quiz
    extra = 1
    inlines = [QuestionNestedInline] # <-- কুইজের ভেতরে প্রশ্ন

class GamePairNestedInline(nested_admin.NestedTabularInline):
    model = GamePair
    extra = 3

class MatchingGameNestedInline(nested_admin.NestedStackedInline):
    model = MatchingGame
    extra = 1
    inlines = [GamePairNestedInline] # <-- গেমের ভেতরে পেয়ার

class LessonNestedInline(nested_admin.NestedStackedInline):
    model = Lesson
    extra = 1
    inlines = [QuizNestedInline, MatchingGameNestedInline] # <-- লেসনের ভেতরে কুইজ ও গেম

class UnitNestedInline(nested_admin.NestedStackedInline):
    model = Unit
    extra = 1
    inlines = [LessonNestedInline] # <-- ইউনিটের ভেতরে লেসন

# === মডেল অ্যাডমিন (নেস্টেড ব্যবহার করে) ===

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Course)
class CourseAdmin(nested_admin.NestedModelAdmin): # <-- পরিবর্তন
    list_display = ('title', 'category', 'is_premium')
    list_filter = ('category', 'is_premium')
    search_fields = ('title', 'description')
    inlines = [UnitNestedInline] # <-- ইউনিটের নেস্টেড ইনলাইন

@admin.register(Unit)
class UnitAdmin(nested_admin.NestedModelAdmin): # <-- পরিবর্তন
    list_display = ('title', 'course', 'order')
    list_filter = ('course',)
    search_fields = ('title',)
    inlines = [LessonNestedInline] # <-- লেসনের নেস্টেড ইনলাইন

@admin.register(Lesson)
class LessonAdmin(nested_admin.NestedModelAdmin): # <-- পরিবর্তন
    list_display = ('title', 'unit', 'order')
    list_filter = ('unit__course',)
    search_fields = ('title', 'article_body')
    inlines = [QuizNestedInline, MatchingGameNestedInline] # <-- কুইজ ও গেমের নেস্টেড ইনলাইন

@admin.register(Quiz)
class QuizAdmin(nested_admin.NestedModelAdmin): # <-- পরিবর্তন
    list_display = ('title', 'quiz_type', 'lesson', 'unit')
    list_filter = ('quiz_type', 'lesson__unit__course')
    search_fields = ('title',)
    inlines = [QuestionNestedInline] # <-- প্রশ্নের নেস্টেড ইনলাইন

@admin.register(Question)
class QuestionAdmin(nested_admin.NestedModelAdmin): # <-- পরিবর্তন
    list_display = ('text', 'quiz', 'points')
    list_filter = ('quiz',)
    search_fields = ('text',)
    inlines = [ChoiceNestedInline] # <-- চয়েসের নেস্টেড ইনলাইন

@admin.register(MatchingGame)
class MatchingGameAdmin(nested_admin.NestedModelAdmin): # <-- পরিবর্তন
    list_display = ('title', 'game_type', 'lesson', 'unit', 'order')
    list_filter = ('game_type', 'lesson__unit__course')
    search_fields = ('title',)
    inlines = [GamePairNestedInline] # <-- পেয়ারের নেস্টেড ইনলাইন

# === অন্যান্য অ্যাডমিন (অপরিবর্তিত) ===

@admin.register(UserEnrollment)
class UserEnrollmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'enrolled_at')
    list_filter = ('course', 'enrolled_at')
    search_fields = ('user__username', 'course__title')

@admin.register(UserQuizAttempt)
class UserQuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz', 'score', 'total_points', 'timestamp')
    list_filter = ('quiz__lesson__unit__course', 'timestamp')
    search_fields = ('user__username', 'quiz__title')

@admin.register(LearningGroup)
class LearningGroupAdmin(admin.ModelAdmin):
    list_display = ('title', 'admin', 'created_at')
    search_fields = ('title', 'admin__username')
    filter_horizontal = ('courses',) 

@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'group', 'is_group_admin', 'joined_at')
    list_filter = ('group', 'is_group_admin')
    search_fields = ('user__username', 'group__title')

@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at')
    list_filter = ('is_active',)

@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ('title', 'subtitle', 'course', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('title', 'subtitle')