export type Credentials = {
  email: string;
  password: string;
};

type ClassSchedule = {
  [day: string]: {
    start: string;
    end: string;
  };
};

type Teacher = {
  id: string;
  name: string;
};

export type ClassItem = {
  name: string;
  departmentId: string;
  teacher: Teacher;
  semester: number;
  schedule: ClassSchedule;
};
