import axios from 'axios';

// Create Axios Instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // Default to local for dev safety
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Add Token
api.interceptors.request.use(
    (config) => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const parsed = JSON.parse(userInfo);
                // Handle different keys: token, accessToken, or nested in user object
                const token = parsed?.token || parsed?.accessToken || parsed?.user?.token;

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (e) {
                localStorage.removeItem('userInfo');
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 (Logout)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Not authorized, clear token and redirect (optional)
            localStorage.removeItem('userInfo');
            window.location.href = '/login'; // Force login if needed
        }
        return Promise.reject(error);
    }
);

// Program APIs
export const getPrograms = async () => {
    const { data } = await api.get('/programs');
    return data;
};

export const getProgramsByType = async (type) => {
    const { data } = await api.get(`/programs?type=${type}`);
    return data;
};

export const getProgram = async (id) => {
    const { data } = await api.get(`/programs/${id}`);
    return data;
};

export const createProgram = async (programData) => {
    const { data } = await api.post('/programs', programData);
    return data;
};

export const uploadProgramTemplate = async (id, file) => {
    const formData = new FormData();
    formData.append('template', file);

    // Explicitly let browser set Content-Type for multipart
    const { data } = await api.post(`/programs/${id}/upload-template`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
};

export const updateProgram = async (id, programData) => {
    const { data } = await api.put(`/programs/${id}`, programData);
    return data;
};

export const deleteProgram = async (id) => {
    const { data } = await api.delete(`/programs/${id}`);
    return data;
};

export const adminInviteStudent = async (inviteData) => {
    const { data } = await api.post('/admin/invite', inviteData);
    return data;
};

export const exportPrograms = async () => {
    const response = await api.get('/programs/export', {
        responseType: 'blob',
    });
    return response;
};

// Quiz APIs
export const createQuiz = async (quizData) => {
    const { data } = await api.post('/quiz', quizData);
    return data;
};

export const getAllQuizzes = async () => {
    const { data } = await api.get('/quiz/all');
    return data;
};

export const getQuizzesByProgram = async (programId) => {
    const { data } = await api.get(`/quiz/${programId}`);
    return data;
};

export const updateQuiz = async (id, quizData) => {
    const { data } = await api.patch(`/quiz/${id}`, quizData);
    return data;
};

export const deleteQuiz = async (id) => {
    const { data } = await api.delete(`/quiz/${id}`);
    return data;
};

export const publishQuiz = async (id) => {
    const { data } = await api.patch(`/quiz/${id}/publish`);
    return data;
};

export const unpublishQuiz = async (id) => {
    const { data } = await api.patch(`/quiz/${id}/unpublish`);
    return data;
};

export const attemptQuiz = async (id, answers) => {
    const { data } = await api.post(`/quiz/${id}/attempt`, { answers });
    return data;
};

export const getStudentQuizzes = async () => {
    const { data } = await api.get('/quiz/my-quizzes');
    return data;
};

export const uploadQuizImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await api.post('/quiz/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
};

export const uploadQuizFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/quiz/upload-file', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return data;
};

export const getQuizReports = async (id) => {
    const { data } = await api.get(`/quiz/${id}/reports`);
    return data;
};

export const getQuizAttempt = async (id) => {
    const { data } = await api.get(`/quiz/attempt/${id}`);
    return data;
};

export const getQuiz = async (id) => {
    const { data } = await api.get(`/quiz/detail/${id}`);
    return data;
};

// Dashboard & Enrollment APIs
export const checkUser = async (email) => {
    const { data } = await api.post('/auth/check-user', { email });
    return data;
};

export const getMyEnrollments = async () => {
    const { data } = await api.get('/me/enrollments');
    return data;
};

export const updateMyProfile = async (profileData) => {
    const { data } = await api.put('/me/profile', profileData);
    return data;
};

export const getDashboardOverview = async () => {
    const { data } = await api.get('/me/dashboard');
    return data;
};

export const getMyQuizzes = async () => {
    const { data } = await api.get('/me/quizzes');
    return data;
};

export const getMyQuiz = async (id) => {
    const { data } = await api.get(`/me/quizzes/${id}`);
    return data;
};

export const getMyFeedbacks = async () => {
    const { data } = await api.get('/me/feedbacks');
    return data;
};

export const getMyFeedback = async (id) => {
    const { data } = await api.get(`/me/feedbacks/${id}`);
    return data;
};

export const getProgramProgress = async (programId) => {
    const { data } = await api.get(`/me/program/${programId}/progress`);
    return data;
};

// Payment APIs
export const createPaymentOrder = async (orderData) => {
    const { data } = await api.post('/payments/create-order', orderData);
    return data;
};

export const verifyPayment = async (verifyData) => {
    const { data } = await api.post('/payments/verify', verifyData);
    return data;
};

export const enrollFree = async (programId) => {
    const { data } = await api.post('/payments/enroll-free', { programId });
    return data;
};

// Feedback APIs
export const getAdminFeedbacks = async () => {
    const { data } = await api.get('/feedback/admin');
    return data;
};

export const createFeedback = async (feedbackData) => {
    const { data } = await api.post('/feedback/admin', feedbackData);
    return data;
};

export const getFeedback = async (id) => {
    const { data } = await api.get(`/feedback/admin/${id}`);
    return data;
};

export const updateFeedback = async (id, feedbackData) => {
    const { data } = await api.put(`/feedback/admin/${id}`, feedbackData);
    return data;
};

export const publishFeedback = async (id) => {
    const { data } = await api.patch(`/feedback/admin/${id}/publish`);
    return data;
};

export const unpublishFeedback = async (id) => {
    const { data } = await api.patch(`/feedback/admin/${id}/unpublish`);
    return data;
};

export const deleteFeedback = async (id) => {
    const { data } = await api.delete(`/feedback/admin/${id}`);
    return data;
};

export const getAdminDashboardStats = async () => {
    const { data } = await api.get('/admin/dashboard');
    return data;
};

export const updateStudentDetails = async (studentId, updates) => {
    const { data } = await api.put(`/admin/students/${studentId}`, updates);
    return data;
};

// Duplicate removed
export const getMyFeedbacksOld = async () => {
    // Deprecated
    return [];
};

export const getAdminEnrollments = async (filters) => {
    const params = new URLSearchParams(filters).toString();
    const res = await api.get(`/admin/enrollments?${params}`);
    return res.data;
};

export const exportEnrollments = async (filters) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/admin/enrollments/export?${params}`, {
        responseType: 'blob',
    });
    return response;
};

export const getStudentCredentials = async (studentId, adminPassword) => {
    const res = await api.post('/admin/credentials', { studentId, adminPassword });
    return res.data;
};

export const resendStudentCredentials = async (studentId, adminPassword) => {
    const res = await api.post('/admin/credentials/resend', { studentId, adminPassword });
    return res.data;
};

export const getFeedbackForSubmission = async (id) => {
    const { data } = await api.get(`/feedback/me/${id}`);
    return data;
};

export const submitFeedback = async (id, answers) => {
    const { data } = await api.post(`/feedback/me/${id}`, { answers });
    return data;
};

export const exportFeedback = async (id) => {
    const response = await api.get(`/feedback/admin/${id}/export`, {
        responseType: 'blob', // Important for file download
    });
    return response;
};

// Default Feedback APIs
export const toggleProgramFeedback = async (id) => {
    const { data } = await api.patch(`/programs/${id}/toggle-feedback`);
    return data;
};

export const getPendingDefaultFeedbacks = async () => {
    const { data } = await api.get('/feedback/me/default-pending');
    return data;
};

export const submitDefaultFeedback = async (feedbackData) => {
    const { data } = await api.post('/feedback/me/default', feedbackData);
    return data;
};

export const submitPublicFeedback = async (feedbackData) => {
    const { data } = await api.post('/feedback/public', feedbackData);
    return data;
};

// Certificates
export const publishCertificates = async (programId) => {
    const { data } = await api.post(`/admin/programs/${programId}/publish-certificates`);
    return data;
};

export const publishOfferLetters = async (programId, force = false) => {
    const { data } = await api.post(`/admin/programs/${programId}/publish-offer-letters?force=${force}`);
    return data;
};

export const regenerateCertificate = async (enrollmentId) => {
    const { data } = await api.post(`/certificates/regenerate/${enrollmentId}`);
    return data;
};

export const publishSingleCertificate = async (enrollmentId, force = false) => {
    const { data } = await api.post(`/certificates/publish/${enrollmentId}?force=${force}`);
    return data;
};

// WhatsApp Templates
export const getWhatsAppTemplates = async () => {
    const { data } = await api.get('/admin/whatsapp/templates');
    return data;
};

export const registerWhatsAppTemplate = async (templateData) => {
    const { data } = await api.post('/admin/whatsapp/templates', templateData);
    return data;
};

// Outsider Quiz APIs
export const createOutsiderQuiz = async (quizData) => {
    const { data } = await api.post('/outsider-quiz/admin', quizData);
    return data;
};

export const uploadOutsiderQuizTemplate = async (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    // Explicitly unset Content-Type so browser sets it with boundary
    const { data } = await api.post(`/outsider-quiz/admin/${id}/upload-template`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return data;
};

export const getOutsiderQuizzes = async () => {
    const { data } = await api.get('/outsider-quiz/admin');
    return data;
};

export const getOutsiderQuizAdmin = async (id) => {
    const { data } = await api.get(`/outsider-quiz/admin/${id}`);
    return data;
};

export const updateOutsiderQuiz = async (id, quizData) => {
    const { data } = await api.put(`/outsider-quiz/admin/${id}`, quizData);
    return data;
};

export const getOutsiderQuizResults = async (id) => {
    const { data } = await api.get(`/outsider-quiz/admin/${id}/results`);
    return data;
};

export const getPublicOutsiderQuiz = async (id) => {
    const { data } = await api.get(`/outsider-quiz/public/${id}`);
    return data;
};

export const submitPublicOutsiderQuiz = async (id, submissionData) => {
    const { data } = await api.post(`/outsider-quiz/public/${id}/submit`, submissionData);
    return data;
};

export const duplicateOutsiderQuiz = async (id) => {
    const { data } = await api.post(`/outsider-quiz/admin/${id}/duplicate`);
    return data;
};

export default api;
