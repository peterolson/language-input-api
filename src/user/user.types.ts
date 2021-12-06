export type User = {
  username: string;
  passwordHash: string;
  createdAt: Date;
  isAdmin?: boolean;
};
