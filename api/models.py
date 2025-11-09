# api/models.py

from django.db import models
from django_ckeditor_5.fields import CKEditor5Field # CKEditor 5-এর জন্য এটি import করুন

# ১. বিষয় (Category) মডেল
class Category(models.Model):
    name = models.CharField(max_length=100)
    # icon = models.ImageField(upload_to='category_icons/', null=True, blank=True) # ছবির জন্য পরে যোগ করবো

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories" # অ্যাডমিন প্যানেলে 'Categorys' না দেখিয়ে 'Categories' দেখাবে

# ২. কোর্স (Course) মডেল
class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(Category, related_name='courses', on_delete=models.SET_NULL, null=True)
    # image = models.ImageField(upload_to='course_thumbnails/', null=True, blank=True) # ছবির জন্য পরে যোগ করবো

    def __str__(self):
        return self.title

# ৩. ইউনিট (Unit) মডেল
class Unit(models.Model):
    title = models.CharField(max_length=200)
    course = models.ForeignKey(Course, related_name='units', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0) # ইউনিটগুলো সাজানোর জন্য (যেমন: ইউনিট ১, ইউনিট ২)

    class Meta:
        ordering = ['order'] # 'order' ফিল্ড অনুযায়ী সাজানো থাকবে

    def __str__(self):
        return f"{self.course.title} - Unit {self.order}: {self.title}"

# ৪. লেসন (Lesson) মডেল
class Lesson(models.Model):
    title = models.CharField(max_length=200)
    unit = models.ForeignKey(Unit, related_name='lessons', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0) # লেসনগুলো সাজানোর জন্য
    
    # --- কনটেন্ট ---
    # এই ফিল্ডগুলো ঐচ্ছিক (Optional) হবে
    youtube_video_id = models.CharField(max_length=50, blank=True, null=True, help_text="YouTube ভিডিওর ID দিন (যেমন: dQw4w9WgXcQ)")
    
    # Rich Text Editor (ছবি, মাইন্ডম্যাপ সহ আর্টিকেলের জন্য)
    article_body = CKEditor5Field('Article Content', blank=True, null=True)

    class Meta:
        ordering = ['order'] # 'order' ফিল্ড অনুযায়ী সাজানো থাকবে

    def __str__(self):
        return f"{self.unit.title} - Lesson {self.order}: {self.title}"
    
# api/models.py (আগের কোডের নিচে এটি যোগ করুন)

# ৫. কুইজ (Quiz) মডেল
class Quiz(models.Model):
    # কুইজের ধরণ (Type)
    class QuizType(models.TextChoices):
        LESSON_QUIZ = 'LESSON', 'Lesson Quiz'
        UNIT_QUIZ = 'UNIT', 'Unit Quiz (Mastery)'

    title = models.CharField(max_length=200)
    quiz_type = models.CharField(max_length=10, choices=QuizType.choices)

    # লিঙ্ক (Links) - আমাদের পরিকল্পনা অনুযায়ী
    # একটি কুইজ হয় একটি লেসনের সাথে অথবা একটি ইউনিটের সাথে লিঙ্কড থাকবে
    lesson = models.ForeignKey(Lesson, related_name='quizzes', on_delete=models.CASCADE, null=True, blank=True,
                               help_text="যদি এটি 'Lesson Quiz' হয় তবে এখানে লেসনটি লিঙ্ক করুন")
    unit = models.ForeignKey(Unit, related_name='quizzes', on_delete=models.CASCADE, null=True, blank=True,
                             help_text="যদি এটি 'Unit Quiz' হয় তবে এখানে ইউনিটটি লিঙ্ক করুন")
    
    order = models.PositiveIntegerField(default=0) # কুইজ সাজানোর জন্য

    class Meta:
        ordering = ['order']
        verbose_name_plural = "Quizzes"

    def __str__(self):
        return f"{self.quiz_type}: {self.title}"


# ৬. প্রশ্ন (Question) মডেল
class Question(models.Model):
    quiz = models.ForeignKey(Quiz, related_name='questions', on_delete=models.CASCADE)
    text = models.TextField()
    points = models.PositiveIntegerField(default=10, help_text="এই প্রশ্নের জন্য কত পয়েন্ট") # আমাদের পরিকল্পনা অনুযায়ী

    def __str__(self):
        return self.text[:50] # প্রশ্নের প্রথম ৫০ অক্ষর দেখাবে


# ৭. অপশন (Choice) মডেল
class Choice(models.Model):
    question = models.ForeignKey(Question, related_name='choices', on_delete=models.CASCADE)
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False, help_text="এটি কি সঠিক উত্তর?")

    def __str__(self):
        return f"{self.question.text[:30]}... -> {self.text[:30]} ({self.is_correct})"
    


# api/models.py (ফাইলটির একদম শেষে যোগ করুন)

from django.conf import settings # <-- এটি import করতে ভুলবেন না

# ... (আপনার আগের সব মডেল: Category, Course, Unit, Lesson, Quiz, Question, Choice) ...


# --- (নতুন) ইউজার প্রোগ্রেস মডেল ---

# ৮. ইউজার লেসন প্রোগ্রেস (ভিডিও/আর্টিকেল শেষ করা)
class UserLessonProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    completed_at = models.DateTimeField(auto_now_add=True) # কখন শেষ করেছে

    class Meta:
        # একজন ইউজার যেন একটি লেসন একবারই 'সম্পন্ন' করতে পারে
        unique_together = ('user', 'lesson')

    def __str__(self):
        return f"{self.user.username} completed {self.lesson.title}"


# ৯. ইউজার কুইজ অ্যাটেম্পট (কুইজের ফলাফল)
class UserQuizAttempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    score = models.PositiveIntegerField() # ব্যবহারকারী কত পেয়েছে
    total_points = models.PositiveIntegerField() # কুইজটি মোট কত পয়েন্টের ছিল
    attempted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} attempted {self.quiz.title} (Score: {self.score}/{self.total_points})"    