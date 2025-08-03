import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
} from "react";
import axios from "axios";

interface LetterFormContextType {
  department: string;
  setDepartment: (dept: string) => void;
  recipient: string;
  setRecipient: (to: string) => void;
  reset: () => void;
  users: any[];
  departments: any[];
  loadingUsers: boolean;
  loadingDepartments: boolean;
  fetchUsers: () => Promise<void>;
  fetchDepartments: () => Promise<void>;
}

const LetterFormContext = createContext<LetterFormContextType | undefined>(
  undefined
);

export const LetterFormProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [department, setDepartment] = useState("");
  const [recipient, setRecipient] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const usersFetched = useRef(false);
  const departmentsFetched = useRef(false);

  const reset = () => {
    setDepartment("");
    setRecipient("");
  };

  const fetchUsers = async () => {
    if (usersFetched.current) return;
    setLoadingUsers(true);
    try {
      const res = await axios.get("http://localhost:5000/api/users");
      setUsers(res.data);
      usersFetched.current = true;
    } catch (e) {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchDepartments = async () => {
    if (departmentsFetched.current) return;
    setLoadingDepartments(true);
    try {
      // If you have a departments API, use it here. Otherwise, leave as [] or static.
      // const res = await axios.get("http://localhost:5000/api/departments");
      // setDepartments(res.data);
      setDepartments([]); // Placeholder: update if you have a departments API
      departmentsFetched.current = true;
    } catch (e) {
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  return (
    <LetterFormContext.Provider
      value={{
        department,
        setDepartment,
        recipient,
        setRecipient,
        reset,
        users,
        departments,
        loadingUsers,
        loadingDepartments,
        fetchUsers,
        fetchDepartments,
      }}
    >
      {children}
    </LetterFormContext.Provider>
  );
};

export const useLetterForm = () => {
  const ctx = useContext(LetterFormContext);
  if (!ctx)
    throw new Error("useLetterForm must be used within a LetterFormProvider");
  return ctx;
};
