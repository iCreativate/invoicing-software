export type EmployeeStatus = 'invited' | 'active' | 'inactive';

export type EmployeeListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: EmployeeStatus;
  invitedAt: string | null;
  permission: string;
};

