export class Auth {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}
