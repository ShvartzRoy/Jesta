"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import axios from "axios";
import { UserContext } from "./authContext";

axios.defaults.withCredentials = true;

const ProfileContext = createContext();

const PContext = ({ children }) => {
    const { user } = useContext(UserContext); // Access UserContext
    const [profile, setProfile] = useState({
        name: undefined,
    });
    const [loading, setLoading] = useState(true); // Track profile loading state
    useEffect(() => {
        const initializeAuth = async () => {
            if (user?.id) { // Only fetch if user.id exists
                try {
                    console.log("Fetching profile for:", user.id);
                    const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/get_profile/${user.id}`, {
                        headers: { "Content-Type": "application/json" },
                        withCredentials: true,
                    });
                    console.log("Profile data:", response.data);

                    setProfile({
                        name: response.data.name,
                        bio: response.data.bio,
                        age: response.data.age,
                        image: response.data.image,
                        resume: response.data.resume,
                        facebook: response.data.facebook,
                        linkedin: response.data.linkedin,
                        instagram: response.data.instagram,
                    });
                } catch (error) {
                    setProfile({ name: null }); // Fallback for users without profiles
                }
            }
        };
        setLoading(false); // Done loading
        initializeAuth();
    }, [user?.id]); // Re-run whenever `user.id` changes

    return (
        <ProfileContext.Provider value={{ profile, loading, setProfile }}>
            {children}
        </ProfileContext.Provider>
    );
};

export default PContext;
export { ProfileContext };
