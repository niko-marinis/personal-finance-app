import React from 'react';

const TransactionItem = ({ transaction, onEdit, onDelete }) => {
  return (
    <div className="transaction-item">
      <div>
        <strong>{transaction.description}</strong> — ${transaction.amount}
      </div>
      <div>
        <button onClick={() => onEdit(transaction)}>Edit</button>
        <button onClick={() => onDelete(transaction.id)}>Delete</button>
      </div>
    </div>
  );
};

export default TransactionItem;
