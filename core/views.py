import os
import requests
from django.conf import settings
from django.shortcuts import render, redirect
from django.contrib import messages

# --- TELEGRAM UPLINK FUNCTION ---
def send_telegram_message(message):
    """
    Fetches credentials from settings (loaded from .env), cleans them,
    and fires the message to your Telegram Group safely.
    """
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID

    # 1. Safety Check: Warn in console if keys are missing
    if not token or not chat_id:
        print("⚠️ ERROR: Telegram credentials missing in settings/.env")
        return

    # 2. Clean tokens
    token = str(token).strip()
    chat_id = str(chat_id).strip()

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown"
    }
    
    try:
        # 3. Add timeout (5s)
        response = requests.post(url, json=payload, timeout=5)
        response.raise_for_status() 
    except Exception as e:
        # 4. Crash Prevention
        print(f"❌ UPLINK FAILED: {e}")

# --- VIEW FUNCTIONS ---

def index(request):
    """
    Main Dashboard View.
    Passes Supabase credentials to the frontend for the Live Feed.
    """
    # Get keys from .env (via os.environ)
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_KEY')

    context = {
        'supabase_url': supabase_url,
        'supabase_key': supabase_key,
    }
    return render(request, 'core/index.html', context)

def projects(request):
    return render(request, 'core/projects.html')

def certifications(request):
    return render(request, 'core/certifications.html')

def contact(request):
    if request.method == 'POST':
        # 1. Capture the form data
        name = request.POST.get('operator_id')
        subject = request.POST.get('subject')
        msg_body = request.POST.get('message')

        # 2. Format the message
        formatted_message = (
            f"🚨 *INCOMING TRANSMISSION* 🚨\n\n"
            f"👤 *Operator:* `{name}`\n"
            f"📂 *Subject:* `{subject}`\n"
            f"📝 *Payload:* \n{msg_body}"
        )

        # 3. Fire the Uplink
        send_telegram_message(formatted_message)

        # 4. Show success message
        messages.success(request, 'UPLINK SUCCESSFUL. TRANSMISSION SENT.')
        return redirect('contact')

    return render(request, 'core/contact.html')