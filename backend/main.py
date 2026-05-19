from fastapi import FastAPI, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
import aiomysql
import os

app = FastAPI(title="Lapland v2 API")

DB_CONFIG = {
    "host": "lapland_db",
    "port": 3306,
    "user": os.getenv("MARIADB_USER", "root"),
    "password": os.getenv("MARIADB_PASSWORD", "secret"),
    "db": os.getenv("MARIADB_DATABASE", "lapland"),
    "autocommit": True
}

async def get_db_pool():
    if not hasattr(app, "db_pool"):
        app.db_pool = await aiomysql.create_pool(**DB_CONFIG)
    return app.db_pool

@app.on_event("shutdown")
async def shutdown_event():
    if hasattr(app, "db_pool"):
        app.db_pool.close()
        await app.db_pool.wait_closed()

# --- MODELE PYDANTIC ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int

class MemberBase(BaseModel):
    name: str
    project_id: int

class MemberCreate(MemberBase):
    pass

class Member(MemberBase):
    id: int

class ExpenseBase(BaseModel):
    description: str
    amount: float
    paid_by_id: int
    project_id: int

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int

# --- ENDPOINTY: PROJEKTY ---
@app.get("/api/projects", response_model=List[Project])
async def get_projects(pool = Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT id, name, description FROM projects")
            return await cur.fetchall()

@app.post("/api/projects", response_model=Project)
async def create_project(project: ProjectCreate, pool = Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "INSERT INTO projects (name, description) VALUES (%s, %s)",
                (project.name, project.description)
            )
            return {**project.model_dump(), "id": cur.lastrowid}

# --- ENDPOINTY: CZŁONKOWIE ---
@app.get("/api/members", response_model=List[Member])
async def get_members(project_id: int = Query(...), pool = Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT id, name, project_id FROM members WHERE project_id = %s", (project_id,))
            return await cur.fetchall()

@app.post("/api/members", response_model=Member)
async def create_member(member: MemberCreate, pool = Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "INSERT INTO members (name, project_id) VALUES (%s, %s)",
                (member.name, member.project_id)
            )
            return {**member.model_dump(), "id": cur.lastrowid}

# --- ENDPOINTY: WYDATKI ---
@app.get("/api/expenses", response_model=List[Expense])
async def get_expenses(project_id: int = Query(...), pool = Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT id, description, amount, paid_by_id, project_id FROM expenses WHERE project_id = %s", (project_id,))
            return await cur.fetchall()

@app.post("/api/expenses", response_model=Expense)
async def create_expense(expense: ExpenseCreate, pool = Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "INSERT INTO expenses (description, amount, paid_by_id, project_id) VALUES (%s, %s, %s, %s)",
                (expense.description, expense.amount, expense.paid_by_id, expense.project_id)
            )
            return {**expense.model_dump(), "id": cur.lastrowid}

@app.put("/api/expenses/{expense_id}", response_model=Expense)
async def update_expense(expense_id: int, expense: ExpenseCreate, pool = Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "UPDATE expenses SET description=%s, amount=%s, paid_by_id=%s WHERE id=%s AND project_id=%s",
                (expense.description, expense.amount, expense.paid_by_id, expense_id, expense.project_id)
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Wydatek nie znaleziony lub nie należy do tego projektu")
            return {**expense.model_dump(), "id": expense_id}

@app.delete("/api/expenses/{expense_id}")
async def delete_expense(expense_id: int, pool = Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM expenses WHERE id = %s", (expense_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Wydatek nie istnieje")
            return {"status": "success", "message": "Wydatek usunięty"}

# --- HEALTH CHECK ---
@app.get("/health")
async def health_check():
    return {"status": "healthy"}