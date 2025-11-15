# api/models.py
from django.db import models
from django.contrib.auth.models import User
from django.db.models import Sum, Q, F, Window, IntegerField
from django.db.models.functions import Rank
from django_ckeditor_5.fields import CKEditor5Field # CKEditor

# === মডেল ===

class Category(models.Model):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name

class Course(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='courses')
    title = models.CharField(max_length=200)
    description = models.TextField()
    is_premium = models.BooleanField(default=False) 

    def __str__(self):
        return self.title

class Unit(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='units')
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=1)
    
    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.course.title} - Unit {self.order}: {self.title}"

class Lesson(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=1)
    
    # কন্টেন্ট টাইপ
    youtube_video_id = models.CharField(max_length=50, blank=True, null=True)
    article_body = CKEditor5Field('Article', blank=True, null=True)
    
    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.unit.title} - Lesson {self.order}: {self.title}"

# === কুইজ সিস্টেম ===

class Quiz(models.Model):
    QUIZ_TYPES = (
        ('LESSON', 'Lesson Quiz'),
        ('UNIT', 'Unit Mastery Quiz'),
    )
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='quizzes', blank=True, null=True)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='quizzes', blank=True, null=True)
    title = models.CharField(max_length=200)
    quiz_type = models.CharField(max_length=10, choices=QUIZ_TYPES, default='LESSON')
    
    def __str__(self):
        return self.title

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    points = models.PositiveIntegerField(default=1)
    explanation = models.TextField(blank=True, null=True) 

    def __str__(self):
        return self.text[:50]

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.question.text[:30]}... -> {self.text} ({self.is_correct})"

# === ম্যাচিং গেম ===

class MatchingGame(models.Model):
    GAME_TYPES = (
        ('LESSON', 'Lesson Game'),
        ('UNIT', 'Unit Game'),
    )
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='matching_games', blank=True, null=True)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='matching_games', blank=True, null=True)
    title = models.CharField(max_length=200)
    game_type = models.CharField(max_length=10, choices=GAME_TYPES, default='LESSON')
    order = models.PositiveIntegerField(default=1)
    
    class Meta:
        ordering = ['order']
        
    def __str__(self):
        return self.title

class GamePair(models.Model):
    game = models.ForeignKey(MatchingGame, on_delete=models.CASCADE, related_name='pairs')
    item_one = models.CharField(max_length=100)
    item_two = models.CharField(max_length=100)
    
    def __str__(self):
        return f"{self.item_one} <-> {self.item_two}"

# === ইউজার প্রোগ্রেস ===

# --- UserLessonProgress মডেলটি মুছে ফেলা হয়েছে ---
# class UserLessonProgress(models.Model):
#    ...
# ------------------------------------------

class UserQuizAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    score = models.PositiveIntegerField()
    total_points = models.PositiveIntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.quiz.title} ({self.score}/{self.total_points})"

class UserEnrollment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'course')
        
    def __str__(self):
        return f"{self.user.username} enrolled in {self.course.title}"

# === স্টাডি গ্রুপ ===

class LearningGroup(models.Model):
    title = models.CharField(max_length=200)
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_groups')
    courses = models.ManyToManyField(Course, related_name='learning_groups', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title

class GroupMembership(models.Model):
    group = models.ForeignKey(LearningGroup, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_groups')
    is_group_admin = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('group', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.group.title}"

# === অ্যাডমিন নোটিশ ===

class Notice(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Promotion(models.Model):
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=255, blank=True, null=True)
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='promotions')
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.title