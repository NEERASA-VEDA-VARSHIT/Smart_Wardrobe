import { useState, useEffect } from "react";
import { authAPI } from "../api";

function UseCurrentUser() {
    const [user, setUser] = useState(null);
    useEffect(() => {
        const fetchUser = async () => {
            const response = await authAPI.getCurrentUser();
            const user = response.data;
            setUser(user);
        };
        fetchUser();
    }, []);
    return user;
};

export default UseCurrentUser;