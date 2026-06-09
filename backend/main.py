from fastapi import FastAPI, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
import aiomysql
import os

app = FastAPI(title="Lapland v2 API")

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "lapland_db"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER", "lapland"),
    "password": os.getenv("DB_PASSWORD", "lapland_pass"),
    "db": os.getenv("DB_NAME", "lapland"),
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

# ── MODELE ────────────────────────────────────────────────────────────

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
    description: Optional[str] = None
    title: Optional[str] = None          # alias used by Finanse.jsx
    amount: float
    paid_by_id: Optional[int] = None
    payer_id: Optional[int] = None       # alias used by Finanse.jsx
    project_id: int
    split_ids: Optional[List[int]] = None
    currency: Optional[str] = "PLN"
    original_amount: Optional[float] = None

class ExpenseCreate(ExpenseBase):
    pass

class Expense(BaseModel):
    id: int
    title: str
    description: str
    amount: float
    paid_by_id: int
    payer_id: int
    project_id: int
    split_ids: List[int]
    currency: str
    original_amount: Optional[float]

class GearItemBase(BaseModel):
    name: str
    category: str
    member_id: int
    project_id: int
    packed: bool = False

class GearItemCreate(GearItemBase):
    pass

class GearItem(GearItemBase):
    id: int

class GearItemPatch(BaseModel):
    packed: Optional[bool] = None
    name: Optional[str] = None

class SharedGearBase(BaseModel):
    name: str
    project_id: int
    packed: bool = False
    taken_by: Optional[int] = None

class SharedGearCreate(SharedGearBase):
    pass

class SharedGear(SharedGearBase):
    id: int

class SharedGearPatch(BaseModel):
    packed: Optional[bool] = None
    taken_by: Optional[int] = None

# ── PROJEKTY ──────────────────────────────────────────────────────────

@app.get("/api/projects", response_model=List[Project])
async def get_projects(pool=Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT id, name, description FROM projects ORDER BY id DESC")
            return await cur.fetchall()

@app.post("/api/projects", response_model=Project)
async def create_project(project: ProjectCreate, pool=Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO projects (name, description) VALUES (%s, %s)",
                (project.name, project.description)
            )
            return {**project.model_dump(), "id": cur.lastrowid}

# ── UCZESTNICY ────────────────────────────────────────────────────────

@app.get("/api/members", response_model=List[Member])
async def get_members(project_id: int = Query(...), pool=Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT id, name, project_id FROM members WHERE project_id = %s", (project_id,)
            )
            return await cur.fetchall()

@app.post("/api/members", response_model=Member)
async def create_member(member: MemberCreate, pool=Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO members (name, project_id) VALUES (%s, %s)",
                (member.name, member.project_id)
            )
            return {**member.model_dump(), "id": cur.lastrowid}

@app.put("/api/members/{member_id}", response_model=Member)
async def update_member(member_id: int, member: MemberCreate, pool=Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "UPDATE members SET name=%s WHERE id=%s AND project_id=%s",
                (member.name, member_id, member.project_id)
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Uczestnik nie znaleziony")
            return {**member.model_dump(), "id": member_id}

@app.delete("/api/members/{member_id}")
async def delete_member(member_id: int, pool=Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM members WHERE id = %s", (member_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Uczestnik nie istnieje")
            return {"status": "success"}

# ── WYDATKI ───────────────────────────────────────────────────────────

def _norm_expense(row: dict) -> dict:
    """Normalize DB row to the shape Finanse.jsx expects."""
    split_ids = []
    if row.get("split_ids"):
        try:
            split_ids = [int(x) for x in str(row["split_ids"]).split(",") if x]
        except Exception:
            pass
    paid_by = row.get("paid_by_id") or row.get("payer_id")
    title   = row.get("title") or row.get("description") or ""
    return {
        **row,
        "title":           title,
        "description":     title,
        "payer_id":        paid_by,
        "paid_by_id":      paid_by,
        "split_ids":       split_ids,
        "currency":        row.get("currency") or "PLN",
        "original_amount": row.get("original_amount"),
    }

@app.get("/api/expenses")
async def get_expenses(project_id: int = Query(...), pool=Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT id, title, description, amount, paid_by_id, project_id, "
                "split_ids, currency, original_amount FROM expenses WHERE project_id = %s",
                (project_id,)
            )
            rows = await cur.fetchall()
            return [_norm_expense(r) for r in rows]

@app.post("/api/expenses")
async def create_expense(expense: ExpenseCreate, pool=Depends(get_db_pool)):
    paid_by = expense.paid_by_id or expense.payer_id
    title   = expense.title or expense.description or ""
    split_ids_str = ",".join(str(i) for i in (expense.split_ids or [paid_by]))
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO expenses (title, description, amount, paid_by_id, project_id, "
                "split_ids, currency, original_amount) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                (title, title, expense.amount, paid_by, expense.project_id,
                 split_ids_str, expense.currency or "PLN", expense.original_amount)
            )
            row_id = cur.lastrowid
    return _norm_expense({
        "id": row_id, "title": title, "description": title,
        "amount": expense.amount, "paid_by_id": paid_by,
        "project_id": expense.project_id, "split_ids": split_ids_str,
        "currency": expense.currency or "PLN", "original_amount": expense.original_amount,
    })

@app.put("/api/expenses/{expense_id}")
async def update_expense(expense_id: int, expense: ExpenseCreate, pool=Depends(get_db_pool)):
    paid_by = expense.paid_by_id or expense.payer_id
    title   = expense.title or expense.description or ""
    split_ids_str = ",".join(str(i) for i in (expense.split_ids or [paid_by]))
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "UPDATE expenses SET title=%s, description=%s, amount=%s, paid_by_id=%s, "
                "split_ids=%s, currency=%s, original_amount=%s "
                "WHERE id=%s AND project_id=%s",
                (title, title, expense.amount, paid_by,
                 split_ids_str, expense.currency or "PLN", expense.original_amount,
                 expense_id, expense.project_id)
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Wydatek nie znaleziony")
    return _norm_expense({
        "id": expense_id, "title": title, "description": title,
        "amount": expense.amount, "paid_by_id": paid_by,
        "project_id": expense.project_id, "split_ids": split_ids_str,
        "currency": expense.currency or "PLN", "original_amount": expense.original_amount,
    })

@app.delete("/api/expenses/{expense_id}")
async def delete_expense(expense_id: int, pool=Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM expenses WHERE id = %s", (expense_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Wydatek nie istnieje")
            return {"status": "success"}

# ── EKWIPUNEK OSOBISTY ────────────────────────────────────────────────

@app.get("/api/gear", response_model=List[GearItem])
async def get_gear(project_id: int = Query(...), pool=Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT id, name, category, member_id, project_id, packed "
                "FROM gear_items WHERE project_id = %s", (project_id,)
            )
            return await cur.fetchall()

@app.post("/api/gear", response_model=GearItem)
async def create_gear(item: GearItemCreate, pool=Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO gear_items (name, category, member_id, project_id, packed) "
                "VALUES (%s,%s,%s,%s,%s)",
                (item.name, item.category, item.member_id, item.project_id, item.packed)
            )
            return {**item.model_dump(), "id": cur.lastrowid}

@app.patch("/api/gear/{item_id}", response_model=GearItem)
async def patch_gear(item_id: int, patch: GearItemPatch, pool=Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            fields = {k: v for k, v in patch.model_dump().items() if v is not None}
            if not fields:
                raise HTTPException(status_code=400, detail="Brak danych do aktualizacji")
            set_clause = ", ".join(f"{k}=%s" for k in fields)
            await cur.execute(
                f"UPDATE gear_items SET {set_clause} WHERE id=%s", (*fields.values(), item_id)
            )
            await cur.execute(
                "SELECT id, name, category, member_id, project_id, packed FROM gear_items WHERE id=%s",
                (item_id,)
            )
            row = await cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Przedmiot nie znaleziony")
            return row

@app.delete("/api/gear/{item_id}")
async def delete_gear(item_id: int, pool=Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM gear_items WHERE id = %s", (item_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Przedmiot nie istnieje")
            return {"status": "success"}

# ── EKWIPUNEK WSPÓLNY ─────────────────────────────────────────────────

@app.get("/api/shared_gear", response_model=List[SharedGear])
async def get_shared_gear(project_id: int = Query(...), pool=Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT id, name, project_id, packed, assigned_member_id AS taken_by "
                "FROM shared_gear WHERE project_id = %s", (project_id,)
            )
            return await cur.fetchall()

@app.post("/api/shared_gear", response_model=SharedGear)
async def create_shared_gear(item: SharedGearCreate, pool=Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO shared_gear (name, project_id, packed, assigned_member_id) "
                "VALUES (%s,%s,%s,%s)",
                (item.name, item.project_id, item.packed, item.taken_by)
            )
            return {**item.model_dump(), "id": cur.lastrowid}

@app.patch("/api/shared_gear/{item_id}", response_model=SharedGear)
async def patch_shared_gear(item_id: int, patch: SharedGearPatch, pool=Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            data = patch.model_dump(exclude_unset=True)
            if "taken_by" in data:
                taken = data.pop("taken_by")
                data["assigned_member_id"] = taken if taken else None
            if not data:
                raise HTTPException(status_code=400, detail="Brak danych")
            set_clause = ", ".join(f"{k}=%s" for k in data)
            await cur.execute(
                f"UPDATE shared_gear SET {set_clause} WHERE id=%s", (*data.values(), item_id)
            )
            await cur.execute(
                "SELECT id, name, project_id, packed, assigned_member_id AS taken_by "
                "FROM shared_gear WHERE id=%s", (item_id,)
            )
            return await cur.fetchone()

@app.delete("/api/shared_gear/{item_id}")
async def delete_shared_gear(item_id: int, pool=Depends(get_db_pool)):
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM shared_gear WHERE id = %s", (item_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Przedmiot nie istnieje")
            return {"status": "success"}
