import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import TransactionItem from './transactionItem';
import { deleteTransaction } from '../services/transactionService';

const TransactionList = ({ userId, onEdit }) => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), where('user_id', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleDelete = async (id) => {
    await deleteTransaction(id);
  };

  return (
    <div className="transaction-list">
      <h2>Transactions</h2>
      {transactions.map(tx => (
        <TransactionItem
          key={tx.id}
          transaction={tx}
          onEdit={onEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};

export default TransactionList;
