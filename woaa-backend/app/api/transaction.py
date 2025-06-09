"""
Transaction API routes for creating, retrieving, updating, and deleting transactions.

Endpoints:
- POST /transactions
- GET /transactions/{user_id}
- GET /transactions/item/{id}
- PUT /transactions/item/{id}
- DELETE /transactions/item/{id}
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.database import get_db
from app.schemas.transaction import TransactionCreate, TransactionOut, TransactionUpdate
from app.services import transaction as service

router = APIRouter(prefix="/transactions", tags=["trans"])


@router.post("/", response_model=TransactionOut)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    """
    Create a new transaction.

    Args:
        payload: TransactionCreate schema.
        db: DB session.

    Returns:
        The created transaction.
    """
    
    #TODO: loging
    
    return service.create_transaction(db, payload)


@router.get("/{user_id}", response_model=List[TransactionOut])
def get_user_transactions(user_id: UUID, db: Session = Depends(get_db)):
    """
    Get all transactions for a user.

    Args:
        user_id: UUID of the user.
        db: DB session.

    Returns:
        List of TransactionOut.
    """
    
    #TODO: loging
    
    return service.get_user_transactions(db, user_id)


@router.get("/item/{tx_id}", response_model=TransactionOut)
def get_transaction(tx_id: UUID, db: Session = Depends(get_db)):
    """
    Retrieve a transaction by its ID.

    Args:
        tx_id: UUID of transaction.

    Returns:
        The transaction.
    """
    
    #TODO: loging
    
    tx = service.get_transaction_by_id(db, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@router.put("/item/{tx_id}", response_model=TransactionOut)
def update_transaction(tx_id: UUID, updates: TransactionUpdate, db: Session = Depends(get_db)):
    """
    Update a transaction (e.g., notes).

    Args:
        tx_id: UUID of the transaction.
        updates: Fields to update.

    Returns:
        Updated transaction.
    """
    
    #TODO: loging
    #TODO: testing
    
    return service.update_transaction(db, tx_id, updates)


@router.delete("/item/{tx_id}")
def delete_transaction(tx_id: UUID, db: Session = Depends(get_db)):
    """
    Delete a transaction by ID.

    Args:
        tx_id: UUID of the transaction.
    """
    
    #TODO: loging
    #TODO: testing
    
    service.delete_transaction(db, tx_id)
    return {"detail": "Transaction deleted"}
