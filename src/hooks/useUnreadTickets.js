import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Custom hook to track unread ticket replies for the current user.
 * Eliminates duplication between Layout.jsx and Profile.jsx.
 * @param {object|null} currentUser - Firebase auth user object
 * @returns {{ hasUnreadReplies: boolean }}
 */
const useUnreadTickets = (currentUser) => {
  const [hasUnreadReplies, setHasUnreadReplies] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'support_tickets'),
      where('userId', '==', currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      let unread = false;
      snap.forEach((d) => {
        const data = d.data();
        if (data.status === 'replied' && !data.userSeen) {
          unread = true;
        }
      });
      setHasUnreadReplies(unread);
    });

    return () => unsub();
  }, [currentUser]);

  return { hasUnreadReplies };
};

export default useUnreadTickets;
