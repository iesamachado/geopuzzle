import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { CUADRANTES_INICIALES } from './cuadrantes-data';

/**
 * Script para inicializar la colección de cuadrantes en Firestore.
 * Ejecuta esta función UNA VEZ para rellenar los datos iniciales.
 */
export async function seedCuadrantes() {
  console.log('Iniciando seeding de cuadrantes...');
  const batch = writeBatch(db);

  CUADRANTES_INICIALES.forEach((c) => {
    const ref = doc(db, 'cuadrantes', c.id);
    batch.set(ref, {
      ...c,
      asignado: false,
      centroId: null,
      centroNombre: null,
      fechaAsignacion: null,
    });
  });

  await batch.commit();
  console.log('Seeding completado con éxito.');
}
