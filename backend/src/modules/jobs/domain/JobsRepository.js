/**
 * İş İlanları modülünün veri erişim sözleşmesi. Uygulama (service) katmanı yalnızca
 * bu arayüze bağımlıdır; Prisma detayları infrastructure/jobs.repository.js içinde kalır.
 */
class JobsRepository {
  // --- İlanlar ---
  async createJob(_data) {
    throw new Error('Not implemented');
  }

  async findJobById(_id) {
    throw new Error('Not implemented');
  }

  async findOpenJobs(_options) {
    throw new Error('Not implemented');
  }

  async findJobsByUser(_userId) {
    throw new Error('Not implemented');
  }

  async updateJob(_id, _data) {
    throw new Error('Not implemented');
  }

  async deleteJob(_id) {
    throw new Error('Not implemented');
  }

  // --- Başvurular ---
  async createApplication(_data) {
    throw new Error('Not implemented');
  }

  async findApplicationById(_id) {
    throw new Error('Not implemented');
  }

  async findApplication(_jobId, _userId) {
    throw new Error('Not implemented');
  }

  async findApplicationsByUser(_userId) {
    throw new Error('Not implemented');
  }

  async findViewerApplicationStatuses(_userId, _jobIds) {
    throw new Error('Not implemented');
  }

  async updateApplicationStatus(_id, _status) {
    throw new Error('Not implemented');
  }

  // --- Kullanıcı ---
  async findUserById(_id) {
    throw new Error('Not implemented');
  }
}

module.exports = JobsRepository;
