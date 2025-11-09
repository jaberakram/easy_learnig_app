# api/admin.py

from django.contrib import admin
from .models import (
    Category, Course, Unit, Lesson, 
    Quiz, Question, Choice
)

# --- কুইজ সিস্টেমের জন্য অ্যাডভান্সড অ্যাডমিন ---
# আমাদের পরিকল্পনা অনুযায়ী, আমরা প্রশ্ন ও উত্তরগুলো 
# সরাসরি কুইজ পেজ থেকেই যোগ করবো।

# ১. Choice-কে Question-এর ভেতরে দেখানোর জন্য
class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 3  # ডিফল্টভাবে ৩টি অপশন দেখানোর বক্স থাকবে

# ২. Question অ্যাডমিন (যাতে ChoiceInline যুক্ত আছে)
@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    inlines = [ChoiceInline]
    list_display = ('text', 'quiz', 'points')
    list_filter = ('quiz',)

# ৩. Question-কে Quiz-এর ভেতরে দেখানোর জন্য
class QuestionInline(admin.StackedInline):
    model = Question
    inlines = [ChoiceInline] # একটি ইনলাইনের ভেতরে আরেকটি ইনলাইন (নেস্টেড)
    extra = 1  # ডিফল্টভাবে ১টি প্রশ্ন দেখানোর বক্স থাকবে

# ৪. Quiz অ্যাডমিন (যাতে QuestionInline যুক্ত আছে)
@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    inlines = [QuestionInline]
    list_display = ('title', 'quiz_type', 'lesson', 'unit')
    list_filter = ('quiz_type', 'unit__course__category')
    
    # এই কোডটি অ্যাডমিন প্যানেলকে দ্রুততর করে
    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('questions__choices')

# --- অন্যান্য মডেলগুলো রেজিস্ট্রেশন ---
# আমরা এগুলোকেও ইনলাইন করতে পারি, কিন্তু আপাতত সহজ রাখছি

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'category')
    list_filter = ('category',)

@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order')
    list_filter = ('course__category',)

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'unit', 'order')
    list_filter = ('unit__course__category',)
    search_fields = ('title', 'article_body')

# Register your models here.
