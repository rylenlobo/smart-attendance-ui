"use client";
import { useUserInfoStore } from "@/store/userStore";
import { ref, onValue } from "firebase/database";
import React, { useEffect, useState } from "react";
import { auth, db } from "../../../firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type AttendanceItem = {
  date: string;
  status: number;
  time: string | null;
};

type ClassAttendance = {
  [date: string]: AttendanceItem;
};

type AttendanceData = {
  [classId: string]: ClassAttendance;
};

type ClassData = {
  [classId: string]: {
    name: string;
    departmentId: string;
    teacher: { id: string; name: string };
    semester: number;
    schedule: {
      [day: string]: { start: string; end: string };
    };
  };
};

function AttendanceProgressBar({
  name,
  percentage
}: {
  name: string;
  percentage: number;
}) {
  const getColor = (percent: number) => {
    if (percent >= 75) return "bg-green-500";
    if (percent >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{name}</span>
        <span className="font-semibold">{percentage}%</span>
      </div>
      <Progress value={percentage} className={`h-2 ${getColor(percentage)}`} />
    </div>
  );
}

function CircularProgress({ percentage }: { percentage: number }) {
  const getColor = (percent: number) => {
    if (percent >= 75) return "text-green-500";
    if (percent >= 50) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="relative inline-flex">
      <svg className="w-20 h-20">
        <circle
          className="text-gray-300"
          strokeWidth="5"
          stroke="currentColor"
          fill="transparent"
          r="30"
          cx="40"
          cy="40"
        />
        <circle
          className={getColor(percentage)}
          strokeWidth="5"
          strokeDasharray={30 * 2 * Math.PI}
          strokeDashoffset={
            30 * 2 * Math.PI - (percentage / 100) * (30 * 2 * Math.PI)
          }
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="30"
          cx="40"
          cy="40"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold">
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

export default function StudentPage() {
  const { userInfo } = useUserInfoStore();
  const [user] = useAuthState(auth);
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [classData, setClassData] = useState<ClassData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("useEffect triggered");
    if (!userInfo || !userInfo.enrolledClasses || !userInfo.id) {
      console.log("Missing userInfo or enrolledClasses or userId");
      return;
    }

    const enrolledClassesIds = userInfo.enrolledClasses;
    const userId = userInfo.id;

    const fetchClassData = () => {
      const classRef = ref(db, `classes`);
      onValue(classRef, (snapshot) => {
        if (snapshot.exists()) {
          const classes = snapshot.val();
          setClassData(classes);
        }
      });
    };

    const fetchAttendanceData = () => {
      setLoading(true);
      setError(null);

      try {
        const attendanceResults: AttendanceData = {};

        for (const classId of enrolledClassesIds) {
          const attendanceRef = ref(
            db,
            `users/${userId}/attendance/${classId}`
          );
          onValue(attendanceRef, (snapshot) => {
            if (snapshot.exists()) {
              const classAttendance = snapshot.val();
              console.log(
                `Fetched attendance for class ${classId}`,
                classAttendance
              );

              const filteredAttendance = Object.keys(classAttendance)
                .filter((date) => date !== "collectAttendance")
                .reduce((acc, date) => {
                  acc[date] = {
                    date,
                    status: classAttendance[date].status,
                    time: classAttendance[date].time
                  };
                  return acc;
                }, {} as ClassAttendance);

              if (Object.keys(filteredAttendance).length > 0) {
                attendanceResults[classId] = filteredAttendance;
              }

              setAttendanceData((prevData) => ({
                ...prevData,
                [classId]: filteredAttendance
              }));
            }
          });
        }
      } catch (err) {
        setError("Failed to fetch attendance data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
    fetchAttendanceData();
  }, [userInfo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="text-lg font-semibold text-red-500">{error}</div>
      </div>
    );
  }

  const calculateAttendancePercentage = (classAttendance: ClassAttendance) => {
    const totalClasses = Object.keys(classAttendance).length;
    const attendedClasses = Object.values(classAttendance).filter(
      (attendance) => attendance.status === 1
    ).length;
    return Math.round((attendedClasses / totalClasses) * 100);
  };

  const averageAttendance =
    Object.keys(attendanceData).length > 0
      ? Object.values(attendanceData).reduce((sum, classAttendance) => {
          return sum + calculateAttendancePercentage(classAttendance);
        }, 0) / Object.keys(attendanceData).length
      : 0;

  return (
    <div className="min-h-screen bg-black p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Average Attendance</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center pt-2">
                <CircularProgress percentage={averageAttendance} />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Classes</h3>
              {Object.entries(attendanceData).map(
                ([classId, classAttendance]) => (
                  <AttendanceProgressBar
                    key={classId}
                    name={classData[classId]?.name || classId}
                    percentage={calculateAttendancePercentage(classAttendance)}
                  />
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
