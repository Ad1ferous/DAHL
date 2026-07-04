<img width="649" height="397" alt="IMG_9648" src="https://github.com/user-attachments/assets/27727314-b909-459d-bee7-f6f250cd13da" />

# Даль — планировщик поездок (прототип)

Сервис для самостоятельных путешественников, который превращает разрозненный список желаемых мест в логичный и выполнимый маршрут с учётом личных предпочтений и времени работы. Использует AI-ассистента (YandexGPT) для генерации маршрутов и отображает предложенные точки на карте 2ГИС в реальном времени.

[![Поддержать рублём](https://img.shields.io/badge/₽-Поддержать_через_ЮMoney-8B3FFC?logo=yandex)]([https://yoomoney.ru/to/ваша_ссылка](https://yoomoney.ru/fundraise/1IQJ4619TEB.260705))


## Быстрый старт

### 1. Клонирование репозитория
``` 
bash
git clone https://github.com/Ad1ferous/DAHL.git
cd DAHL
```

### 2. Запуск бэкенда (Python + FastAPI)
``` 
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
```
Создайте файл .env в папке backend и заполните по образцу .env.example:
``` 
YANDEX_GPT_API_KEY=ваш_ключ
YANDEX_FOLDER_ID=ваш_идентификатор_каталога
YANDEX_GEOCODER_API_KEY=ваш_ключ_геокодера
```
Запустите сервер:
``` 
uvicorn main:app --reload --port 8002
```
Сервер будет доступен по адресу http://localhost:8002.

### 3. Запуск фронтенда (React + Vite)
``` 
cd frontend
npm install
``` 
Создайте файл .env в папке frontend с содержимым:
``` 
VITE_MAPGL_API_KEY=ваш_ключ_2gis
VITE_DIRECTIONS_API_KEY=ваш_ключ_directions (может совпадать с VITE_MAPGL_API_KEY)
``` 
Запустите:
``` 
npm run dev
``` 
Приложение откроется на http://localhost:5173.

### Основные функции прототипа
* Регистрация и вход пользователя
* Создание плана поездки (добавление мест вручную или через поиск по локальной базе)
* AI-генератор маршрута: чат с YandexGPT, история диалога, автоматическое извлечение мест и отображение на карте
* Карта 2ГИС с маркерами и построением пешеходных маршрутов через Directions API
* Оптимизация порядка мест с помощью жадного алгоритма (учёт расстояний по прямой)
* Готовые маршруты для быстрого старта
* Личный кабинет с сохранением всех планов

### Используемые технологии
* Бэкенд	Python, FastAPI, Uvicorn, Geopy
* Фронтенд	React, Vite, React Router, Axios, 2ГИС MapGL JS API
* Карты	2ГИС JavaScript API + @2gis/mapgl-directions
* AI	YandexGPT (через Yandex Cloud API)
* Геокодирование	Яндекс.Геокодер (HTTP API)
* Стили	CSS (адаптированы под Figma)

### Структура проекта
```text
DAHL/
  backend/
    main.py              # все эндпоинты
    requirements.txt
    .env.example
  frontend/
    src/
      pages/
        LoginPage.jsx     # авторизация
        Dashboard.jsx     # личный кабинет
        PlanPage.jsx      # страница планирования (AI + карта)
      styles/
        figma.css         # стили из Figma
      main.jsx            # роутинг
    index.html
    .env.example
  README.md
  .gitignore
```

### Примечания
* Все данные (пользователи, планы, места) хранятся в оперативной памяти сервера. После перезапуска бэкенда потребуется повторная регистрация.
* Ключи API (YandexGPT, Геокодер, 2ГИС) хранятся в .env-файлах и не должны попадать в репозиторий. Для команды подготовлены примеры .env.example.
