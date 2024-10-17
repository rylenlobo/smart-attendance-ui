import React, { useEffect, useState } from "react";
import { ref, update, get, getDatabase, onValue } from "firebase/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { db } from "../../firebaseConfig.js";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  courseId
}) => {
  const [collectAttendance, setCollectAttendance] = useState(false);

  useEffect(() => {
    const collectAttendanceRef = ref(db, "collectAttendance");

    // Listen for live changes to collectAttendance
    onValue(collectAttendanceRef, (snapshot) => {
      if (snapshot.exists()) {
        setCollectAttendance(snapshot.val());
      }
    });
  }, []);

  const handleStartClick = async () => {
    const today = format(new Date(), "yyyy-MM-dd");

    // Update collectAttendance and attendanceCourseId
    const updates: any = {};
    updates[`/collectAttendance`] = true;
    updates[`/attendanceCourseId`] = courseId;

    // Set faculty to false for all users and add today's date in attendance/courseId
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      for (const userId in usersData) {
        if (usersData[userId].faculty === false) {
          updates[`/users/${userId}/attendance/${courseId}/${today}`] = {
            status: 0,
            time: null
          };
        }
      }
    }

    // Apply updates to the database
    await update(ref(db), updates);

    // Close the modal
    onClose();
  };

  const handleStopClick = async () => {
    const db = getDatabase();

    // Update collectAttendance and attendanceCourseId
    const updates: any = {};
    updates[`/collectAttendance`] = false;
    updates[`/attendanceCourseId`] = "";

    // Apply updates to the database
    await update(ref(db), updates);

    // Close the modal
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collect Attendance</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <div className="flex items-center justify-center p-4">
          {collectAttendance ? (
            <Button onClick={handleStopClick}>Stop</Button>
          ) : (
            <Button onClick={handleStartClick}>Start</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
