import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Your Firebase configuration will go here
// Replace this with your actual Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCmbb8zuxjS0_urUQGI636oILFDAv3e-hs",
  authDomain: "marketingdashboard-cdab5.firebaseapp.com",
  projectId: "marketingdashboard-cdab5",
  storageBucket: "marketingdashboard-cdab5.firebasestorage.app",
  messagingSenderId: "826133771740",
  appId: "1:826133771740:web:b3c64516fc65271b27cb19"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Create Auth Context
const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        user,
        logout: () => signOut(auth)
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Create a hook to use the auth context
export const useAuth = () => {
    return useContext(AuthContext);
};

export default app; 