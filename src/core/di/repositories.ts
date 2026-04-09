// src/core/di/repositories.ts
// Punto único de instanciación de repositorios (Dependency Injection)

import { FirebaseContactRepository } from "../../data/repositories/firebaseContactRepository";
import { FirebaseHistorialRepository } from "../../data/repositories/firebaseHistorialRepository";
import { ContactRepository } from "../../domain/repositories/contactRepository";
import { HistorialRepository } from "../../domain/repositories/historialRepository";

export const contactRepository: ContactRepository = new FirebaseContactRepository();
export const historialRepository: HistorialRepository = new FirebaseHistorialRepository();
