"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import axios from "axios";
import { UserContext } from "./authContext";

axios.defaults.withCredentials = true;

const ProfileContext = createContext();

const PContext = ({ children }) => {
    const { user } = useContext(UserContext);
    //starting state for profile
    const [profile, setProfile] = useState({
        name: null,
    });

    useEffect(() => {
        console.log("Im right here!");
        const initializeAuth = async () => {
        try {
            console.log("checking profile context for:", user.id);
            const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/get_profile/${user.id}`, {
            headers: {"Content-Type": "application/json"},
            withCredentials: true
            });
            console.log("User response:", response.data);
            setProfile({
                name: response.data.name,
                "bio": response.data.bio,
                "age": response.data.age,
                "image": response.data.image,
                "resume": response.data.resume,
                "facebook": response.data.facebook,
                "linkedin": response.data.linkedin,
                "instagram": response.data.instagram,
            });
        } catch (error) {
            setProfile({name: null});
            console.log("didnt find profile for:", user.id);
        }
        };

        initializeAuth();
    }, []);

    return <ProfileContext.Provider value={{ profile, setProfile}}>{children}</ProfileContext.Provider>;
};

export default PContext;
export { ProfileContext };
