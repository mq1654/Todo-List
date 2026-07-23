import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    setPersistence,
    browserSessionPersistence,
    signInWithEmailAndPassword,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebaseConfig'

const googleProvider = new GoogleAuthProvider()

setPersistence(auth, browserSessionPersistence)

export async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user

    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            avatar: user.photoURL,
            role: 'admin',
            status: 'active',
            createdAt: new Date().toISOString(),
        })
    } else {
        if (userSnap.data()?.role === 'admin' && userSnap.data()?.status === 'inactive') {
            await setDoc(userRef, { status: 'active' }, { merge: true })
        } else if (userSnap.data().status === 'inactive') {
            await signOut(auth)
            throw new Error('Your account is currently disabled.')
        }
    }

    return user
}

export async function loginWithEmail(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password)
    const user = result.user

    const userSnap = await getDoc(doc(db, 'users', user.uid))
    if (!userSnap.exists()) {
        await signOut(auth)
        throw new Error('Your account does not exist.')
    } else if (userSnap.data().status === 'inactive') {
        await signOut(auth)
        throw new Error('Your account is currently disabled.')
    }

    return user
}

export async function logout() {
    await signOut(auth)
}
