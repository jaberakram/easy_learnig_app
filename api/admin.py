# api/admin.py
from django.contrib import admin
import nested_admin # <-- 'nested_admin' ইম্পোর্ট
from .models import (
    Category, Course, Unit, Lesson, 
    Quiz, Question, Choice,
    UserLessonProgress, UserQuizAttempt,
    UserEnrollment,
    MatchingGame, GamePair
)

# --- ধাপ ১: নেস্টেড ইনলাইন তৈরি (ভেতর থেকে বাইরে) ---

class ChoiceInline(nested_admin.NestedTabularInline):
    model = Choice
    extra = 4 
    min_num = 2 

class QuestionInline(nested_admin.NestedStackedInline):
    model = Question
    inlines = [ChoiceInline] 
    extra = 1 
    fieldsets = (
        (None, {
            'fields': ('text', 'points', 'explanation'),
        }),
    )

class QuizInline(nested_admin.NestedStackedInline):
    model = Quiz
    inlines = [QuestionInline] 
    extra = 0 
    fieldsets = (
        (None, {
            'fields': ('title', 'quiz_type', 'lesson', 'unit', 'order'),
        }),
    )
    class Media:
        js = ('api/admin_dynamic_forms.js',) 

class GamePairInline(nested_admin.NestedTabularInline):
    model = GamePair
    extra = 4 

class MatchingGameInline(nested_admin.NestedStackedInline):
    model = MatchingGame
    inlines = [GamePairInline] 
    extra = 0
    fieldsets = (
        (None, {
            'fields': ('title', 'game_type', 'lesson', 'unit', 'order'),
        }),
    )
    class Media:
        js = ('api/admin_dynamic_forms.js',) 

# --- ধাপ ২: প্রধান মডেল অ্যাডমিন ---

class LessonAdmin(nested_admin.NestedModelAdmin): 
    model = Lesson
    inlines = [QuizInline, MatchingGameInline]
    
    list_display = ('__str__', 'unit', 'order') 
    list_filter = ('unit__course',)
    search_fields = ['title', 'unit__title', 'unit__course__title']
    autocomplete_fields = ['unit']
    
    fieldsets = (
        ("Lesson Info", {
            'fields': ('title', 'unit', 'order')
        }),
        ("Lesson Content (Optional)", {
            'classes': ('collapse',), 
            'fields': ('youtube_video_id', 'article_body')
        })
    )

class LessonInlineForUnit(nested_admin.NestedStackedInline):
    model = Lesson
    extra = 1
    fieldsets = (
        (None, {
            'fields': ('title', 'order', 'youtube_video_id', 'article_body'),
        }),
    )
    
class UnitAdmin(nested_admin.NestedModelAdmin): 
    model = Unit
    inlines = [LessonInlineForUnit] 
    
    list_display = ('__str__', 'course', 'order') 
    list_filter = ('course',)
    search_fields = ['title', 'course__title'] # <-- এটি এখানেও দরকার
    autocomplete_fields = ['course']

class UnitInline(nested_admin.NestedStackedInline):
    model = Unit
    extra = 1
    show_change_link = True 
    fields = ('title', 'order')

# --- পরিবর্তন: CourseAdmin এবং CategoryAdmin আপডেট করা হয়েছে ---
class CourseAdmin(nested_admin.NestedModelAdmin): 
    model = Course
    inlines = [UnitInline] 
    list_display = ('title', 'category', 'is_premium')
    list_filter = ('category', 'is_premium')
    search_fields = ['title'] # <-- (গুরুত্বপূর্ণ) এই লাইনটি যোগ করা হয়েছে
    autocomplete_fields = ['category']

class CategoryAdmin(admin.ModelAdmin): # <-- এটি নেস্টেড হওয়ার দরকার নেই
    search_fields = ['name'] # <-- (গুরুত্বপূর্ণ) এই লাইনটি যোগ করা হয়েছে

# --- ধাপ ৩: পুরনো অ্যাডমিন রেজিস্ট্রেশন মুছে নতুন দিয়ে রেজিস্টার করা ---
try:
    admin.site.unregister(Category)
    admin.site.unregister(Course)
    admin.site.unregister(Unit)
    admin.site.unregister(Lesson)
    admin.site.unregister(Quiz)
    admin.site.unregister(Question)
    admin.site.unregister(Choice)
    admin.site.unregister(MatchingGame)
    admin.site.unregister(GamePair)
except admin.sites.NotRegistered:
    pass 

admin.site.register(Category, CategoryAdmin) # <-- পরিবর্তন
admin.site.register(Course, CourseAdmin)
admin.site.register(Unit, UnitAdmin)
admin.site.register(Lesson, LessonAdmin)

admin.site.register(Quiz)
admin.site.register(Question)
admin.site.register(Choice)
admin.site.register(MatchingGame)
admin.site.register(GamePair)

# --- ইউজার প্রোগ্রেস অ্যাডমিন (অপরিবর্তিত) ---
@admin.register(UserLessonProgress)
class UserLessonProgressAdmin(admin.ModelAdmin):
    # ... (কোড অপরিবর্তিত) ...
    list_display = ('user', 'lesson', 'completed_at')
    list_filter = ('user', 'lesson__unit__course')
    search_fields = ('user__username', 'lesson__title')

@admin.register(UserQuizAttempt)
class UserQuizAttemptAdmin(admin.ModelAdmin):
    # ... (কোড অপরিবর্তিত) ...
    list_display = ('user', 'quiz', 'score', 'total_points', 'attempted_at')
    list_filter = ('user', 'quiz__quiz_type')
    search_fields = ('user__username', 'quiz__title')

@admin.register(UserEnrollment)
class UserEnrollmentAdmin(admin.ModelAdmin):
    # ... (কোড অপরিবর্তিত) ...
    list_display = ('user', 'course', 'enrolled_at')
    list_filter = ('user', 'course')
    search_fields = ('user__username', 'course__title')