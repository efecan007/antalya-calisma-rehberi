import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import UserAvatar from '../components/UserAvatar';
import CreateJobModal from '../components/jobs/CreateJobModal';
import ApplyModal from '../components/jobs/ApplyModal';
import * as jobsApi from '../api/jobs';

export default function JobsPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState('all'); // 'all' | 'mine' | 'applications'
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [applyJob, setApplyJob] = useState(null);

  const locale = lang === 'en' ? 'en-US' : 'tr-TR';
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(locale) : '—');

  const load = useCallback(async (which) => {
    setLoading(true);
    try {
      if (which === 'all') setJobs(await jobsApi.getJobs());
      else if (which === 'mine') setMyJobs(await jobsApi.getMyJobs());
      else if (which === 'applications') setMyApplications(await jobsApi.getMyApplications());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  function handleCreated(job) {
    setCreateOpen(false);
    setMyJobs((prev) => [{ ...job, applications: [] }, ...prev]);
    setJobs((prev) => [job, ...prev]);
    setTab('mine');
  }

  function handleApplied(jobId, application) {
    setApplyJob(null);
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? { ...j, hasApplied: true, viewerApplicationStatus: application.status, applicantCount: j.applicantCount + 1 }
          : j
      )
    );
  }

  async function handleDeleteJob(id) {
    if (!window.confirm(t('jobs.confirmDelete'))) return;
    await jobsApi.deleteJob(id);
    setMyJobs((prev) => prev.filter((j) => j.id !== id));
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  async function handleToggleOpen(job) {
    const updated = await jobsApi.updateJob(job.id, { isOpen: !job.isOpen });
    setMyJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, isOpen: updated.isOpen } : j)));
  }

  async function handleDecide(applicationId, status) {
    const updated = await jobsApi.decideApplication(applicationId, status);
    setMyJobs((prev) =>
      prev.map((j) => ({
        ...j,
        applications: j.applications?.map((a) => (a.id === applicationId ? { ...a, status: updated.status } : a)),
      }))
    );
  }

  const tabClass = (name) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
      tab === name ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-800'
    }`;

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-5">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link to="/sosyal" className="text-sm text-gray-500 hover:text-brand-700 transition">
              ← {t('jobs.backToFeed')}
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">{t('jobs.title')}</h1>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-brand-600 text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-brand-700 transition"
          >
            {t('jobs.postJob')}
          </button>
        </div>

        {/* Sekmeler */}
        <div className="flex gap-1 border-b border-gray-200 mb-4">
          <button onClick={() => setTab('all')} className={tabClass('all')}>
            {t('jobs.tabAll')}
          </button>
          <button onClick={() => setTab('mine')} className={tabClass('mine')}>
            {t('jobs.tabMine')}
          </button>
          <button onClick={() => setTab('applications')} className={tabClass('applications')}>
            {t('jobs.tabApplications')}
          </button>
        </div>

        {loading && <p className="text-sm text-gray-400 text-center py-10">{t('common.loading')}</p>}

        {/* Tüm ilanlar */}
        {!loading && tab === 'all' && (
          <div className="space-y-3">
            {jobs.length === 0 && <p className="text-sm text-gray-400 text-center py-10">{t('jobs.emptyAll')}</p>}
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                t={t}
                fmtDate={fmtDate}
                isOwner={job.userId === user?.id}
                onApply={() => setApplyJob(job)}
              />
            ))}
          </div>
        )}

        {/* İlanlarım */}
        {!loading && tab === 'mine' && (
          <div className="space-y-3">
            {myJobs.length === 0 && <p className="text-sm text-gray-400 text-center py-10">{t('jobs.emptyMine')}</p>}
            {myJobs.map((job) => (
              <MyJobCard
                key={job.id}
                job={job}
                t={t}
                fmtDate={fmtDate}
                onToggleOpen={() => handleToggleOpen(job)}
                onDelete={() => handleDeleteJob(job.id)}
                onDecide={handleDecide}
              />
            ))}
          </div>
        )}

        {/* Başvurularım */}
        {!loading && tab === 'applications' && (
          <div className="space-y-3">
            {myApplications.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-10">{t('jobs.emptyApplications')}</p>
            )}
            {myApplications.map((app) => (
              <div key={app.id} className="bg-white rounded-2xl shadow-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{app.job?.position}</p>
                    <p className="text-sm text-gray-500">{app.job?.companyName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('jobs.appliedAs')}: {app.profession} · {fmtDate(app.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={app.status} t={t} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateJobModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
      <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} onApplied={handleApplied} />
    </div>
  );
}

// Meta satırı: pozisyon/şirket + opsiyonel etiketler.
function JobMeta({ job, t }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{job.position}</h3>
          <p className="text-sm text-gray-600">{job.companyName}</p>
        </div>
        {!job.isOpen && (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 shrink-0">
            {t('jobs.closed')}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {job.profession && <Tag>{job.profession}</Tag>}
        {job.employmentType && <Tag>{job.employmentType}</Tag>}
        {job.location && <Tag>📍 {job.location}</Tag>}
      </div>
      {job.description && <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{job.description}</p>}
    </>
  );
}

function JobCard({ job, t, fmtDate, isOwner, onApply }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-4">
      <JobMeta job={job} t={t} />
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <UserAvatar avatarUrl={job.user?.avatarUrl} name={job.user?.name} size="sm" />
          <span>{fmtDate(job.createdAt)}</span>
        </div>
        {isOwner ? (
          <span className="text-xs text-gray-400">{t('jobs.ownJob')}</span>
        ) : job.hasApplied ? (
          <StatusBadge status={job.viewerApplicationStatus} t={t} />
        ) : (
          <button
            onClick={onApply}
            disabled={!job.isOpen}
            className="text-sm bg-brand-600 text-white px-4 py-1.5 rounded-full hover:bg-brand-700 transition disabled:opacity-50"
          >
            {t('jobs.apply')}
          </button>
        )}
      </div>
    </div>
  );
}

function MyJobCard({ job, t, fmtDate, onToggleOpen, onDelete, onDecide }) {
  const applications = job.applications ?? [];
  return (
    <div className="bg-white rounded-2xl shadow-card p-4">
      <JobMeta job={job} t={t} />
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <button onClick={onToggleOpen} className="text-xs text-gray-600 border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50">
          {job.isOpen ? t('jobs.closeApplications') : t('jobs.reopenApplications')}
        </button>
        <button onClick={onDelete} className="text-xs text-red-600 rounded-full px-3 py-1 hover:bg-red-50">
          {t('jobs.delete')}
        </button>
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-gray-500 mb-2">
          {t('jobs.applicants')} ({applications.length})
        </p>
        {applications.length === 0 ? (
          <p className="text-xs text-gray-400">{t('jobs.noApplicants')}</p>
        ) : (
          <div className="space-y-2">
            {applications.map((app) => (
              <div key={app.id} className="flex items-start justify-between gap-3 bg-gray-50 rounded-xl p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <UserAvatar avatarUrl={app.applicant?.avatarUrl} name={app.applicant?.name} size="sm" />
                    <span className="text-sm font-medium text-gray-800 truncate">{app.applicant?.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('jobs.profession')}: {app.profession}
                  </p>
                  {app.message && <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{app.message}</p>}
                  <p className="text-[11px] text-gray-400 mt-1">{fmtDate(app.createdAt)}</p>
                </div>
                <div className="shrink-0">
                  {app.status === 'PENDING' ? (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => onDecide(app.id, 'ACCEPTED')}
                        className="text-xs bg-brand-600 text-white px-3 py-1 rounded-full hover:bg-brand-700"
                      >
                        {t('jobs.accept')}
                      </button>
                      <button
                        onClick={() => onDecide(app.id, 'REJECTED')}
                        className="text-xs text-red-600 border border-red-200 px-3 py-1 rounded-full hover:bg-red-50"
                      >
                        {t('jobs.reject')}
                      </button>
                    </div>
                  ) : (
                    <StatusBadge status={app.status} t={t} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span className="text-xs text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-2 py-0.5">
      {children}
    </span>
  );
}

function StatusBadge({ status, t }) {
  const styles = {
    PENDING: 'text-amber-700 bg-amber-50 border-amber-100',
    ACCEPTED: 'text-green-700 bg-green-50 border-green-100',
    REJECTED: 'text-red-700 bg-red-50 border-red-100',
  };
  return (
    <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 border ${styles[status] || styles.PENDING}`}>
      {t(`jobs.status${status}`)}
    </span>
  );
}
