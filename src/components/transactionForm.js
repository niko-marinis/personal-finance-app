import React, { useState } from 'react';
import { addTransaction, editTransaction } from '../services/transactionService';

const TransactionForm = ({ userId, existingTransaction, onSave }) => {
  const [amount, setAmount] = useState(existingTransaction?.amount || '');
  const [description, setDescription] = useState(existingTransaction?.description || '');
  const [categoryId, setCategoryId] = useState(existingTransaction?.category_id || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { amount, description, category_id: categoryId };

    if (existingTransaction) {
      await editTransaction(existingTransaction.id, data);
    } else {
      await addTransaction(userId, amount, categoryId, description);
    }

    onSave(); // callback to refresh list or close form
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" />
      <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
      <input value={categoryId} onChange={e => setCategoryId(e.target.value)} placeholder="Category ID" />
      <button type="submit">{existingTransaction ? 'Update' : 'Add'} Transaction</button>
    </form>
  );
};

export default TransactionForm;
