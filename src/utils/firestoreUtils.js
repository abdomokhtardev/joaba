import { writeBatch, doc } from 'firebase/firestore';

/**
 * Deletes multiple documents from a collection in batches of 400
 * to safely remain within Firestore's 500-operation per batch limit.
 *
 * @param {Object} db - Firestore database instance
 * @param {string} collectionName - Target Firestore collection
 * @param {string[]} ids - Array of document IDs to delete
 * @returns {Promise<void>}
 */
export const bulkDeleteDocs = async (db, collectionName, ids) => {
  if (!ids || !Array.isArray(ids) || ids.length === 0) return;

  const chunkSize = 400;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((id) => {
      batch.delete(doc(db, collectionName, id));
    });
    await batch.commit();
  }
};
