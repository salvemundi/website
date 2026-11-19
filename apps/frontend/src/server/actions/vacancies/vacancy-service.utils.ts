import 'server-only';

import { VacancyRepository } from '@/server/repositories/VacancyRepository';
import {
    VacancyService,
    type VacancyMailerPort,
    type VacancyMediaStoragePort,
} from '@/server/services/VacancyService';
import { uploadDocumentToDirectus, uploadToDirectus } from '@/server/utils/media';
import { sendVacancyBulkMail, sendVacancyMail } from './vacancy-mail.utils';

const vacancyMediaStorage: VacancyMediaStoragePort = {
    uploadImage: (file, maxSizeBytes) => uploadToDirectus(file, maxSizeBytes),
    uploadDocument: (file) => uploadDocumentToDirectus(file),
};

const vacancyMailer: VacancyMailerPort = {
    sendMail: (to, templateId, data) => sendVacancyMail(to, templateId, data),
    sendBulkMail: (recipients, subject, template, data) =>
        sendVacancyBulkMail(recipients, subject, template, data),
};

export function createVacancyService(): VacancyService {
    return new VacancyService(new VacancyRepository(), vacancyMediaStorage, vacancyMailer);
}
