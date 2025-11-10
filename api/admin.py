# api/admin.py

from django.contrib import admin
from .models import (
    Category, Course, Unit, Lesson, 
    Quiz, Question, Choice,
    UserEnrollment  # <-- এটি ইম্পোর্ট করা আছে
)

# --- কুইজ সিস্টেমের জন্য অ্যাডভান্সড অ্যাডমিন ---
class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 3 

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    inlines = [ChoiceInline]
    list_display = ('text', 'quiz', 'points')
    list_filter = ('quiz',)

class QuestionInline(admin.StackedInline):
    model = Question
    inlines = [ChoiceInline] 
    extra = 1 

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    inlines = [QuestionInline]
    list_display = ('title', 'quiz_type', 'lesson', 'unit')
    list_filter = ('quiz_type', 'unit__course__category')
    
    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('questions__choices')

# --- অন্যান্য মডেলগুলো রেজিস্ট্রেশন ---
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'is_premium')
    list_filter = ('category', 'is_premium')

@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order')
    list_filter = ('course__category',)

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'unit', 'order')
    list_filter = ('unit__course__category',)
    search_fields = ('title', 'article_body')


# --- (এই সেকশনটি পরিবর্তন করা হয়েছে) ---
@admin.register(UserEnrollment)
class UserEnrollmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'enrolled_at')
    list_filter = ('course',)
    
    # --- (পরিবর্তন) আমরা এখানে ইমেইল দিয়ে সার্চ করার সুবিধা যোগ করেছি ---
    search_fields = ('user__username', 'user__email', 'course__title')