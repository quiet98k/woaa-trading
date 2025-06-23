"""
Service functions for business logic related to transactions.
Handles CRUD operations and interaction with the database.
"""

from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException

from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate


def create_transaction(db: Session, tx_data: TransactionCreate, user_id: UUID) -> Transaction:
    """
    Create and store a new transaction.

    Args:
        db: Database session.
        tx_data: TransactionCreate schema.
        user_id: Authenticated user's UUID.

    Returns:
        Transaction: Created transaction instance.
    """
    transaction = Transaction(**tx_data.model_dump(), user_id=user_id)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def get_transaction_by_id(db: Session, tx_id: UUID) -> Transaction | None:
    """
    Fetch a single transaction by ID.

    Args:
        db: DB session.
        tx_id: UUID of the transaction.

    Returns:
        Transaction or None.
    """
    
    #TODO: testing
    
    return db.query(Transaction).filter(Transaction.id == tx_id).first()


def get_user_transactions(db: Session, user_id: UUID) -> list[Transaction]:
    """
    Return all transactions for a given user.

    Args:
        db: DB session.
        user_id: UUID of the user.

    Returns:
        List of transactions.
    """
    
    #TODO: testing
    
    return db.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.timestamp.desc()).all()


def update_transaction(db: Session, tx_id: UUID, updates: TransactionUpdate) -> Transaction:
    """
    Update an existing transaction (notes only).

    Args:
        db: DB session.
        tx_id: Transaction UUID.
        updates: Fields to update.

    Returns:
        Updated transaction.

    Raises:
        HTTPException if transaction not found.
    """
    
    #TODO: testing
    
    tx = get_transaction_by_id(db, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(tx, key, value)

    db.commit()
    db.refresh(tx)
    return tx


def delete_transaction(db: Session, tx_id: UUID) -> None:
    """
    Delete a transaction by ID.

    Args:
        db: DB session.
        tx_id: UUID of the transaction.

    Raises:
        HTTPException if not found.
    """
    
    #TODO: testing
    
    tx = get_transaction_by_id(db, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(tx)
    db.commit()
