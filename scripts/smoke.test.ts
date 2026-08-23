// Standalone smoke test for the local, datenschutzkonforme SwissBoard data layer.
// Simuliert einen Browser (localStorage) und validiert die Firestore-kompatible
// Abstraktion (addDoc/setDoc/updateDoc/deleteDoc/useCollection-Logik).

// 1) Provide a browser-like environment BEFORE importing local modules.
const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
} as any;

const assert = (cond, msg) => {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exitCode = 1;
  } else {
    console.log('PASS:', msg);
  }
};

async function main() {
  // Import the shim modules (paths resolve via tsconfig @/ alias in tsx).
  const fire = await import('../src/firebase/local/firestore.ts');
  const dbmod = await import('../src/firebase/local/db.ts');
  const authmod = await import('../src/firebase/local/auth.ts');

  const { localFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } = fire;
  const { loadDb, getPath } = dbmod;

  const uid = 'demo-lokal';
  const user = authmod.ensureLocalUser();
  assert(user && user.uid === 'demo-lokal', 'Demo-Benutzer wird lokal erzeugt');

  // 2) Create a wall
  const wallsCol = collection(localFirestore, 'users', uid, 'walls');
  const wallRef = doc(wallsCol);
  await setDoc(wallRef, {
    ownerId: uid,
    title: 'Test-Wand',
    createdAt: serverTimestamp(),
    privacySetting: 'private',
    members: { [uid]: 'editor' },
  });
  const wallId = wallRef.id;
  assert(!!wallId, 'setDoc erzeugt Wand mit id ' + wallId);

  // 3) Read back via useCollection-style read
  const db = loadDb();
  const wallsMap = getPath(db, `users/${uid}/walls`);
  assert(wallsMap && wallsMap[wallId], 'Wand ist in localStorage gespeichert');

  // 4) Add posts to the wall's content subcollection
  const contentCol = collection(localFirestore, 'users', uid, 'walls', wallId, 'content');
  const postRef = await addDoc(contentCol, {
    wallId,
    authorId: uid,
    type: 'text',
    data: 'Hallo ECAP, dies ist ein Test-Beitrag.',
    position: { x: 120, y: 80 },
    createdAt: serverTimestamp(),
  });
  assert(!!postRef.id, 'addDoc erzeugt Beitrag mit id ' + postRef.id);

  // 5) Add a second post and verify collection read returns both
  await addDoc(contentCol, {
    wallId,
    authorId: uid,
    type: 'link',
    data: 'https://example.com',
    position: { x: 300, y: 150 },
    createdAt: serverTimestamp(),
  });
  const db2 = loadDb();
  const contentMap = getPath(db2, `users/${uid}/walls/${wallId}/content`);
  const nPosts = Object.keys(contentMap || {}).length;
  assert(nPosts === 2, `Zwei Beiträge gespeichert (gefunden: ${nPosts})`);

  // 6) Update a post (rename/position via updateDoc)
  await updateDoc(doc(contentCol, postRef.id), { data: 'Aktualisierter Inhalt' });
  const db3 = loadDb();
  const post = getPath(db3, `users/${uid}/walls/${wallId}/content/${postRef.id}`);
  assert(post.data === 'Aktualisierter Inhalt', 'updateDoc aktualisiert den Beitrag');

  // 7) Delete a post
  await deleteDoc(doc(contentCol, postRef.id));
  const db4 = loadDb();
  const contentMap4 = getPath(db4, `users/${uid}/walls/${wallId}/content`);
  assert(!contentMap4 || !contentMap4[postRef.id], 'deleteDoc entfernt den Beitrag');

  // 8) Delete the wall
  await deleteDoc(doc(localFirestore, 'users', uid, 'walls', wallId));
  const db5 = loadDb();
  const wallsMap5 = getPath(db5, `users/${uid}/walls`);
  assert(!wallsMap5 || !wallsMap5[wallId], 'deleteDoc entfernt die Wand');

  console.log('\nAlle lokalen Datenoperationen funktionieren wie erwartet.');
  console.log('localStorage-Key:', dbmod.DB_KEY_NAME);
}

main().catch((e) => {
  console.error('Test crashed:', e);
  process.exitCode = 1;
});
