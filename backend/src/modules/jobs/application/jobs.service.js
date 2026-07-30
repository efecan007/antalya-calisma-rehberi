const { ValidationError, NotFoundError, ForbiddenError, ConflictError } = require('../../../common/errors');

const MAX_COMPANY_LENGTH = 120;
const MAX_POSITION_LENGTH = 120;
const MAX_PROFESSION_LENGTH = 80;
const MAX_LOCATION_LENGTH = 120;
const MAX_EMPLOYMENT_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 4000;
const MAX_MESSAGE_LENGTH = 1000;

const VALID_STATUSES = new Set(['ACCEPTED', 'REJECTED']);

class JobsService {
  constructor({ jobsRepository }) {
    this.jobsRepository = jobsRepository;
  }

  // ===================== Yardımcılar =====================

  // Zorunlu metin alanı: boş olamaz, üst sınırı aşamaz.
  _requireText(value, label, max) {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (!trimmed) {
      throw new ValidationError(`${label} zorunludur`);
    }
    if (trimmed.length > max) {
      throw new ValidationError(`${label} en fazla ${max} karakter olabilir`);
    }
    return trimmed;
  }

  // Opsiyonel metin alanı: boşsa null, doluysa üst sınırı aşamaz.
  _optionalText(value, label, max) {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (!trimmed) return null;
    if (trimmed.length > max) {
      throw new ValidationError(`${label} en fazla ${max} karakter olabilir`);
    }
    return trimmed;
  }

  async _getOwnedJob(jobId, userId) {
    const job = await this.jobsRepository.findJobById(jobId);
    if (!job) {
      throw new NotFoundError('İş ilanı bulunamadı');
    }
    if (job.userId !== userId) {
      throw new ForbiddenError('Bu ilan üzerinde işlem yapma yetkiniz yok');
    }
    return job;
  }

  // ===================== İlanlar =====================

  async listJobs({ viewerId, profession } = {}) {
    const jobs = await this.jobsRepository.findOpenJobs({ profession: profession?.trim() || null });

    if (viewerId && jobs.length) {
      const statuses = await this.jobsRepository.findViewerApplicationStatuses(
        viewerId,
        jobs.map((job) => job.id)
      );
      const byJob = new Map(statuses.map((s) => [s.jobId, s.status]));
      jobs.forEach((job) => {
        job.viewerApplicationStatus = byJob.get(job.id) ?? null;
        job.hasApplied = job.viewerApplicationStatus != null;
        job.isOwner = job.userId === viewerId;
      });
    }

    return jobs;
  }

  async createJob({ userId, companyName, position, profession, description, location, employmentType }) {
    // Şirket ismi ve pozisyon zorunlu; diğer alanlar opsiyonel.
    const data = {
      userId,
      companyName: this._requireText(companyName, 'Şirket ismi', MAX_COMPANY_LENGTH),
      position: this._requireText(position, 'Pozisyon', MAX_POSITION_LENGTH),
      profession: this._optionalText(profession, 'Meslek/alan', MAX_PROFESSION_LENGTH),
      description: this._optionalText(description, 'Açıklama', MAX_DESCRIPTION_LENGTH),
      location: this._optionalText(location, 'Konum', MAX_LOCATION_LENGTH),
      employmentType: this._optionalText(employmentType, 'Çalışma biçimi', MAX_EMPLOYMENT_LENGTH),
    };
    return this.jobsRepository.createJob(data);
  }

  async listMyJobs({ userId }) {
    return this.jobsRepository.findJobsByUser(userId);
  }

  async updateJob({ jobId, userId, isOpen, ...fields }) {
    await this._getOwnedJob(jobId, userId);

    const data = {};
    if (typeof isOpen === 'boolean') data.isOpen = isOpen;
    if (fields.companyName !== undefined)
      data.companyName = this._requireText(fields.companyName, 'Şirket ismi', MAX_COMPANY_LENGTH);
    if (fields.position !== undefined)
      data.position = this._requireText(fields.position, 'Pozisyon', MAX_POSITION_LENGTH);
    if (fields.profession !== undefined)
      data.profession = this._optionalText(fields.profession, 'Meslek/alan', MAX_PROFESSION_LENGTH);
    if (fields.description !== undefined)
      data.description = this._optionalText(fields.description, 'Açıklama', MAX_DESCRIPTION_LENGTH);
    if (fields.location !== undefined)
      data.location = this._optionalText(fields.location, 'Konum', MAX_LOCATION_LENGTH);
    if (fields.employmentType !== undefined)
      data.employmentType = this._optionalText(fields.employmentType, 'Çalışma biçimi', MAX_EMPLOYMENT_LENGTH);

    if (Object.keys(data).length === 0) {
      throw new ValidationError('Güncellenecek alan yok');
    }
    return this.jobsRepository.updateJob(jobId, data);
  }

  async deleteJob({ jobId, userId, requesterRole }) {
    const job = await this.jobsRepository.findJobById(jobId);
    if (!job) {
      throw new NotFoundError('İş ilanı bulunamadı');
    }
    if (job.userId !== userId && requesterRole !== 'ADMIN') {
      throw new ForbiddenError('Yalnızca kendi ilanınızı silebilirsiniz');
    }
    await this.jobsRepository.deleteJob(jobId);
  }

  // ===================== Başvurular =====================

  async apply({ jobId, userId, profession, message }) {
    const job = await this.jobsRepository.findJobById(jobId);
    if (!job) {
      throw new NotFoundError('İş ilanı bulunamadı');
    }
    if (!job.isOpen) {
      throw new ValidationError('Bu ilana başvurular kapatılmış');
    }
    if (job.userId === userId) {
      throw new ValidationError('Kendi ilanınıza başvuramazsınız');
    }

    const existing = await this.jobsRepository.findApplication(jobId, userId);
    if (existing) {
      throw new ConflictError('Bu ilana zaten başvurdunuz');
    }

    // "Kendi mesleğine göre başvuru" — başvuran mesleğini belirtmek zorunda.
    const trimmedProfession = this._requireText(profession, 'Meslek', MAX_PROFESSION_LENGTH);
    const trimmedMessage = this._optionalText(message, 'Mesaj', MAX_MESSAGE_LENGTH);

    return this.jobsRepository.createApplication({
      jobId,
      userId,
      profession: trimmedProfession,
      message: trimmedMessage,
    });
  }

  async listMyApplications({ userId }) {
    return this.jobsRepository.findApplicationsByUser(userId);
  }

  async decideApplication({ applicationId, userId, status }) {
    if (!VALID_STATUSES.has(status)) {
      throw new ValidationError('Geçersiz başvuru durumu');
    }
    const application = await this.jobsRepository.findApplicationById(applicationId);
    if (!application) {
      throw new NotFoundError('Başvuru bulunamadı');
    }
    // Yalnızca ilan sahibi başvuruyu kabul/ret edebilir.
    const job = await this.jobsRepository.findJobById(application.jobId);
    if (!job || job.userId !== userId) {
      throw new ForbiddenError('Bu başvuru üzerinde işlem yapma yetkiniz yok');
    }
    return this.jobsRepository.updateApplicationStatus(applicationId, status);
  }
}

module.exports = JobsService;
