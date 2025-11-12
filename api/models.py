# api/models.py

from django.db import models
from django_ckeditor_5.fields import CKEditor5Field
from django.conf import settings 
# --- নতুন ইমপোর্ট ---
from django.contrib.auth.models import User
# --------------------

# ১. বিষয় (Category) মডেল (অপরিবর্তিত)
class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories" 

# ২. কোর্স (Course) মডেল (অপরিবর্তিত)
class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(Category, related_name='courses', on_delete=models.SET_NULL, null=True)
    is_premium = models.BooleanField(default=False)

    def __str__(self):
        return self.title

# ৩. ইউনিট (Unit) মডেল (অপরিবর্তিত)
class Unit(models.Model):
    title = models.CharField(max_length=200)
    course = models.ForeignKey(Course, related_name='units', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0) 

    class Meta:
        ordering = ['order'] 

    def __str__(self):
        # --- পরিবর্তন: অ্যাডমিন প্যানেলে ভালো করে দেখানোর জন্য ---
        return f"{self.course.title} - Unit {self.order}: {self.title}"

# ৪. লেসন (Lesson) মডেল (অপরিবর্তিত)
class Lesson(models.Model):
    title = models.CharField(max_length=200)
    unit = models.ForeignKey(Unit, related_name='lessons', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0) 
    youtube_video_id = models.CharField(max_length=50, blank=True, null=True, help_text="YouTube ভিডিওর ID দিন (যেমন: dQw4w9WgXcQ)")
    article_body = CKEditor5Field('Article Content', blank=True, null=True)

    class Meta:
        ordering = ['order'] 

    def __str__(self):
        # --- পরিবর্তন: অ্যাডমিন প্যানেলে ভালো করে দেখানোর জন্য ---
        return f"{self.unit.course.title} - {self.unit.title} - Lesson {self.order}: {self.title}"
    
# ৫. কুইজ (Quiz) মডেল (অপরিবর্তিত)
class Quiz(models.Model):
    class QuizType(models.TextChoices):
        LESSON_QUIZ = 'LESSON', 'Lesson Quiz'
        UNIT_QUIZ = 'UNIT', 'Unit Quiz (Mastery)'
    title = models.CharField(max_length=200)
    quiz_type = models.CharField(max_length=10, choices=QuizType.choices)
    lesson = models.ForeignKey(Lesson, related_name='quizzes', on_delete=models.CASCADE, null=True, blank=True,
                               help_text="যদি এটি 'Lesson Quiz' হয় তবে এখানে লেসনটি লিঙ্ক করুন")
    unit = models.ForeignKey(Unit, related_name='quizzes', on_delete=models.CASCADE, null=True, blank=True,
                             help_text="যদি এটি 'Unit Quiz' হয় তবে এখানে ইউনিটটি লিঙ্ক করুন")
    order = models.PositiveIntegerField(default=0) 
    class Meta:
        ordering = ['order']
        verbose_name_plural = "Quizzes"
    def __str__(self):
        return f"{self.quiz_type}: {self.title}"

# ৬. প্রশ্ন (Question) মডেল (অপরিবর্তিত, 'explanation' সহ)
class Question(models.Model):
    quiz = models.ForeignKey(Quiz, related_name='questions', on_delete=models.CASCADE)
    text = models.TextField()
    points = models.PositiveIntegerField(default=10, help_text="এই প্রশ্নের জন্য কত পয়েন্ট") 
    explanation = models.TextField(blank=True, null=True, help_text="উত্তরটি কেন সঠিক তার ব্যাখ্যা (ঐচ্ছিক)")

    def __str__(self):
        return self.text[:50] 

# ৭. অপশন (Choice) মডেল (অপরিবর্তিত)
class Choice(models.Model):
    question = models.ForeignKey(Question, related_name='choices', on_delete=models.CASCADE)
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False, help_text="এটি কি সঠিক উত্তর?")
    def __str__(self):
        return f"{self.question.text[:30]}... -> {self.text[:30]} ({self.is_correct})"
    
# ৮. ইউজার লেসন প্রোগ্রেস (অপরিবর্তিত)
class UserLessonProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    completed_at = models.DateTimeField(auto_now_add=True) 
    class Meta:
        unique_together = ('user', 'lesson')
    def __str__(self):
        return f"{self.user.username} completed {self.lesson.title}"

# ৯. ইউজার কুইজ অ্যাটেম্পট (অপরিবর্তিত)
class UserQuizAttempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    score = models.PositiveIntegerField() 
    total_points = models.PositiveIntegerField() 
    attempted_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.user.username} attempted {self.quiz.title} (Score: {self.score}/{self.total_points})"    

# ১০. ইউজার এনরোলমেন্ট মডেল (অপরিবর্তিত)
class UserEnrollment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'course')
    
    def __str__(self):
        return f"{self.user.username} enrolled in {self.course.title}"

# ১১. ম্যাচিং গেম (Matching Game) মডেল (অপরিবর্তিত)
class MatchingGame(models.Model):
    class GameType(models.TextChoices):
        LESSON_GAME = 'LESSON', 'Lesson Game'
        UNIT_GAME = 'UNIT', 'Unit Game'
        
    title = models.CharField(max_length=200)
    game_type = models.CharField(max_length=10, choices=GameType.choices, default=GameType.LESSON_GAME)
    lesson = models.ForeignKey(Lesson, related_name='matching_games', on_delete=models.CASCADE, null=True, blank=True,
                               help_text="যদি এটি 'Lesson Game' হয় তবে এখানে লেসনটি লিঙ্ক করুন")
    unit = models.ForeignKey(Unit, related_name='matching_games', on_delete=models.CASCADE, null=True, blank=True,
                             help_text="যদি এটি 'Unit Game' হয় তবে এখানে ইউনিটটি লিঙ্ক করুন")
    order = models.PositiveIntegerField(default=0, help_text="গেমটি কত নম্বরে দেখাবে")

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.game_type}: {self.title}"

# ১২. গেম পেয়ার (Game Pair) মডেল (অপরিবর্তিত)
class GamePair(models.Model):
    game = models.ForeignKey(MatchingGame, related_name='pairs', on_delete=models.CASCADE)
    item_one = models.CharField(max_length=200, help_text="কার্ড ১ (যেমন: Apple)")
    item_two = models.CharField(max_length=200, help_text="কার্ড ২ (যেমন: আপেল)")

    def __str__(self):
        return f"{self.item_one} <-> {self.item_two}"


# --- নতুন: ১৩. লার্নিং গ্রুপ (LearningGroup) মডেল ---
class LearningGroup(models.Model):
    title = models.CharField(max_length=200, help_text="গ্রুপের নাম")
    # গ্রুপ অ্যাডমিন (Group Admin) হিসেবে যিনি গ্রুপটি তৈরি করেছেন
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        related_name='owned_groups', 
        on_delete=models.CASCADE,
        help_text="গ্রুপের অ্যাডমিন"
    )
    # এই গ্রুপে কোন কোন কোর্স অন্তর্ভুক্ত থাকবে
    courses = models.ManyToManyField(
        'Course', 
        related_name='groups',
        blank=True,
        help_text="এই গ্রুপে অন্তর্ভুক্ত কোর্সসমূহ"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']

# --- নতুন: ১৪. গ্রুপ মেম্বারশিপ (GroupMembership) মডেল ---
class GroupMembership(models.Model):
    group = models.ForeignKey(LearningGroup, related_name='memberships', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='group_memberships', on_delete=models.CASCADE)
    # গ্রুপের অন্যান্য মেম্বারদের কাছ থেকে আলাদাভাবে চিহ্নিত করতে
    is_group_admin = models.BooleanField(default=False, help_text="ইউজার কি এই গ্রুপের অ্যাডমিন?")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'user') # একটি ইউজার একই গ্রুপে দুইবার যোগ হতে পারবে না
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.user.username} is member of {self.group.title}"