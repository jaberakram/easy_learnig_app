# api/admin.py
from django.contrib import admin
import nested_admin 
from .models import (
    Category, Course, Unit, Lesson, 
    Quiz, Question, Choice,
    UserLessonProgress, UserQuizAttempt,
    UserEnrollment, MatchingGame, GamePair,
    LearningGroup, GroupMembership,
    # --- নতুন মডেল ইমপোর্ট ---
    Notice, Promotion
)

# ... (ChoiceInline, QuestionInline, QuizInline, GamePairInline, MatchingGameInline অপরিবর্তিত) ...

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


# --- নতুন: নোটিশ ও প্রমোশন অ্যাডমিন ক্লাস ---
@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('title', 'body')
    
@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'is_active', 'created_at')
    list_filter = ('is_active', 'course')
    search_fields = ('title', 'subtitle')
    autocomplete_fields = ['course']
# ----------------------------------------


# --- বাকি অ্যাডমিন ক্লাসগুলো (অপরিবর্তিত) ---

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
    search_fields = ['title', 'course__title'] 
    autocomplete_fields = ['course']

class UnitInline(nested_admin.NestedStackedInline):
    model = Unit
    extra = 1
    show_change_link = True 
    fields = ('title', 'order')

class CourseAdmin(nested_admin.NestedModelAdmin): 
    model = Course
    inlines = [UnitInline] 
    list_display = ('title', 'category', 'is_premium')
    list_filter = ('category', 'is_premium')
    search_fields = ['title']
    autocomplete_fields = ['category']

class CategoryAdmin(admin.ModelAdmin): 
    search_fields = ['name'] 

# --- গ্রুপ অ্যাডমিন ক্লাস (অপরিবর্তিত) ---
class GroupMembershipInline(admin.TabularInline): 
    model = GroupMembership
    extra = 1
    autocomplete_fields = ['user'] 
    fields = ('user', 'is_group_admin')
    readonly_fields = ('user',)

class LearningGroupAdmin(admin.ModelAdmin): 
    list_display = ('id', 'title', 'admin', 'created_at', 'get_member_count')
    list_filter = ('admin',)
    search_fields = ['title', 'admin__username']
    filter_horizontal = ('courses',) 
    inlines = [GroupMembershipInline]
    readonly_fields = ('admin', 'id')
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.admin = request.user
        super().save_model(request, obj, form, change)

    def get_member_count(self, obj):
        return obj.memberships.count()
    get_member_count.short_description = 'Members'


# --- মডেল রেজিস্ট্রেশন ---
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
    admin.site.unregister(LearningGroup)
    admin.site.unregister(GroupMembership)
except admin.sites.NotRegistered:
    pass 

admin.site.register(Category, CategoryAdmin)
admin.site.register(Course, CourseAdmin)
admin.site.register(Unit, UnitAdmin)
admin.site.register(Lesson, LessonAdmin)

admin.site.register(Quiz)
admin.site.register(Question)
admin.site.register(Choice)
admin.site.register(MatchingGame)
admin.site.register(GamePair)

admin.site.register(LearningGroup, LearningGroupAdmin)
admin.site.register(GroupMembership)


# --- ইউজার প্রোগ্রেস অ্যাডমিন (অপরিবর্তিত) ---
@admin.register(UserLessonProgress)
class UserLessonProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'lesson', 'completed_at')
    list_filter = ('user', 'lesson__unit__course')
    search_fields = ('user__username', 'lesson__title')

@admin.register(UserQuizAttempt)
class UserQuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz', 'score', 'total_points', 'attempted_at')
    list_filter = ('user', 'quiz__quiz_type')
    search_fields = ('user__username', 'quiz__title')

@admin.register(UserEnrollment)
class UserEnrollmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'enrolled_at')
    list_filter = ('user', 'course')
    search_fields = ('user__username', 'course__title')