from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import List, Optional
import uuid
from geopy.distance import geodesic

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # адрес вашего фронтенда
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Бэкенд работает. Используйте /docs для тестирования API"}

# ------------------ Хранилища ------------------
users = {}          # email -> {"username","password"}
tokens = {}         # token -> email
plans = {}          # plan_id -> {"owner": email, "places": [], "name": str}
ready_routes = [    # готовые подборки
    {"id": "1", "name": "Екатеринбург за день", "places": [
        {"name": "Плотинка", "lat": 56.838, "lng": 60.603},
        {"name": "Ельцин Центр", "lat": 56.844, "lng": 60.595}
    ]},
    {"id": "2", "name": "Музеи", "places": [
        {"name": "Эрмитаж", "lat": 56.836, "lng": 60.605}
    ]}
]
places_db = [       # база всех мест (пока вручную)
    {"name": "Плотинка (Екатеринбург)", "lat": 56.838, "lng": 60.603, "category": "достопримечательность", "work_hours": "09:00-18:00"},
    {"name": "Ельцин Центр", "lat": 56.844, "lng": 60.595, "category": "музей", "work_hours": "10:00-20:00"},
    {"name": "Храм-на-Крови", "lat": 56.844, "lng": 60.610, "category": "религия", "work_hours": "08:00-19:00"},
    # Можно добавить ещё
]

# ------------------ Модели ------------------
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class PlaceCreate(BaseModel):
    name: str
    lat: float
    lng: float

class PlanCreate(BaseModel):
    name: str

# Зависимость для получения текущего пользователя
def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Нет токена")
    token = authorization.split(" ")[1]
    email = tokens.get(token)
    if not email:
        raise HTTPException(status_code=401, detail="Неверный токен")
    return email

# ------------------ Аутентификация ------------------
@app.post("/auth/register")
def register(user: UserRegister):
    if user.email in users:
        raise HTTPException(status_code=400, detail="Уже существует")
    users[user.email] = {"username": user.username, "password": user.password}
    return {"message": "OK"}

@app.post("/auth/login")
def login(user: UserLogin):
    u = users.get(user.email)
    if not u or u["password"] != user.password:
        raise HTTPException(status_code=401, detail="Неверные данные")
    token = str(uuid.uuid4())
    tokens[token] = user.email
    return {"access_token": token, "user": {"username": u["username"], "email": user.email}}

# ------------------ Планы ------------------
@app.post("/plans")
def create_plan(plan: PlanCreate, user=Depends(get_current_user)):
    plan_id = str(uuid.uuid4())
    plans[plan_id] = {"owner": user, "name": plan.name, "places": []}
    return {"plan_id": plan_id, "name": plan.name}

@app.get("/plans")
def get_plans(user=Depends(get_current_user)):
    user_plans = []
    for pid, pdata in plans.items():
        if pdata["owner"] == user:
            user_plans.append({"id": pid, "name": pdata["name"], "places": pdata["places"]})
    return user_plans

@app.get("/plans/{plan_id}")
def get_plan(plan_id: str, user=Depends(get_current_user)):
    plan = plans.get(plan_id)
    if not plan or plan["owner"] != user:
        raise HTTPException(status_code=404, detail="План не найден")
    return {"id": plan_id, "name": plan["name"], "places": plan["places"]}

@app.post("/plans/{plan_id}/places")
def add_place_to_plan(plan_id: str, place: PlaceCreate, user=Depends(get_current_user)):
    plan = plans.get(plan_id)
    if not plan or plan["owner"] != user:
        raise HTTPException(status_code=404, detail="План не найден")
    # Исправлено для совместимости с Pydantic v2
    plan["places"].append(place.model_dump())
    return plan

@app.post("/plans/{plan_id}/optimize")
def optimize_plan(plan_id: str, user=Depends(get_current_user)):
    plan = plans.get(plan_id)
    if not plan or plan["owner"] != user:
        raise HTTPException(status_code=404)
    places_list = plan["places"]
    if len(places_list) <= 2:
        return {"optimized_route": places_list}

    # Жадный алгоритм начиная с первой точки (или можно выбрать самую южную)
    remaining = places_list.copy()
    ordered = []
    current = remaining.pop(0)  # начнём с первой точки в списке
    ordered.append(current)
    while remaining:
        # найдём ближайшую к current точку
        next_point = min(remaining, key=lambda p: geodesic((current["lat"], current["lng"]), (p["lat"], p["lng"])).km)
        remaining.remove(next_point)
        ordered.append(next_point)
        current = next_point
    plan["places"] = ordered
    return {"optimized_route": ordered}

# ------------------ Готовые маршруты ------------------
@app.get("/ready-routes")
def get_ready_routes():
    return ready_routes

# ------------------ AI подбор мест (поиск по названию/категории) ------------------
@app.get("/places/search")
def search_places(q: str):
    results = []
    for p in places_db:
        if q.lower() in p["name"].lower() or q.lower() in p["category"].lower():
            results.append(p)
    return results