"use client";

import * as React from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../../../firebaseConfig.js";
import { DonutChartWithText } from "@/components/charts/DonutChartWithText";
import { InteractiveBarChart } from "@/components/charts/InteractiveBarChart";
import { StudentTable } from "@/components/charts/StudentTable";
import { Button } from "@/components/ui/button";
import { AttendanceModal } from "@/components/AttendanceModal";

export default function FacultyPage({
  params
}: {
  params: { courseId: string };
}) {
  const courseId = params.courseId;

  const [attendanceData, setAttendanceData] = React.useState<
    {
      date: string;
      present: number;
      absent: number;
      late: number;
      studentName: string;
    }[]
  >([]);
  const [activeChart, setActiveChart] = React.useState<"present" | "absent">(
    "present"
  );
  const [departmentData, setDepartmentData] = React.useState<
    {
      department: string;
      count: number;
    }[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (!courseId) return;

    const usersRef = ref(db, "users");

    const fetchAttendanceData = () => {
      try {
        onValue(
          usersRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const usersData = snapshot.val();
              const attendanceData: {
                [key: string]: {
                  date: string;
                  present: number;
                  absent: number;
                  late: number;
                  studentName: string;
                };
              } = {};
              const departmentCount: { [key: string]: number } = {};

              // Iterate through all users
              for (const userId in usersData) {
                const user = usersData[userId];
                const courseKey = Array.isArray(courseId)
                  ? courseId[0]
                  : courseId;
                if (user.attendance && user.attendance[courseKey]) {
                  const classAttendance = user.attendance[courseKey];

                  // Count the number of students in each department
                  const department = user.department || "Unknown";
                  if (!departmentCount[department]) {
                    departmentCount[department] = 0;
                  }
                  departmentCount[department] += 1;

                  // Iterate through each date in the attendance data
                  for (const date in classAttendance) {
                    if (!attendanceData[date]) {
                      attendanceData[date] = {
                        date,
                        present: 0,
                        absent: 0,
                        late: 0,
                        studentName: user.name
                      };
                    }

                    if (classAttendance[date].status === 1) {
                      attendanceData[date].present += 1;
                    } else if (classAttendance[date].status === 2) {
                      attendanceData[date].late += 1;
                    } else {
                      attendanceData[date].absent += 1;
                    }
                  }
                }
              }

              // Convert attendanceData object to an array and sort by date
              const attendanceArray = Object.values(attendanceData).sort(
                (a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime()
              );
              setAttendanceData(attendanceArray);

              // Convert departmentCount object to an array
              const departmentArray = Object.keys(departmentCount).map(
                (key) => ({
                  department: key,
                  count: departmentCount[key]
                })
              );
              setDepartmentData(departmentArray);
            } else {
              console.log("No user data available");
            }
          },
          (error) => {
            setError("Error fetching attendance data.");
            console.error("Error fetching attendance data:", error);
          }
        );
      } catch (error) {
        setError("Error fetching attendance data.");
        console.error("Error fetching attendance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [courseId]);

  const totalStudents = React.useMemo(
    () => departmentData.reduce((acc, curr) => acc + curr.count, 0),
    [departmentData]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-4 flex items-center justify-center">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-blue-600 h-12 w-12 animate-spin"></div>
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

  return (
    <div className="relative flex flex-col p-3 gap-3">
      <AttendanceButton courseId={courseId} setIsModalOpen={setIsModalOpen} />
      <AttendanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseId={courseId}
      />
      <div className="flex flex-col lg:flex-row gap-3">
        <DonutChartWithText
          departmentData={departmentData}
          totalStudents={totalStudents}
        />
        <InteractiveBarChart
          attendanceData={attendanceData}
          activeChart={activeChart}
          setActiveChart={(chart) => setActiveChart(chart)}
          courseId={courseId}
        />
      </div>
      <StudentTable courseId={courseId} />
    </div>
  );
}

const AttendanceButton: React.FC<{ courseId: string; setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>> }> = ({ courseId, setIsModalOpen }) => {
  const [collectAttendance, setCollectAttendance] = React.useState(false);
  const [attendanceCourseId, setAttendanceCourseId] = React.useState("");

  React.useEffect(() => {
    const collectAttendanceRef = ref(db, "collectAttendance");
    const attendanceCourseIdRef = ref(db, "attendanceCourseId");

    onValue(collectAttendanceRef, (snapshot) => {
      if (snapshot.exists()) {
        setCollectAttendance(snapshot.val());
      }
    });

    onValue(attendanceCourseIdRef, (snapshot) => {
      if (snapshot.exists()) {
        setAttendanceCourseId(snapshot.val());
      }
    });
  }, []);

  const isCollecting = collectAttendance && attendanceCourseId === courseId;

  return (
    <Button
      className="w-44 sticky top-3  z-50 left-full"
      onClick={() => setIsModalOpen(true)}
    >
      {isCollecting ? (
        <div className="flex items-center">
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Collecting Attendance
        </div>
      ) : (
        "+ Collect Attendance"
      )}
    </Button>
  );
};
