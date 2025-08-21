// src/services/transactionService.js
import { db } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp } from "firebase/firestore";

export const addTransaction = async (userId, amount, typeId, categoryId, description) => {
  return await addDoc(collection(db, "transactions"), {
    user_id: userId,
    amount: parseFloat(amount),
    type_id: typeId,
    category_id: categoryId,  // This should be the category
    description: description,  // This should be the description
    transaction_date: Timestamp.now()
  });
};

export const editTransaction = async (id, updatedData) => {
  return await updateDoc(doc(db, "transactions", id), updatedData);
};

export const deleteTransaction = async (id) => {
  return await deleteDoc(doc(db, "transactions", id));
};
