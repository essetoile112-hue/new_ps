export interface BackendUserModel {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'operator' | 'viewer';
  createdAt: Date;
}
