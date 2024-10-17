// page.tsx

"use client";

import * as React from "react";
import Link from "next/link";
import { ref, get, onValue } from "firebase/database";
import { useUserInfoStore } from "@/store/userStore";
import { db } from "../../../firebaseConfig";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

// Define the types for our data structure
type Schedule = {
  [key: string]: { start: string; end: string };
};

type Teacher = {
  id: string;
  name: string;
};

type Class = {
  id: string;
  name: string;
  departmentId: string;
  teacher: Teacher;
  semester: number;
  schedule: Schedule;
};

type Classes = {
  [key: string]: Class;
};

type User = {
  enrolledClasses: string[];
};

export default function Component() {
  const { userInfo } = useUserInfoStore();
  const [user, setUser] = React.useState<User | null>(null);
  const [enrolledClasses, setEnrolledClasses] = React.useState<Class[]>([]);
  const [classData, setClassData] = React.useState<Classes>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!userInfo?.id) return;

    const fetchUserData = async () => {
      try {
        const userRef = ref(db, `users/${userInfo.id}`);
        const userSnapshot = await get(userRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.val() as User;
          setUser(userData);

          // Fetch class data
          const classRef = ref(db, `classes`);
          onValue(classRef, (snapshot) => {
            if (snapshot.exists()) {
              const classes = snapshot.val() as Classes;
              setClassData(classes);

              // Filter the classes based on enrolledClasses
              const filteredClasses = userData.enrolledClasses
                .map((id) => ({ id, ...classes[id] }))
                .filter(Boolean);
              setEnrolledClasses(filteredClasses);
            }
          });
        } else {
          console.log("No user data available");
        }
      } catch (error) {
        setError("Failed to fetch user data.");
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userInfo?.id]);
  if (loading) {
    return (
      <div className="min-h-screen bg-black p-4 flex items-center justify-center">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-blue-600 h-12 w-12 animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black p-4 flex items-center justify-center">
        <div className="text-lg font-semibold text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Enrolled Classes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enrolledClasses.map((classInfo, index) => (
          <Link href={`/faculty/${classInfo.id}`} key={index}>
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle>{classInfo.name}</CardTitle>
                <CardDescription>
                  Department: {classInfo.departmentId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-2">Teacher: {classInfo.teacher.name}</p>
                <p className="mb-2">Semester: {classInfo.semester}</p>
                <div className="space-y-2">
                  {Object.entries(classInfo.schedule).map(([day, time]) => (
                    <div key={day} className="flex items-center">
                      <Badge variant="outline" className="mr-2 capitalize">
                        {day}
                      </Badge>
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-sm">
                        {time.start} - {time.end}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
