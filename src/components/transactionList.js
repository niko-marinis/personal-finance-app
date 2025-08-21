import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { deleteTransaction } from '../services/transactionService';

const TransactionList = ({ userId, refreshTrigger }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    setIsLoading(true);
    const q = query(
      collection(db, 'transactions'), 
      where('user_id', '==', userId),
      orderBy('transaction_date', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        transaction_date: doc.data().transaction_date?.toDate() 
      }));
      setTransactions(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, refreshTrigger]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction(id);
      } catch (error) {
        alert("Error deleting transaction: " + error.message);
      }
    }
  };

  if (isLoading) {
    return <div className="transaction-list-container">Loading transactions...</div>;
  }

  return (
    <div className="transaction-list-container">
      <h3>Recent Transactions</h3>
      {transactions.length === 0 ? (
        <p>No transactions yet. Add your first transaction above!</p>
      ) : (
        <div className="transactions">
          {transactions.map(tx => (
            <div key={tx.id} className={`transaction-item ${tx.category_id}`}>
              <div className="transaction-info">
                <div className="transaction-desc">{tx.description}</div>
                <div className="transaction-date">
                  {tx.transaction_date?.toLocaleDateString()}
                </div>
              </div>
              <div className="transaction-amount">
                {tx.category_id === 'income' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
              </div>
              <button 
                className="delete-btn"
                onClick={() => handleDelete(tx.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionList;