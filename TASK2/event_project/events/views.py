from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse
from .models import Event, Registration
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
import json


def signup(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm = request.POST.get('confirm_password')

        if password != confirm:
            return render(request, 'events/signup.html', {'error': 'Passwords do not match.'})

        if User.objects.filter(username=username).exists():
            return render(request, 'events/signup.html', {'error': 'Username already taken.'})

        User.objects.create_user(username=username, email=email, password=password)
        return redirect('login')

    return render(request, 'events/signup.html')


def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)

        if user:
            login(request, user)
            return redirect('event_list')
        else:
            return render(request, 'events/login.html', {'error': 'Invalid username or password.'})

    return render(request, 'events/login.html')


def logout_view(request):
    logout(request)
    return redirect('event_list')


@login_required
def create_event(request):
    if request.method == 'POST':
        title = request.POST.get('title')
        description = request.POST.get('description')
        date = request.POST.get('date')
        location = request.POST.get('location')
        capacity = request.POST.get('capacity')

        Event.objects.create(
            title=title,
            description=description,
            date=date,
            location=location,
            capacity=capacity
        )
        return redirect('event_list')

    return render(request, 'events/create_event.html')

def event_list(request):
    """Show all events."""
    events = Event.objects.all()
    return render(request, 'events/event_list.html', {'events': events})

def event_detail(request, event_id):
    """Show one event + its registrations."""
    event = get_object_or_404(Event, id=event_id)
    registrations = event.registrations.all()
    spots_left = event.capacity - registrations.count()
    return render(request, 'events/event_detail.html', {
        'event': event,
        'registrations': registrations,
        'spots_left': spots_left
    })

def register(request, event_id):
    """Register someone for an event."""
    event = get_object_or_404(Event, id=event_id)

    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')

        if not name or not email:
            return render(request, 'events/register.html', {
                'event': event,
                'error': 'Name and email are required.'
            })

        # Check if already registered
        if Registration.objects.filter(event=event, email=email).exists():
            return render(request, 'events/register.html', {
                'event': event,
                'error': 'This email is already registered for this event.'
            })

        # Check capacity
        if event.registrations.count() >= event.capacity:
            return render(request, 'events/register.html', {
                'event': event,
                'error': 'This event is full!'
            })

        Registration.objects.create(event=event, name=name, email=email)
        return redirect('event_detail', event_id=event.id)

    return render(request, 'events/register.html', {'event': event})

def cancel_registration(request, registration_id):
    """Cancel a registration."""
    registration = get_object_or_404(Registration, id=registration_id)
    event_id = registration.event.id
    registration.delete()
    return redirect('event_detail', event_id=event_id)

def my_registrations(request):
    """View all registrations (search by email)."""
    email = request.GET.get('email', '')
    registrations = []

    if email:
        registrations = Registration.objects.filter(email=email)

    return render(request, 'events/my_registrations.html', {
        'registrations': registrations,
        'email': email
    })