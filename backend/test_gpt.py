import requests
from dotenv import load_dotenv
import os

load_dotenv()

key = os.getenv("YANDEX_GPT_API_KEY")
folder_id = os.getenv("YANDEX_FOLDER_ID")
model_uri = f"gpt://{folder_id}/yandexgpt-lite"

url = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
headers = {
    "Authorization": f"Api-Key {key}",
    "Content-Type": "application/json"
}
data = {
    "modelUri": model_uri,
    "completionOptions": {
        "stream": False,
        "temperature": 0.7,
        "maxTokens": 100
    },
    "messages": [
        {"role": "system", "text": "Ты помощник."},
        {"role": "user", "text": "Привет"}
    ]
}

response = requests.post(url, json=data, headers=headers)
print("Status:", response.status_code)
print("Response:", response.text)