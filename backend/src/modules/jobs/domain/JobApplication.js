// Bir iş ilanına yapılan başvuru. `applicant` başvuran kullanıcının herkese açık
// alanlarını, `job` (opsiyonel) başvurulan ilanın özetini taşır.
class JobApplication {
  constructor({ id, jobId, userId, profession, message, status, createdAt, applicant, job }) {
    this.id = id;
    this.jobId = jobId;
    this.userId = userId;
    this.profession = profession;
    this.message = message ?? null;
    this.status = status;
    this.createdAt = createdAt;
    this.applicant = applicant ?? null;
    this.job = job ?? null;
  }
}

module.exports = JobApplication;
