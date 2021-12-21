export type User = {
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  isAdmin?: boolean;
};
