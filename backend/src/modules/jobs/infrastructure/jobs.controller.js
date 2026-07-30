const { jobsService } = require('./jobs.container');

async function listJobs(req, res, next) {
  try {
    const jobs = await jobsService.listJobs({
      viewerId: req.user?.id,
      profession: req.query.profession,
    });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
}

async function createJob(req, res, next) {
  try {
    const job = await jobsService.createJob({
      userId: req.user.id,
      companyName: req.body.companyName,
      position: req.body.position,
      profession: req.body.profession,
      description: req.body.description,
      location: req.body.location,
      employmentType: req.body.employmentType,
    });
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
}

async function listMyJobs(req, res, next) {
  try {
    const jobs = await jobsService.listMyJobs({ userId: req.user.id });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
}

async function updateJob(req, res, next) {
  try {
    const job = await jobsService.updateJob({
      jobId: Number(req.params.id),
      userId: req.user.id,
      ...req.body,
    });
    res.json(job);
  } catch (err) {
    next(err);
  }
}

async function deleteJob(req, res, next) {
  try {
    await jobsService.deleteJob({
      jobId: Number(req.params.id),
      userId: req.user.id,
      requesterRole: req.user.role,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function applyToJob(req, res, next) {
  try {
    const application = await jobsService.apply({
      jobId: Number(req.params.id),
      userId: req.user.id,
      profession: req.body.profession,
      message: req.body.message,
    });
    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
}

async function listMyApplications(req, res, next) {
  try {
    const applications = await jobsService.listMyApplications({ userId: req.user.id });
    res.json(applications);
  } catch (err) {
    next(err);
  }
}

async function decideApplication(req, res, next) {
  try {
    const application = await jobsService.decideApplication({
      applicationId: Number(req.params.id),
      userId: req.user.id,
      status: req.body.status,
    });
    res.json(application);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listJobs,
  createJob,
  listMyJobs,
  updateJob,
  deleteJob,
  applyToJob,
  listMyApplications,
  decideApplication,
};
