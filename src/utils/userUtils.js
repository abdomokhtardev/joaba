import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Initializes a user document in Firestore if it doesn't exist.
 * Fetches the free trial duration from settings/general (defaults to 7 if missing).
 * 
 * @param {Object} user - The Firebase Auth user object
 * @param {string} [refCode] - Optional referral code from URL
 */
export const initUserDocument = async (user, refCode = '') => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    try {
      // 1. Fetch free trial duration
      const settingsRef = doc(db, 'settings', 'general');
      const settingsSnap = await getDoc(settingsRef);
      
      let freeTrialDays = 7;
      if (settingsSnap.exists() && typeof settingsSnap.data().freeTrialDays === 'number') {
        freeTrialDays = settingsSnap.data().freeTrialDays;
      }

      // 2. Calculate subscription end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + freeTrialDays);

      // 3. Create user doc with strictly required fields matching security rules
      await setDoc(userRef, {
        email: user.email,
        role: 'user',
        status: 'active',
        ...(refCode ? { referredBy: refCode } : {}),
        createdAt: serverTimestamp()
      });

      // 4. Update initial subscription trial matching update rules
      await updateDoc(userRef, {
        subscriptionEndDate: endDate.toISOString(),
        hasSubscribedBefore: true
      });
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  }
};
