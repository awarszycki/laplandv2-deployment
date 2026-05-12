from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import aiomysql
import os
import json

app = FastAPI(title="Lapland 2026 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "lapland_db"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER", "lapland"),
    "password": os.getenv("DB_PASSWORD", "lapland_pass"),
    "db": os.getenv("DB_NAME", "lapland"),
    "autocommit": True,
}

async def get_db():
    conn = await aiomysql.connect(**DB_CONFIG)
    try:
        yield conn
    finally:
        conn.close()

# ─── MODELS ───────────────────────────────────────────────────────────────────

class Member(BaseModel):
    id: Optional[int] = None
    name: str

class Expense(BaseModel):
    id: Optional[int] = None
    title: str
    amount: float
    original_amount: float
    currency: str
    payer_id: int
    split_ids: List[int]
    date: Optional[str] = None

class GearItem(BaseModel):
    id: Optional[int] = None
    member_id: int
    category: str
    name: str
    packed: bool = False

class SharedGearItem(BaseModel):
    id: Optional[int] = None
    name: str
    taken_by: Optional[int] = None
    packed: bool = False

class SharedGearUpdate(BaseModel):
    taken_by: Optional[int] = None
    packed: Optional[bool] = None

# ─── MEMBERS ──────────────────────────────────────────────────────────────────

@app.get("/members")
async def get_members(conn=Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM members ORDER BY id")
        return await cur.fetchall()

@app.post("/members", status_code=201)
async def add_member(member: Member, conn=Depends(get_db)):
    async with conn.cursor() as cur:
        await cur.execute("INSERT INTO members (name) VALUES (%s)", (member.name,))
        member_id = cur.lastrowid
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM members WHERE id = %s", (member_id,))
        return await cur.fetchone()

@app.put("/members/{member_id}")
async def update_member(member_id: int, member: Member, conn=Depends(get_db)):
    async with conn.cursor() as cur:
        await cur.execute("UPDATE members SET name = %s WHERE id = %s", (member.name, member_id))
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM members WHERE id = %s", (member_id,))
        return await cur.fetchone()

@app.delete("/members/{member_id}")
async def delete_member(member_id: int, conn=Depends(get_db)):
    async with conn.cursor() as cur:
        await cur.execute(
            "SELECT COUNT(*) as cnt FROM expenses WHERE payer_id = %s OR JSON_CONTAINS(split_ids, %s)",
            (member_id, str(member_id))
        )
        row = await cur.fetchone()
        if row[0] > 0:
            raise HTTPException(400, "Nie można usunąć — uczestnik ma przypisane wydatki")
        await cur.execute("DELETE FROM gear_items WHERE member_id = %s", (member_id,))
        await cur.execute("UPDATE shared_gear SET taken_by = NULL WHERE taken_by = %s", (member_id,))
        await cur.execute("DELETE FROM members WHERE id = %s", (member_id,))
    return {"ok": True}

# ─── EXPENSES ─────────────────────────────────────────────────────────────────

@app.get("/expenses")
async def get_expenses(conn=Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM expenses ORDER BY id DESC")
        rows = await cur.fetchall()
        for r in rows:
            r["split_ids"] = json.loads(r["split_ids"])
        return rows

@app.post("/expenses", status_code=201)
async def add_expense(expense: Expense, conn=Depends(get_db)):
    from datetime import date
    today = date.today().strftime("%d.%m.%Y")
    async with conn.cursor() as cur:
        await cur.execute(
            "INSERT INTO expenses (title, amount, original_amount, currency, payer_id, split_ids, date) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            (expense.title, expense.amount, expense.original_amount, expense.currency,
             expense.payer_id, json.dumps(expense.split_ids), today)
        )
        exp_id = cur.lastrowid
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM expenses WHERE id = %s", (exp_id,))
        row = await cur.fetchone()
        row["split_ids"] = json.loads(row["split_ids"])
        return row

@app.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: int, conn=Depends(get_db)):
    async with conn.cursor() as cur:
        await cur.execute("DELETE FROM expenses WHERE id = %s", (expense_id,))
    return {"ok": True}

# ─── GEAR ITEMS ───────────────────────────────────────────────────────────────

@app.get("/gear")
async def get_gear(conn=Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM gear_items ORDER BY id")
        return await cur.fetchall()

@app.post("/gear", status_code=201)
async def add_gear(item: GearItem, conn=Depends(get_db)):
    async with conn.cursor() as cur:
        await cur.execute(
            "INSERT INTO gear_items (member_id, category, name, packed) VALUES (%s,%s,%s,%s)",
            (item.member_id, item.category, item.name, item.packed)
        )
        item_id = cur.lastrowid
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM gear_items WHERE id = %s", (item_id,))
        return await cur.fetchone()

@app.put("/gear/{item_id}/packed")
async def toggle_gear_packed(item_id: int, body: dict, conn=Depends(get_db)):
    async with conn.cursor() as cur:
        await cur.execute("UPDATE gear_items SET packed = %s WHERE id = %s", (body["packed"], item_id))
    return {"ok": True}

@app.delete("/gear/{item_id}")
async def delete_gear(item_id: int, conn=Depends(get_db)):
    async with conn.cursor() as cur:
        await cur.execute("DELETE FROM gear_items WHERE id = %s", (item_id,))
    return {"ok": True}

# ─── SHARED GEAR ──────────────────────────────────────────────────────────────

@app.get("/shared-gear")
async def get_shared_gear(conn=Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM shared_gear ORDER BY id")
        return await cur.fetchall()

@app.post("/shared-gear", status_code=201)
async def add_shared_gear(item: SharedGearItem, conn=Depends(get_db)):
    async with conn.cursor() as cur:
        await cur.execute(
            "INSERT INTO shared_gear (name, taken_by, packed) VALUES (%s,%s,%s)",
            (item.name, item.taken_by, item.packed)
        )
        item_id = cur.lastrowid
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM shared_gear WHERE id = %s", (item_id,))
        return await cur.fetchone()

@app.patch("/shared-gear/{item_id}")
async def update_shared_gear(item_id: int, body: SharedGearUpdate, conn=Depends(get_db)):
    async with conn.cursor() as cur:
        if body.taken_by is not None or body.taken_by == 0:
            await cur.execute("UPDATE shared_gear SET taken_by = %s WHERE id = %s", (body.taken_by or None, item_id))
        if body.packed is not None:
            await cur.execute("UPDATE shared_gear SET packed = %s WHERE id = %s", (body.packed, item_id))
    return {"ok": True}

@app.delete("/shared-gear/{item_id}")
async def delete_shared_gear(item_id: int, conn=Depends(get_db)):
    async with conn.cursor() as cur:
        await cur.execute("DELETE FROM shared_gear WHERE id = %s", (item_id,))
    return {"ok": True}

@app.get("/health")
async def health():
    return {"status": "ok"}
