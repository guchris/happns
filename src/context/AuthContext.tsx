"use client"

// React Imports
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"

// App Imports
import { User as AppUser } from "@/components/types"

// Firebase Imports
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { User as FirebaseUser, setPersistence, browserLocalPersistence } from "firebase/auth"


interface AuthContextType {
    user: FirebaseUser | null | undefined;
    loading: boolean;
    userData: AppUser | null;
    isAuthenticated: boolean;
    setIsAuthenticated: (status: boolean) => void;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, loading] = useAuthState(auth);
    const [userData, setUserData] = useState<AppUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Set persistence on mount
        setPersistence(auth, browserLocalPersistence)
            .catch(error => {
                console.error("Error setting auth persistence:", error);
            });
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
          if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
    
            if (userDoc.exists()) {
              setUserData(userDoc.data() as AppUser);
            }
          } else {
            setUserData(null);
        }
        };
    
        if (user) {
          fetchUserData();
          setIsAuthenticated(true);
        } else {
          setUserData(null);
          setIsAuthenticated(false);
        }
      }, [user]);

    return (
      <AuthContext.Provider value={{ user, loading, userData, isAuthenticated, setIsAuthenticated }}>
          {children}
      </AuthContext.Provider>
    )
}

// Custom hook to use the AuthContext
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};