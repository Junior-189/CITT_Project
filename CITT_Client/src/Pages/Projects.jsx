import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Eye, Edit2, RotateCcw } from 'lucide-react';

// ─── Stage Definitions ────────────────────────────────────────────────────────
const MILESTONE_STAGES = [
  {
    id: 1, name: 'Idea Generation', short: 'Idea',
    description: 'Define the problem and describe your raw innovation idea.',
    questions: [
      { key: 'q1', label: 'What problem does your innovation solve?', required: true },
      { key: 'q2', label: 'Describe your innovation idea in simple terms.', required: true },
      { key: 'q3', label: 'Who are the target beneficiaries of this innovation?', required: true },
    ],
  },
  {
    id: 2, name: 'Concept Development', short: 'Concept',
    description: 'Structure and detail your idea with feasibility analysis and technical planning.',
    questions: [
      { key: 'q1', label: 'Have you conducted a feasibility analysis? Summarize your findings.', required: true },
      { key: 'q2', label: 'What is the basic design or technical plan of your concept?', required: true },
      { key: 'q3', label: 'What literature or research supports your concept?', required: false },
    ],
  },
  {
    id: 3, name: 'Prototype Development', short: 'Prototype',
    description: 'Build a working model of your innovation and conduct initial testing.',
    questions: [
      { key: 'q1', label: 'Describe the prototype you have built.', required: true },
      { key: 'q2', label: 'What materials or technologies were used to build the prototype?', required: true },
      { key: 'q3', label: 'What were the initial test results of your prototype?', required: true },
    ],
  },
  {
    id: 4, name: 'Testing & Validation', short: 'Testing',
    description: 'Test your prototype in real conditions and gather user feedback.',
    questions: [
      { key: 'q1', label: 'How did you test your prototype in real conditions?', required: true },
      { key: 'q2', label: 'What feedback did you receive from users or testers?', required: true },
      { key: 'q3', label: 'What errors or issues were found and how did you fix them?', required: true },
    ],
  },
  {
    id: 5, name: 'IP & Documentation', short: 'IP',
    description: 'Protect your innovation legally and prepare full technical documentation.',
    questions: [
      { key: 'q1', label: 'Have you conducted a patent search? What did you find?', required: true },
      { key: 'q2', label: 'Describe the intellectual property protection applied for or planned.', required: true },
      { key: 'q3', label: 'Summarize the technical documentation prepared.', required: true },
    ],
  },
  {
    id: 6, name: 'Funding & Investment', short: 'Funding',
    description: 'Secure financial support for your innovation through pitching and proposals.',
    questions: [
      { key: 'q1', label: 'What funding sources have you identified or applied to?', required: true },
      { key: 'q2', label: 'Describe your pitch or funding proposal.', required: true },
      { key: 'q3', label: 'Have you secured any investment agreements? Describe.', required: false },
    ],
  },
  {
    id: 7, name: 'Deployment / Implementation', short: 'Deploy',
    description: 'Implement your innovation in real environments with user training.',
    questions: [
      { key: 'q1', label: 'Describe how the innovation was deployed or installed.', required: true },
      { key: 'q2', label: 'What user training was conducted?', required: true },
      { key: 'q3', label: 'How was system integration handled?', required: true },
    ],
  },
  {
    id: 8, name: 'Monitoring & Evaluation', short: 'M&E',
    description: 'Track performance and impact of your deployed innovation.',
    questions: [
      { key: 'q1', label: 'What data have you collected to measure performance?', required: true },
      { key: 'q2', label: 'What are the key performance results so far?', required: true },
      { key: 'q3', label: 'What improvements have been identified based on feedback?', required: true },
    ],
  },
  {
    id: 9, name: 'Scaling & Commercialization', short: 'Scale',
    description: 'Expand your innovation and bring it to the market.',
    questions: [
      { key: 'q1', label: 'Describe your market entry strategy.', required: true },
      { key: 'q2', label: 'How do you plan to scale production or delivery?', required: true },
      { key: 'q3', label: 'What business development steps have been taken?', required: true },
    ],
  },
];

// ─── Horizontal Stepper ───────────────────────────────────────────────────────
const HorizontalStepper = ({ milestones, activeStepId, onStepClick }) => {
  const getStatus = (stageId) => {
    const m = milestones.find(x => x.stage_number === stageId);
    return m ? m.status : 'pending';
  };

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center min-w-max mx-auto px-2">
        {MILESTONE_STAGES.map((stage, idx) => {
          const status = getStatus(stage.id);
          const isActive = stage.id === activeStepId;
          const isCompleted = status === 'completed';
          const isSubmitted = status === 'submitted';
          const isRejected = status === 'rejected';

          return (
            <React.Fragment key={stage.id}>
              {/* Step circle */}
              <div className="flex flex-col items-center" style={{ minWidth: 64 }}>
                <button
                  onClick={() => onStepClick(stage.id)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-200 focus:outline-none
                    ${isCompleted
                      ? 'bg-teal-600 border-teal-600 text-white shadow-md'
                      : isActive && isRejected
                      ? 'bg-red-500 border-red-500 text-white ring-4 ring-red-200 shadow-md'
                      : isActive
                      ? 'bg-teal-600 border-teal-600 text-white ring-4 ring-teal-200 shadow-md'
                      : isSubmitted
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : isRejected
                      ? 'bg-red-400 border-red-400 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                    }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isRejected ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : isSubmitted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  ) : (
                    stage.id
                  )}
                </button>
                <span className={`text-xs font-semibold mt-1.5 text-center leading-tight max-w-[56px]
                  ${isCompleted ? 'text-teal-600' : isActive ? 'text-teal-700' : isRejected ? 'text-red-500' : 'text-gray-400'}`}>
                  {stage.short}
                </span>
              </div>
              {/* Connector line */}
              {idx < MILESTONE_STAGES.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-300 ${
                  getStatus(stage.id) === 'completed' ? 'bg-teal-500' : 'bg-gray-200'
                }`} style={{ minWidth: 20 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ─── Stage Card (the form for each step) ─────────────────────────────────────
const StageCard = ({ stage, milestone, onSubmit, isSubmitting, comments = [] }) => {
  const [answers, setAnswers] = React.useState({});
  const [file, setFile] = React.useState(null);
  const [filePreview, setFilePreview] = React.useState(null);
  const [errors, setErrors] = React.useState({});

  const status = milestone?.status || 'pending';
  const isCompleted = status === 'completed';
  const isSubmittedForReview = status === 'submitted';

  const handleAnswerChange = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setFilePreview(f.name);
    }
  };

  const validate = () => {
    const newErrors = {};
    stage.questions.forEach(q => {
      if (q.required && !answers[q.key]?.trim()) {
        newErrors[q.key] = 'This field is required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const notes = stage.questions
      .map(q => `${q.label}\n${answers[q.key] || '(not answered)'}`)
      .join('\n\n---\n\n');
    onSubmit({ notes, file });
  };

  // Completed — read-only view
  if (isCompleted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border-2 border-teal-200 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-teal-700">Stage {stage.id} Completed: {stage.name}</h3>
            <p className="text-xs text-teal-500">This stage has been approved. You may view your submission below.</p>
          </div>
        </div>
        {milestone?.submission_notes && (
          <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
            <p className="text-xs font-bold text-teal-600 mb-2 uppercase tracking-wide">Your Submission</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{milestone.submission_notes}</p>
          </div>
        )}
        {milestone?.approval_notes && (
          <div className="mt-3 p-4 bg-green-50 rounded-xl border border-green-100">
            <p className="text-xs font-bold text-green-600 mb-1 uppercase tracking-wide">Reviewer Comments</p>
            <p className="text-sm text-green-700">{milestone.approval_notes}</p>
          </div>
        )}
        {comments.filter(c => c.stage_number === stage.id).map(c => (
          <div key={c.id} className="mt-2 bg-slate-50 border-l-4 border-teal-500 rounded p-3">
            <p className="text-xs font-semibold text-slate-600">{c.commenter_name} ({c.commenter_role})</p>
            <p className="text-sm text-slate-700 mt-1">{c.comment}</p>
            <p className="text-xs text-slate-400 mt-1">{new Date(c.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    );
  }

  // Submitted — awaiting review
  if (isSubmittedForReview) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-200 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-700">Stage {stage.id} Submitted: {stage.name}</h3>
            <p className="text-xs text-blue-500">Your submission is being reviewed by your mentor or technical committee. Please wait.</p>
          </div>
        </div>
        {milestone?.submission_notes && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide">Your Submitted Answers</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{milestone.submission_notes}</p>
          </div>
        )}
        {comments.filter(c => c.stage_number === stage.id).map(c => (
          <div key={c.id} className="mt-2 bg-slate-50 border-l-4 border-teal-500 rounded p-3">
            <p className="text-xs font-semibold text-slate-600">{c.commenter_name} ({c.commenter_role})</p>
            <p className="text-sm text-slate-700 mt-1">{c.comment}</p>
            <p className="text-xs text-slate-400 mt-1">{new Date(c.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    );
  }

  // Active form (pending, in_progress, or rejected)
  const isRejected = status === 'rejected';

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-2 p-6 md:p-8 ${isRejected ? 'border-red-200' : 'border-teal-200'}`}>
      {/* Card Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${isRejected ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-600'}`}>
            Stage {stage.id} of 9
          </span>
          {isRejected && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Revision Required</span>}
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-1">{stage.name}</h3>
        <p className="text-slate-500 text-sm">{stage.description}</p>
      </div>

      {/* Rejection reason */}
      {isRejected && milestone?.rejection_reason && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs font-bold text-red-600 mb-1">Reviewer's Feedback:</p>
          <p className="text-sm text-red-700">{milestone.rejection_reason}</p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-5 mb-6">
        <p className="text-sm font-bold text-slate-700 border-b pb-2">Please answer the following questions about this stage:</p>
        {stage.questions.map((q, i) => (
          <div key={q.key}>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {i + 1}. {q.label}
              {q.required ? <span className="text-red-500 ml-1">*</span> : <span className="text-slate-400 ml-1 text-xs">(optional)</span>}
            </label>
            <textarea
              value={answers[q.key] || ''}
              onChange={e => handleAnswerChange(q.key, e.target.value)}
              placeholder={`Enter your answer for question ${i + 1}...`}
              className={`w-full border rounded-xl px-4 py-3 text-sm resize-none h-28 focus:ring-2 focus:outline-none transition-colors
                ${errors[q.key]
                  ? 'border-red-400 focus:ring-red-200 bg-red-50'
                  : 'border-gray-200 focus:ring-teal-300 focus:border-teal-400'
                }`}
            />
            {errors[q.key] && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {errors[q.key]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* File Upload */}
      <div className="mb-6 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-teal-300 transition-colors">
        <p className="text-sm font-bold text-slate-700 mb-1">
          Upload Proof / Supporting Document
          <span className="text-slate-400 font-normal ml-1 text-xs">(Optional — but strongly recommended)</span>
        </p>
        <p className="text-xs text-slate-400 mb-3">Accepted: PDF, Word, JPG, PNG — Max 10MB. This could be a photo of the prototype, a report, a receipt, or any evidence of completion.</p>
        <label className="cursor-pointer">
          <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${filePreview ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200 hover:bg-teal-50 hover:border-teal-200'}`}>
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              {filePreview ? (
                <>
                  <p className="text-sm font-semibold text-teal-700">{filePreview}</p>
                  <p className="text-xs text-teal-500">File selected — click to change</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-700">Click to upload a file</p>
                  <p className="text-xs text-slate-400">or drag and drop here</p>
                </>
              )}
            </div>
          </div>
          <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx" />
        </label>
      </div>

      {/* Info note */}
      <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2">
        <svg className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-slate-600">
          <strong>Note:</strong> If you have received funding or registered intellectual property at this stage, you may also upload those documents here as optional proof before continuing.
        </p>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl text-white font-bold text-base transition-all duration-200
          ${isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : isRejected
            ? 'bg-teal-600 hover:bg-teal-700 shadow-md hover:shadow-lg'
            : 'bg-teal-600 hover:bg-teal-700 shadow-md hover:shadow-lg'
          }`}
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting...
          </>
        ) : isRejected ? (
          <>Resubmit Stage {stage.id} <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></>
        ) : stage.id < 9 ? (
          <>Submit & Continue to Stage {stage.id + 1}: {MILESTONE_STAGES[stage.id]?.name} <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>
        ) : (
          <>Submit Final Stage &amp; Complete Project <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></>
        )}
      </button>
    </div>
  );
};

// ─── Project View Modal ───────────────────────────────────────────────────────
const ProjectViewModal = ({ project, onClose, onSubmitMilestone }) => {
  const [milestones, setMilestones] = React.useState([]);
  const [comments, setComments] = React.useState([]);
  const [loadingMilestones, setLoadingMilestones] = React.useState(true);
  const [activeStepId, setActiveStepId] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState('');
  const [submitError, setSubmitError] = React.useState('');

  React.useEffect(() => {
    fetchMilestones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const fetchMilestones = async () => {
    try {
      const res = await api.get(`/api/projects/${project.id}/milestones`);
      const ms = res.data.milestones || [];
      setMilestones(ms);
      setComments(res.data.comments || []);
      setActiveStepId(findActiveStage(ms));
    } catch {
      setMilestones([]);
    } finally {
      setLoadingMilestones(false);
    }
  };

  const findActiveStage = (ms) => {
    for (let i = 1; i <= 9; i++) {
      const m = ms.find(x => x.stage_number === i);
      if ((m?.status || 'pending') !== 'completed') return i;
    }
    return 9;
  };

  const handleStepClick = (stageId) => {
    const m = milestones.find(x => x.stage_number === stageId);
    const status = m?.status || 'pending';
    if (status === 'completed' || stageId === findActiveStage(milestones)) {
      setActiveStepId(stageId);
    }
  };

  const handleSubmitStage = async ({ notes, file }) => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const formData = new FormData();
      formData.append('notes', notes);
      if (file) formData.append('file', file);
      await api.post(`/api/projects/${project.id}/milestones/${activeStepId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitSuccess(`Stage ${activeStepId} submitted successfully! Awaiting review.`);
      await fetchMilestones();
      onSubmitMilestone && onSubmitMilestone();
      setTimeout(() => setSubmitSuccess(''), 4000);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const progressPct = Math.round((completedCount / 9) * 100);
  const activeStage = MILESTONE_STAGES.find(s => s.id === activeStepId);
  const activeMilestone = milestones.find(x => x.stage_number === activeStepId);
  const isProjectApproved = project.approval_status === 'approved';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-bold text-teal-700 truncate">{project.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{project.category} · {project.institution}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-600">Overall Progress</span>
            <span className="text-xs font-bold text-teal-600">{progressPct}% — {completedCount}/9 stages completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-teal-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
          {loadingMilestones ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
            </div>
          ) : !isProjectApproved ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-700 text-lg mb-2">Awaiting Project Approval</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Your project is currently under review by the DII Director or Admin. Milestone tracking will be unlocked once your project is approved.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : (
            <div className="p-4 md:p-6 space-y-6">
              {/* Horizontal Stepper */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-4 text-center">Milestone Progress</p>
                <HorizontalStepper
                  milestones={milestones}
                  activeStepId={activeStepId}
                  onStepClick={handleStepClick}
                />
              </div>

              {/* Success / Error */}
              {submitSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-green-700">{submitSuccess}</p>
                </div>
              )}
              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}

              {/* Active Stage Card */}
              {activeStage && (
                <StageCard
                  stage={activeStage}
                  milestone={activeMilestone}
                  onSubmit={handleSubmitStage}
                  isSubmitting={isSubmitting}
                  comments={comments}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Projects Page ─────────────────────────────────────────────────────────
const CATEGORIES = [
  'Agriculture & Food Security', 'Health & Biotechnology', 'Energy & Environment',
  'Artificial Intelligence & Data Science', 'Information & Communication Technology (ICT)',
  'Education & E-Learning Technologies', 'Manufacturing & Industrial Innovation',
  'Transport & Infrastructure', 'Water, Sanitation & Hygiene (WASH)',
  'FinTech (Financial Technology)', 'Business & Entrepreneurship Innovation',
  'Tourism, Hospitality & Creative Industries', 'Social Innovation & Community Development',
  'Security, Safety & Cybersecurity', 'Smart Cities & Housing',
  'Climate Change & Sustainability', 'Policy, Governance & Public Service Innovation',
  'Space Science, Aviation & Defense', 'Other (Specify)',
];

const EMPTY_FORM = {
  title: '', description: '', problem: '', category: '', otherCategory: '',
  stage: 'submitted', institution: '', funding: '', termsAgreed: false,
};

const approvalBadge = (status) => {
  const map = {
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    pending:  'bg-yellow-100 text-yellow-700',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

const Projects = () => {
  const { profile } = useAuth();

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Projects list
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');

  // Edit
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // Milestone modal
  const [milestoneProject, setMilestoneProject] = useState(null);

  // Stats (derived from projects list)
  const stats = {
    pending:     projects.filter(p => p.approval_status === 'pending').length,
    approved:    projects.filter(p => p.approval_status === 'approved').length,
    rejected:    projects.filter(p => p.approval_status === 'rejected').length,
    in_progress: projects.filter(p => p.project_status === 'on_progress').length,
    completed:   projects.filter(p => p.project_status === 'completed').length,
  };

  useEffect(() => {
    if (profile?.id) fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const fetchProjects = async () => {
    setLoading(true);
    setListError('');
    try {
      const res = await api.get('/api/admin/projects', { params: { limit: 1000 } });
      const all = res.data.projects || [];
      const uid = Number(profile.id);
      setProjects(all.filter(p => Number(p.user_id) === uid));
    } catch (e) {
      setListError('Failed to load projects. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(d => ({ ...d, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.termsAgreed) { setFormError('Please agree to the terms.'); return; }
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        problem_statement: formData.problem,
        category: formData.category === 'Other (Specify)' ? formData.otherCategory : formData.category,
        institution: formData.institution,
        funding_needed: parseInt(formData.funding) || 0,
        project_status: formData.stage,
      };
      await api.post('/api/admin/projects', payload);
      setFormSuccess(`"${formData.title}" submitted! Awaiting admin approval.`);
      setFormData(EMPTY_FORM);
      setShowForm(false);
      await fetchProjects();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (e) {
      setFormError(e.response?.data?.error || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = async (projectId) => {
    try {
      await api.put(`/api/admin/projects/${projectId}/resubmit`);
      await fetchProjects();
    } catch (e) {
      alert(e.response?.data?.error || 'Resubmit failed.');
    }
  };

  const handleEditSave = async (projectId) => {
    setEditSaving(true);
    try {
      await api.put(`/api/admin/projects/${projectId}`, editData);
      setEditingId(null);
      await fetchProjects();
    } catch (e) {
      alert(e.response?.data?.error || 'Update failed.');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <>
      {milestoneProject && (
        <ProjectViewModal
          project={milestoneProject}
          onClose={() => setMilestoneProject(null)}
          onSubmitMilestone={fetchProjects}
        />
      )}

      <main className="flex-1 px-4 md:px-8 py-8 overflow-auto bg-gray-50 text-slate-800">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">My Projects</h1>
              <p className="text-gray-500 text-sm mt-1">Track your innovation journey</p>
            </div>
            <button
              onClick={() => { setShowForm(!showForm); setFormError(''); }}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              {showForm ? 'Close Form' : '+ Register Project'}
            </button>
          </div>

          {/* Overview */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
            <h2 className="text-base font-bold text-slate-800 mb-1">Projects Module</h2>
            <p className="text-sm text-slate-500">Register your innovations and track them through CITT's 9-stage commercialization pipeline. Submit milestone work for review and receive feedback from your assigned team.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Pending', count: stats.pending,     color: 'border-yellow-400' },
              { label: 'Approved', count: stats.approved,   color: 'border-green-500' },
              { label: 'Rejected', count: stats.rejected,   color: 'border-red-500' },
              { label: 'In Progress', count: stats.in_progress, color: 'border-blue-500' },
              { label: 'Completed', count: stats.completed, color: 'border-teal-500' },
            ].map(s => (
              <div key={s.label} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${s.color} text-center`}>
                <p className="text-2xl font-bold text-slate-800">{s.count}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Global messages */}
          {formSuccess && (
            <div className="mb-5 bg-green-50 border-l-4 border-green-500 p-4 rounded text-sm text-green-700">
              {formSuccess}
            </div>
          )}

          {/* Registration Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl p-7 shadow-md mb-8 border border-gray-100">
              <h2 className="text-xl font-bold mb-5 text-teal-700">Project Registration Form</h2>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded text-sm text-red-700">
                  {formError}
                  <button onClick={() => setFormError('')} className="ml-2 underline text-xs">Dismiss</button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">Project Title *</label>
                  <input name="title" value={formData.title} onChange={handleChange} required
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Institution / Organization *</label>
                  <input name="institution" value={formData.institution} onChange={handleChange} required
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Category / Field *</label>
                  <select name="category" value={formData.category} onChange={handleChange} required
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none text-sm">
                    <option value="">Select Category</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  {formData.category === 'Other (Specify)' && (
                    <input name="otherCategory" value={formData.otherCategory} onChange={handleChange} required
                      placeholder="Please specify your category"
                      className="w-full border border-slate-300 rounded-lg p-2.5 mt-2 focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Stage of Development *</label>
                  <select name="stage" value={formData.stage} onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none text-sm">
                    <option value="submitted">Idea Stage</option>
                    <option value="on_progress">Concept Development</option>
                    <option value="on_progress">Minimum Functional Prototype (MFP)</option>
                    <option value="completed">Minimum Viable Product (MVP)</option>
                    <option value="completed">Market Fit Product (Validated Product)</option>
                    <option value="completed">Pilot / Testing / Early Deployment</option>
                    <option value="completed">Market-Ready / Commercialization Stage</option>
                    <option value="completed">Spin-off / Startup Stage</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1">Innovation Description *</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} required rows={3}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none text-sm resize-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1">Problem Being Solved *</label>
                  <textarea name="problem" value={formData.problem} onChange={handleChange} required rows={2}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none text-sm resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Estimated Funding Needed (TZS) *</label>
                  <input type="number" name="funding" value={formData.funding} onChange={handleChange} required
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
                </div>
              </div>

              <div className="mt-5">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" name="termsAgreed" checked={formData.termsAgreed} onChange={handleChange} className="mt-1" required />
                  <span className="text-xs text-slate-600">
                    I confirm that all project information, problem statement, and funding details provided are accurate and truthful.
                  </span>
                </label>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => { setShowForm(false); setFormData(EMPTY_FORM); }}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-semibold transition-colors">
                  {submitting ? 'Submitting...' : 'Submit Project'}
                </button>
              </div>
            </form>
          )}

          {/* Projects List */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              Your Projects <span className="text-gray-400 font-normal text-sm">({projects.length})</span>
            </h2>

            {loading && (
              <div className="text-center py-12 text-gray-500">Loading projects…</div>
            )}

            {listError && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded text-sm text-red-700 mb-4">{listError}</div>
            )}

            {!loading && projects.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-400 text-lg mb-2">No projects yet</p>
                <p className="text-gray-400 text-sm">Click "Register Project" to get started.</p>
              </div>
            )}

            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  {editingId === project.id ? (
                    /* Inline Edit Form */
                    <div>
                      <h3 className="font-bold text-slate-800 mb-4">Edit Project</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-semibold mb-1">Title</label>
                          <input value={editData.title || ''} onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Institution</label>
                          <input value={editData.institution || ''} onChange={e => setEditData(d => ({ ...d, institution: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold mb-1">Description</label>
                          <textarea rows={3} value={editData.description || ''} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none" />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setEditingId(null)}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold">Cancel</button>
                        <button onClick={() => handleEditSave(project.id)} disabled={editSaving}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-semibold">
                          {editSaving ? 'Saving…' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Project Card View */
                    <div>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-800 text-base truncate">{project.title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{project.category} · {project.institution}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${approvalBadge(project.approval_status)}`}>
                            {project.approval_status}
                          </span>
                          {project.project_status && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              {project.project_status}
                            </span>
                          )}
                        </div>
                      </div>

                      {project.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{project.description}</p>
                      )}

                      {project.admin_feedback && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg text-xs text-red-700">
                          <strong>Admin feedback:</strong> {project.admin_feedback}
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setMilestoneProject(project)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Progress
                        </button>

                        {['pending', 'rejected'].includes(project.approval_status) && (
                          <button
                            onClick={() => { setEditingId(project.id); setEditData({ title: project.title, description: project.description, institution: project.institution }); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                        )}

                        {project.approval_status === 'rejected' && (
                          <button
                            onClick={() => handleResubmit(project.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Resubmit
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  );
};

export default Projects;
