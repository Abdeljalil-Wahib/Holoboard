"use client";

import { useState, useEffect } from 'react';
import { Avatar, AVATAR_PRESETS } from '../lib/avatars';
import { nanoid } from 'nanoid';

interface UserProfile {
  id: string;
  username: string;
  avatar: Avatar;
}

const USER_PROFILE_KEY = 'whiteboard-user-profile';

export const useUser = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_PROFILE_KEY);
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser.id) {
          parsedUser.id = nanoid(10);
          localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(parsedUser));
        }
        setUser(parsedUser);
      } else {
        setUser({ 
          id: nanoid(10),
          username: '', 
          avatar: AVATAR_PRESETS[0] 
        });
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
      setUser({ 
        id: nanoid(10),
        username: '', 
        avatar: AVATAR_PRESETS[0] 
      });
    }
    setIsLoading(false);
  }, []);

  const saveUser = (profile: UserProfile) => {
    try {
      const updatedProfile = user ? { ...user, ...profile } : profile;
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
      setUser(updatedProfile);
    } catch (error) {
      console.error("Failed to save user profile:", error);
    }
  };
  return { user, saveUser, isLoading  };
};
