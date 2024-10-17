"use client";
import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  CalendarIcon
} from "lucide-react";
import {
  ref,
  query,
  orderByChild,
  onValue,
  update,
  remove,
  limitToFirst,
  startAfter
} from "firebase/database";
import { db } from "../../../firebaseConfig.js";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval
} from "date-fns";
import { AttendanceChart } from "@/components/charts/AttendanceChart";

interface StudentTableProps {
  courseId: string;
}

export type Student = {
  id: string;
  name: string;
  department: string;
  attendance: { [date: string]: { status: number; time: string | null } };
};

export const StudentTable: React.FC<StudentTableProps> = ({ courseId }) => {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(
    new Date()
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(
    null
  );
  const [attendanceData, setAttendanceData] = React.useState([]);
  const [pageIndex, setPageIndex] = React.useState(0);
  const itemsPerPage = 10;

  React.useEffect(() => {
    if (!courseId || !selectedDate) return;

    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const formattedDate = format(selectedDate, "yyyy-MM-dd");

        const studentsQuery = query(
          ref(db, "users"),
          orderByChild(`attendance/${courseId}/${formattedDate}`)
        );

        onValue(
          studentsQuery,
          (snapshot) => {
            if (snapshot.exists()) {
              const usersData = snapshot.val();
              const studentList: Student[] = [];

              for (const userId in usersData) {
                const user = usersData[userId];
                if (
                  user.attendance &&
                  user.attendance[courseId] &&
                  user.attendance[courseId][formattedDate]
                ) {
                  const classAttendance =
                    user.attendance[courseId][formattedDate];
                  studentList.push({
                    id: userId,
                    name: user.name,
                    department: user.department,
                    attendance: { [formattedDate]: classAttendance }
                  });
                }
              }

              setStudents(studentList);
              setLoading(false);
            } else {
              setStudents([]);
              setLoading(false);
            }
          },
          (error) => {
            setError("Error fetching student data.");
            console.error("Error fetching student data:", error);
            setLoading(false);
          }
        );
      } catch (error) {
        setError("Error fetching student data.");
        console.error("Error fetching student data:", error);
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [courseId, selectedDate, pageIndex]);

  const handleRowClick = (student: Student) => {
    setSelectedStudent(student);

    const studentRef = ref(db, `users/${student.id}/attendance/${courseId}`);
    onValue(studentRef, (snapshot) => {
      if (snapshot.exists()) {
        const attendanceData = snapshot.val();
        const attendanceArray = Object.keys(attendanceData).map((date) => ({
          date: parseISO(date),
          status: attendanceData[date].status
        }));

        const startDate = startOfMonth(attendanceArray[0].date);
        const endDate = endOfMonth(
          attendanceArray[attendanceArray.length - 1].date
        );

        const monthlyAttendance = eachMonthOfInterval({
          start: startDate,
          end: endDate
        }).map((month) => {
          const monthAttendance = attendanceArray.filter(
            (entry) =>
              entry.date >= startOfMonth(month) &&
              entry.date <= endOfMonth(month)
          );

          const present = monthAttendance.filter(
            (entry) => entry.status === 1
          ).length;
          const absent = monthAttendance.filter(
            (entry) => entry.status === 0
          ).length;

          return {
            month: format(month, "MMMM"),
            present,
            absent
          };
        });

        setAttendanceData(monthlyAttendance);
      }
    });
  };

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("name")}</div>
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => <div>{row.getValue("department") || "Unknown"}</div>
    },
    {
      accessorKey: "attendance",
      header: "Time",
      cell: ({ row }) => {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const attendanceEntry = row.original.attendance[formattedDate || ""];
        return <div>{attendanceEntry?.time || "N/A"}</div>;
      }
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const attendanceEntry = row.original.attendance[formattedDate || ""];
        const status = attendanceEntry?.status === 1 ? "Present" : "Absent";
        const statusColor =
          attendanceEntry?.status === 1 ? "bg-blue-500" : "bg-red-500";

        return (
          <div className=" ml-3 flex items-center">
            <span
              className={` h-2 w-2 rounded-full ${statusColor} mr-2`}
            ></span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-fit px-2 py-3">
                  <span className="sr-only">Change status</span>
                  {status}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    updateStatus(row.original.id, formattedDate, 1)
                  }
                >
                  Present
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    updateStatus(row.original.id, formattedDate, 0)
                  }
                >
                  Absent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        return <div>{formattedDate}</div>;
      }
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const student = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(student.id)}
              >
                Copy student ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => deleteStudent(student.id)}>
                Delete entry
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  const updateStatus = (studentId: string, date: string, status: number) => {
    const updates: any = {};
    updates[`/users/${studentId}/attendance/${courseId}/${date}/status`] =
      status;
    update(ref(db), updates);
  };

  const deleteStudent = (studentId: string) => {
    remove(ref(db, `/users/${studentId}`));
  };

  const table = useReactTable({
    data: students,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize: itemsPerPage
      }
    }
  });

  return (
    <div className="w-full flex flex-col lg:flex-row">
      {selectedStudent && (
        <div className="lg:w-1/3 p-4">
          <AttendanceChart
            studentName={selectedStudent.name}
            attendanceData={attendanceData}
          />
        </div>
      )}
      <div className={`p-4 ${selectedStudent ? "lg:w-2/3" : "w-full"}`}>
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter by name..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="ml-4">
                {selectedDate
                  ? format(selectedDate, "yyyy-MM-dd")
                  : "Select Date"}
                <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton width={100} />
                    </TableCell>
                    <TableCell>
                      <Skeleton width={100} />
                    </TableCell>
                    <TableCell>
                      <Skeleton width={100} />
                    </TableCell>
                    <TableCell>
                      <Skeleton width={20} height={20} circle />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => handleRowClick(row.original)}
                    className="cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-between items-center py-4">
          <Button
            variant="outline"
            onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
            disabled={pageIndex === 0}
          >
            Previous
          </Button>
          <span>
            Page {pageIndex + 1} of {Math.ceil(students.length / itemsPerPage)}
          </span>
          <Button
            variant="outline"
            onClick={() => setPageIndex((prev) => prev + 1)}
            disabled={students.length < itemsPerPage}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
