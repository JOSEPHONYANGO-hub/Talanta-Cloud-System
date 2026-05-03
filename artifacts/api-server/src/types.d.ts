declare global {
  namespace Express {
    interface Request {
      orgId: number;
      orgRole: string;
    }
  }
}

export {};
