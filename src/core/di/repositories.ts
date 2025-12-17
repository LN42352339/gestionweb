// src/core/di/repositories.ts

import { FirebaseContactRepository } from "../../data/repositories/firebaseContactRepository";
import { ContactRepository } from "../../domain/repositories/contactRepository";

export const contactRepository: ContactRepository = new FirebaseContactRepository();
