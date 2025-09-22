# apps/accounts/forms.py

from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model
from .models import UserProfile

User = get_user_model()

class UserRegistrationForm(UserCreationForm):
    """User registration form with additional fields."""
    
    email = forms.EmailField(required=True)
    first_name = forms.CharField(max_length=30, required=True)
    last_name = forms.CharField(max_length=30, required=True)
    employee_id = forms.CharField(max_length=50, required=False, help_text='Optional employee ID')
    department = forms.CharField(max_length=100, required=False)
    position = forms.CharField(max_length=100, required=False)
    phone = forms.CharField(max_length=20, required=False)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'employee_id', 
                 'department', 'position', 'phone', 'password1', 'password2')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Add CSS classes
        for field_name, field in self.fields.items():
            field.widget.attrs['class'] = 'form-control'
            
        # Add placeholders
        self.fields['username'].widget.attrs['placeholder'] = 'Enter username'
        self.fields['email'].widget.attrs['placeholder'] = 'Enter email address'
        self.fields['first_name'].widget.attrs['placeholder'] = 'First name'
        self.fields['last_name'].widget.attrs['placeholder'] = 'Last name'
        self.fields['employee_id'].widget.attrs['placeholder'] = 'Employee ID (optional)'
        self.fields['department'].widget.attrs['placeholder'] = 'Department'
        self.fields['position'].widget.attrs['placeholder'] = 'Job position'
        self.fields['phone'].widget.attrs['placeholder'] = 'Phone number'
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('A user with this email already exists.')
        return email
    
    def clean_employee_id(self):
        employee_id = self.cleaned_data.get('employee_id')
        if employee_id and User.objects.filter(employee_id=employee_id).exists():
            raise forms.ValidationError('A user with this employee ID already exists.')
        return employee_id

class UserProfileForm(forms.ModelForm):
    """User profile update form."""
    
    class Meta:
        model = UserProfile
        fields = ('bio', 'timezone', 'language', 'email_notifications', 'approval_notifications')
        widgets = {
            'bio': forms.Textarea(attrs={'rows': 4, 'class': 'form-control'}),
            'timezone': forms.Select(attrs={'class': 'form-control'}),
            'language': forms.Select(attrs={'class': 'form-control'}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Timezone choices
        self.fields['timezone'].choices = [
            ('Australia/Brisbane', 'Brisbane (AEST/AEDT)'),
            ('Australia/Sydney', 'Sydney (AEST/AEDT)'),
            ('Australia/Melbourne', 'Melbourne (AEST/AEDT)'),
            ('Australia/Perth', 'Perth (AWST)'),
            ('UTC', 'UTC'),
        ]
        
        # Language choices
        self.fields['language'].choices = [
            ('en', 'English'),
            ('zh', 'Chinese'),
            ('es', 'Spanish'),
            ('fr', 'French'),
        ]

class UserUpdateForm(forms.ModelForm):
    """Form for updating user information (admin use)."""
    
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'employee_id', 
                 'department', 'position', 'phone', 'is_active', 'is_approved')
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'first_name': forms.TextInput(attrs={'class': 'form-control'}),
            'last_name': forms.TextInput(attrs={'class': 'form-control'}),
            'employee_id': forms.TextInput(attrs={'class': 'form-control'}),
            'department': forms.TextInput(attrs={'class': 'form-control'}),
            'position': forms.TextInput(attrs={'class': 'form-control'}),
            'phone': forms.TextInput(attrs={'class': 'form-control'}),
        }
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exclude(pk=self.instance.pk).exists():
            raise forms.ValidationError('A user with this email already exists.')
        return email