// In-memory storage for user TOTP secrets
// In production, this should be stored in a database

interface UserTOTPData {
  email: string;
  secret: string;
  createdAt: Date;
}

class TOTPStorage {
  private static instance: TOTPStorage;
  private users: Map<string, UserTOTPData>;

  private constructor() {
    this.users = new Map();
    // Add default admin
    this.users.set("sanjithrozario@gmail.com", {
      email: "sanjithrozario@gmail.com",
      secret: "JBSWY3DPEHPK3PXP",
      createdAt: new Date(),
    });
  }

  public static getInstance(): TOTPStorage {
    if (!TOTPStorage.instance) {
      TOTPStorage.instance = new TOTPStorage();
    }
    return TOTPStorage.instance;
  }

  public addUser(email: string, secret: string): void {
    this.users.set(email.toLowerCase(), {
      email: email.toLowerCase(),
      secret,
      createdAt: new Date(),
    });
  }

  public getUser(email: string): UserTOTPData | undefined {
    return this.users.get(email.toLowerCase());
  }

  public getAllUsers(): UserTOTPData[] {
    return Array.from(this.users.values());
  }

  public removeUser(email: string): boolean {
    return this.users.delete(email.toLowerCase());
  }
}

export const totpStorage = TOTPStorage.getInstance();
