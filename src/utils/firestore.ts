import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface BatchOperation {
  type: 'set' | 'update' | 'delete';
  ref: any;
  data?: any;
}

export async function executeBatchedOperations(operations: BatchOperation[]) {
  const batchSize = 450; // Leave some room for safety
  const batches = [];
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = writeBatch(db);
    const currentBatchOps = operations.slice(i, i + batchSize);
    
    currentBatchOps.forEach(op => {
      switch (op.type) {
        case 'set':
          batch.set(op.ref, op.data);
          break;
        case 'update':
          batch.update(op.ref, op.data);
          break;
        case 'delete':
          batch.delete(op.ref);
          break;
      }
    });
    
    batches.push(batch);
  }
  
  // Execute all batches in sequence
  for (const batch of batches) {
    await batch.commit();
  }
}