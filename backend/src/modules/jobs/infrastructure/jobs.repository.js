const JobsRepository = require('../domain/JobsRepository');
const JobPosting = require('../domain/JobPosting');
const JobApplication = require('../domain/JobApplication');

// İlan/başvurularda her zaman aynı herkese açık kullanıcı alanları döner.
const USER_SELECT = { id: true, name: true, avatarUrl: true, companyName: true };

const JOB_INCLUDE = {
  user: { select: USER_SELECT },
  _count: { select: { applications: true } },
};

function toJobEntity(record) {
  if (!record) return null;
  return new JobPosting({
    id: record.id,
    userId: record.userId,
    companyName: record.companyName,
    position: record.position,
    profession: record.profession,
    description: record.description,
    location: record.location,
    employmentType: record.employmentType,
    isOpen: record.isOpen,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    user: record.user ?? null,
    applicantCount: record._count?.applications ?? 0,
  });
}

function toApplicationEntity(record) {
  if (!record) return null;
  return new JobApplication({
    id: record.id,
    jobId: record.jobId,
    userId: record.userId,
    profession: record.profession,
    message: record.message,
    status: record.status,
    createdAt: record.createdAt,
    applicant: record.user ?? null,
    job: record.job
      ? {
          id: record.job.id,
          companyName: record.job.companyName,
          position: record.job.position,
          isOpen: record.job.isOpen,
        }
      : null,
  });
}

class JobsPrismaRepository extends JobsRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  // --- İlanlar ---
  async createJob(data) {
    const record = await this.prisma.jobPosting.create({ data, include: JOB_INCLUDE });
    return toJobEntity(record);
  }

  async findJobById(id) {
    const record = await this.prisma.jobPosting.findUnique({ where: { id }, include: JOB_INCLUDE });
    return toJobEntity(record);
  }

  async findOpenJobs({ profession } = {}) {
    const where = { isOpen: true };
    if (profession) {
      where.profession = { contains: profession, mode: 'insensitive' };
    }
    const records = await this.prisma.jobPosting.findMany({
      where,
      include: JOB_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return records.map(toJobEntity);
  }

  async findJobsByUser(userId) {
    const records = await this.prisma.jobPosting.findMany({
      where: { userId },
      include: {
        ...JOB_INCLUDE,
        applications: {
          include: { user: { select: USER_SELECT } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => {
      const job = toJobEntity(record);
      job.applications = record.applications.map(toApplicationEntity);
      return job;
    });
  }

  async updateJob(id, data) {
    const record = await this.prisma.jobPosting.update({ where: { id }, data, include: JOB_INCLUDE });
    return toJobEntity(record);
  }

  async deleteJob(id) {
    await this.prisma.jobPosting.delete({ where: { id } });
  }

  // --- Başvurular ---
  async createApplication(data) {
    const record = await this.prisma.jobApplication.create({
      data,
      include: { user: { select: USER_SELECT } },
    });
    return toApplicationEntity(record);
  }

  async findApplicationById(id) {
    const record = await this.prisma.jobApplication.findUnique({
      where: { id },
      include: { user: { select: USER_SELECT } },
    });
    return toApplicationEntity(record);
  }

  async findApplication(jobId, userId) {
    const record = await this.prisma.jobApplication.findUnique({
      where: { jobId_userId: { jobId, userId } },
    });
    return toApplicationEntity(record);
  }

  async findApplicationsByUser(userId) {
    const records = await this.prisma.jobApplication.findMany({
      where: { userId },
      include: {
        job: { select: { id: true, companyName: true, position: true, isOpen: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(toApplicationEntity);
  }

  async findViewerApplicationStatuses(userId, jobIds) {
    if (!jobIds.length) return [];
    const records = await this.prisma.jobApplication.findMany({
      where: { userId, jobId: { in: jobIds } },
      select: { jobId: true, status: true },
    });
    return records;
  }

  async updateApplicationStatus(id, status) {
    const record = await this.prisma.jobApplication.update({
      where: { id },
      data: { status },
      include: { user: { select: USER_SELECT } },
    });
    return toApplicationEntity(record);
  }

  // --- Kullanıcı ---
  async findUserById(id) {
    return this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  }
}

module.exports = JobsPrismaRepository;
