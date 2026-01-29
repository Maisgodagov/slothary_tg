export const resolveUserId = (profileId?: string | null) => {
  if (profileId) return profileId;
  try {
    const fromStorage = localStorage.getItem("guestUserId");
    if (fromStorage) return fromStorage;
    const newId = crypto.randomUUID();
    localStorage.setItem("guestUserId", newId);
    return newId;
  } catch {
    return `guest-${Math.random().toString(36).slice(2, 10)}`;
  }
};
