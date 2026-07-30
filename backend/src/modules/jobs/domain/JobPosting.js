// İş ilanı varlığı. Uygulama katmanı ve controller yalnızca bu düz nesneyle
// çalışır; Prisma detayları infrastructure/jobs.repository.js içinde kalır.
class JobPosting {
  constructor({
    id,
    userId,
    companyName,
    position,
    profession,
    description,
    location,
    employmentType,
    isOpen,
    createdAt,
    updatedAt,
    user,
    applicantCount,
    // Görüntüleyen kullanıcının bu ilana daha önce başvurup başvurmadığı ve
    // (başvurduysa) başvurusunun durumu — feed'de "Başvuruldu" göstermek için.
    viewerApplicationStatus,
  }) {
    this.id = id;
    this.userId = userId;
    this.companyName = companyName;
    this.position = position;
    this.profession = profession ?? null;
    this.description = description ?? null;
    this.location = location ?? null;
    this.employmentType = employmentType ?? null;
    this.isOpen = isOpen ?? true;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.user = user ?? null;
    this.applicantCount = applicantCount ?? 0;
    this.viewerApplicationStatus = viewerApplicationStatus ?? null;
    this.hasApplied = viewerApplicationStatus != null;
    this.isOwner = false;
  }
}

module.exports = JobPosting;
