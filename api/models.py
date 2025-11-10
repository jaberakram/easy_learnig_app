# api/models.py

from django.db import models
from django_ckeditor_5.fields import CKEditor5Field
from django.conf import settings # <-- এই লাইনটি ইম্পোর্ট করুন

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
    
    # --- (নতুন) প্রিমিয়াম ফিল্ড ---
    is_premium = models.BooleanField(default=False)
    # --------------------------

    def __str__(self):
        return self.title

# ৩. ইউনিট (Unit) মডেল (অপরিবর্তিত)
class Unit(models.Model):
    title = models.CharField(max_length=200)
    course = models.ForeignKey(Course, related_name='units', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0) # ইউনিটগুলো সাজানোর জন্য (যেমন: ইউনিট ১, ইউনিট ২)

    class Meta:
        ordering = ['order'] # 'order' ফিল্ড অনুযায়ী সাজানো থাকবে

    def __str__(self):
        return f"{self.course.title} - Unit {self.order}: {self.title}"

# ৪. লেসন (Lesson) মডেল (অপরিবর্তিত)
class Lesson(models.Model):
    title = models.CharField(max_length=200)
    unit = models.ForeignKey(Unit, related_name='lessons', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0) # লেসনগুলো সাজানোর জন্য
    youtube_video_id = models.CharField(max_length=50, blank=True, null=True, help_text="YouTube ভিডিওর ID দিন (যেমন: dQw4w9WgXcQ)")
    article_body = CKEditor5Field('Article Content', blank=True, null=True)

    class Meta:
        ordering = ['order'] # 'order' ফিল্ড অনুযায়ী সাজানো থাকবে

    def __str__(self):
        return f"{self.unit.title} - Lesson {self.order}: {self.title}"
    
# ... (Quiz, Question, Choice মডেলগুলো অপরিবর্তিত থাকবে) ...
# (নিচের কোডগুলো কপি করে Quiz, Question, Choice মডেলের পরে পেস্ট করুন)

# ৫. কুইজ (Quiz) মডেল
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


# ৬. প্রশ্ন (Question) মডেল
class Question(models.Model):
    quiz = models.ForeignKey(Quiz, related_name='questions', on_delete=models.CASCADE)
    text = models.TextField()
    points = models.PositiveIntegerField(default=10, help_text="এই প্রশ্নের জন্য কত পয়েন্ট") 
    def __str__(self):
        return self.text[:50] 


# ৭. অপশন (Choice) মডেল
class Choice(models.Model):
    question = models.ForeignKey(Question, related_name='choices', on_delete=models.CASCADE)
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False, help_text="এটি কি সঠিক উত্তর?")
    def __str__(self):
        return f"{self.question.text[:30]}... -> {self.text[:30]} ({self.is_correct})"
    


# ... (UserLessonProgress এবং UserQuizAttempt মডেল অপরিবর্তিত থাকবে) ...
# (নিচের কোডগুলো UserLessonProgress ও UserQuizAttempt মডেলের পরে পেস্ট করুন)

# ৮. ইউজার লেসন প্রোগ্রেস (ভিডিও/আর্টিকেল শেষ করা)
class UserLessonProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    completed_at = models.DateTimeField(auto_now_add=True) 
    class Meta:
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


# --- (নতুন) ১০. ইউজার এনরোলমেন্ট মডেল ---
# কোন ইউজার কোন প্রিমিয়াম কোর্স কিনেছে তার হিসাব
class UserEnrollment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # একজন ইউজার যেন একটি কোর্সে একবারই এনরোল করতে পারে
        unique_together = ('user', 'course')
    
    def __str__(self):
        return f"{self.user.username} enrolled in {self.course.title}"