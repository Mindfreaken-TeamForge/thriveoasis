import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { BatchOperation } from './firestore';

export function createInitialOasisOperations(
  oasisId: string,
  oasisData: any,
  userId: string,
  userName: string
): BatchOperation[] {
  const operations: BatchOperation[] = [];
  const oasisRef = doc(collection(db, 'oasis'), oasisId);

  // Main oasis document
  operations.push({
    type: 'set',
    ref: oasisRef,
    data: {
      ...oasisData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active',
    },
  });

  // Default roles
  const roles = [
    {
      id: 'member',
      name: 'Member',
      permissions: ['view_content', 'create_posts'],
    },
    {
      id: 'moderator',
      name: 'Moderator',
      permissions: ['view_content', 'create_posts', 'moderate_content'],
    },
    {
      id: 'admin',
      name: 'Administrator',
      permissions: ['administrator'],
    },
  ];

  roles.forEach(role => {
    operations.push({
      type: 'set',
      ref: doc(collection(oasisRef, 'roles'), role.id),
      data: {
        ...role,
        isDefault: true,
        createdAt: serverTimestamp(),
      },
    });
  });

  // Owner member document
  operations.push({
    type: 'set',
    ref: doc(collection(oasisRef, 'members'), userId),
    data: {
      userId,
      userName,
      role: 'owner',
      permissions: ['administrator'],
      joinedAt: serverTimestamp(),
      status: 'active',
    },
  });

  // Initialize subcollections with placeholders
  ['messages', 'polls', 'docs'].forEach(subcollection => {
    operations.push({
      type: 'set',
      ref: doc(collection(oasisRef, subcollection), 'placeholder'),
      data: {
        createdAt: serverTimestamp(),
        placeholder: true,
      },
    });
  });

  // User references
  operations.push({
    type: 'set',
    ref: doc(db, 'users', userId, 'createdOasis', oasisId),
    data: {
      oasisId,
      name: oasisData.name,
      type: oasisData.type,
      createdAt: serverTimestamp(),
      status: 'active',
    },
  });

  operations.push({
    type: 'set',
    ref: doc(db, 'users', userId, 'joinedOasis', oasisId),
    data: {
      oasisId,
      name: oasisData.name,
      type: oasisData.type,
      joinedAt: serverTimestamp(),
      role: 'owner',
      status: 'active',
    },
  });

  return operations;
}