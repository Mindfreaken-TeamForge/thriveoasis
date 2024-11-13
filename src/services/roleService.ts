import { db } from '@/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { Role, RoleType, DEFAULT_PERMISSIONS } from '@/types/role';

export const roleService = {
  async createRole(oasisId: string, role: Omit<Role, 'id' | 'createdAt'>): Promise<Role> {
    const rolesRef = collection(db, 'oasis', oasisId, 'roles');
    const roleDoc = doc(rolesRef);
    
    const newRole: Role = {
      ...role,
      id: roleDoc.id,
      createdAt: new Date(),
      permissions: role.permissions || DEFAULT_PERMISSIONS[role.type as RoleType],
    };

    await setDoc(roleDoc, {
      ...newRole,
      createdAt: serverTimestamp(),
    });

    return newRole;
  },

  async updateRole(oasisId: string, roleId: string, updates: Partial<Role>): Promise<void> {
    const roleRef = doc(db, 'oasis', oasisId, 'roles', roleId);
    await updateDoc(roleRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteRole(oasisId: string, roleId: string): Promise<void> {
    const roleRef = doc(db, 'oasis', oasisId, 'roles', roleId);
    await deleteDoc(roleRef);
  },

  async getRole(oasisId: string, roleId: string): Promise<Role | null> {
    const roleRef = doc(db, 'oasis', oasisId, 'roles', roleId);
    const roleDoc = await getDoc(roleRef);
    
    if (!roleDoc.exists()) return null;
    
    return {
      id: roleDoc.id,
      ...roleDoc.data(),
    } as Role;
  },

  async getRoles(oasisId: string): Promise<Role[]> {
    const rolesRef = collection(db, 'oasis', oasisId, 'roles');
    const rolesSnapshot = await getDocs(rolesRef);
    
    return rolesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Role));
  },

  async getDefaultRoles(oasisId: string): Promise<Role[]> {
    const rolesRef = collection(db, 'oasis', oasisId, 'roles');
    const defaultRolesQuery = query(rolesRef, where('isDefault', '==', true));
    const rolesSnapshot = await getDocs(defaultRolesQuery);
    
    return rolesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Role));
  },

  async getUserRole(oasisId: string, userId: string): Promise<RoleType> {
    const memberRef = doc(db, 'oasis', oasisId, 'members', userId);
    const memberDoc = await getDoc(memberRef);
    
    if (!memberDoc.exists()) return 'member';
    
    return memberDoc.data().role as RoleType;
  },

  async setUserRole(oasisId: string, userId: string, role: RoleType): Promise<void> {
    const memberRef = doc(db, 'oasis', oasisId, 'members', userId);
    await updateDoc(memberRef, {
      role,
      updatedAt: serverTimestamp(),
    });
  },

  async hasPermission(oasisId: string, userId: string, permission: string): Promise<boolean> {
    const memberRef = doc(db, 'oasis', oasisId, 'members', userId);
    const memberDoc = await getDoc(memberRef);
    
    if (!memberDoc.exists()) return false;
    
    const role = memberDoc.data().role as RoleType;
    
    // Owner has all permissions
    if (role === 'owner') return true;
    
    // Check role-specific permissions
    const roleRef = doc(db, 'oasis', oasisId, 'roles', role);
    const roleDoc = await getDoc(roleRef);
    
    if (!roleDoc.exists()) return false;
    
    const permissions = roleDoc.data().permissions as string[];
    return permissions.includes(permission) || permissions.includes('administrator');
  }
};