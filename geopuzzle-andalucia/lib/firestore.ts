import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, where, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Solicitud, ForumThread, ForumReply, Cuadrante } from '@/lib/types';

// --- SOLICITUDES ---
export async function crearSolicitud(data: Omit<Solicitud, 'id' | 'estado' | 'creadoEn'>) {
  return addDoc(collection(db, 'solicitudes'), {
    ...data,
    estado: 'pendiente',
    creadoEn: serverTimestamp(),
  });
}

export async function obtenerSolicitudes() {
  const q = query(collection(db, 'solicitudes'), orderBy('creadoEn', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Solicitud[];
}

export async function actualizarEstadoSolicitud(
  id: string,
  estado: 'aprobado' | 'rechazado',
  uid?: string
) {
  await updateDoc(doc(db, 'solicitudes', id), {
    estado,
    actualizadoEn: serverTimestamp(),
  });

  // Si se aprueba, actualizar también el perfil del usuario en /usuarios/{uid}
  if (estado === 'aprobado' && uid) {
    await updateDoc(doc(db, 'usuarios', uid), {
      rol: 'aprobado',
      actualizadoEn: serverTimestamp(),
    });
  }
}

// --- FORO ---
export async function crearHilo(data: Omit<ForumThread, 'id' | 'creadoEn' | 'numRespuestas'>) {
  return addDoc(collection(db, 'foro'), {
    ...data,
    numRespuestas: 0,
    creadoEn: serverTimestamp(),
  });
}

export async function obtenerHilos() {
  const q = query(collection(db, 'foro'), orderBy('creadoEn', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as ForumThread[];
}

export async function crearRespuesta(
  hiloId: string,
  data: Omit<ForumReply, 'id' | 'creadoEn'>
) {
  const ref = await addDoc(collection(db, 'foro', hiloId, 'respuestas'), {
    ...data,
    creadoEn: serverTimestamp(),
  });
  // Incrementar contador
  await updateDoc(doc(db, 'foro', hiloId), {
    numRespuestas: (await getDocs(collection(db, 'foro', hiloId, 'respuestas'))).size,
  });
  return ref;
}

export async function obtenerRespuestas(hiloId: string) {
  const q = query(collection(db, 'foro', hiloId, 'respuestas'), orderBy('creadoEn', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as ForumReply[];
}

export async function eliminarHilo(hiloId: string) {
  await deleteDoc(doc(db, 'foro', hiloId));
}

// --- CUADRANTES ---
export async function obtenerCuadrantes() {
  const snap = await getDocs(collection(db, 'cuadrantes'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Cuadrante[];
}

export async function asignarCuadrante(
  cuadranteId: string,
  centroId: string,
  centroNombre: string
) {
  await updateDoc(doc(db, 'cuadrantes', cuadranteId), {
    asignado: true,
    centroId,
    centroNombre,
    fechaAsignacion: serverTimestamp(),
  });
}

export async function liberarCuadrante(cuadranteId: string) {
  await updateDoc(doc(db, 'cuadrantes', cuadranteId), {
    asignado: false,
    centroId: null,
    centroNombre: null,
    fechaAsignacion: null,
  });
}
