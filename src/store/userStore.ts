import { create } from "zustand";

interface UserInfo {
  id: string;
  nfcId?: string;
  name: string;
  email: string;
  department: string;
  faculty?: boolean;
  enrolledClasses: string[];
}

interface UserInfoState {
  userInfo: UserInfo | null;
  setUserInfo: (userInfo: UserInfo) => void;
  clearUserInfo: () => void;
}

export const useUserInfoStore = create<UserInfoState>((set) => ({
  userInfo: null,
  setUserInfo: (userInfo) => {
    set({ userInfo });
  },
  clearUserInfo: () => {
    set({ userInfo: null });
  }
}));
